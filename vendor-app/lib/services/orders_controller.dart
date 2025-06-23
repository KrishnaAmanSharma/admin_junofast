import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/order_model.dart';
import '../configs/app_constants.dart';
import '../services/auth_service.dart';

class OrdersController extends ChangeNotifier {
  final List<OrderModel> _availableOrders = [];
  final List<OrderModel> _myOrders = [];
  bool _isLoading = false;
  bool _isAcceptingOrder = false;
  String? _error;

  List<OrderModel> get availableOrders => _availableOrders;
  List<OrderModel> get myOrders => _myOrders;
  bool get isLoading => _isLoading;
  bool get isAcceptingOrder => _isAcceptingOrder;
  String? get error => _error;

  final SupabaseClient _supabase = Supabase.instance.client;

  Future<void> loadAvailableOrders(AuthService authService) async {
    _setLoading(true);
    try {
      final vendorProfile = authService.vendorProfile;
      if (vendorProfile == null) {
        throw Exception('Vendor profile not found');
      }
      final vendorId = authService.currentUser?.id;
      if (vendorId == null) {
        throw Exception('Vendor not authenticated');
      }

      // Query order broadcasts sent to this vendor that are still pending
      final response = await _supabase
          .from('order_broadcasts')
          .select('''
            *,
            orders!inner (
              *,
              common_items_in_orders (
                id,
                quantity,
                common_items (
                  id,
                  name,
                  description,
                  image_url
                )
              ),
              custom_items (*),
              order_question_answers (
                question_id,
                answer,
                service_questions (
                  question,
                  question_type
                )
              )
            )
          ''')
          .eq('vendor_id', vendorId)
          .eq('status', 'pending')
          .gte('expires_at', DateTime.now().toIso8601String())
          .order('broadcast_at', ascending: false);

      print('[DEBUG] Supabase available orders response:');
      print(response);

      _availableOrders.clear();
      for (final broadcastData in response) {
        final orderData = broadcastData['orders'];
        final order = _parseOrderFromResponse(orderData);
        // Add broadcast info to the order
        order.broadcastId = broadcastData['id'];
        order.broadcastExpiresAt = DateTime.parse(broadcastData['expires_at']);
        _availableOrders.add(order);
      }

      print('[DEBUG] Parsed available orders:');
      print(_availableOrders);

      _error = null;
    } catch (e) {
      print('Failed to load available orders: ${e.toString()}');
      _error = 'Failed to load available orders: ${e.toString()}';
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadMyOrders(AuthService authService) async {
    try {
      if (authService.currentUser?.id == null) return;

      final response = await _supabase
          .from('orders')
          .select('''
            *,
            common_items_in_orders (
              id,
              quantity,
              common_items (
                id,
                name,
                description,
                image_url
              )
            ),
            custom_items (*),
            order_question_answers (
              question_id,
              answer,
              service_questions (
                question,
                question_type
              )
            )
          ''')
          .eq('vendor_id', authService.currentUser!.id)
          .order('created_at', ascending: false);

      print('[DEBUG] Supabase my orders response:');
      print(response);

      _myOrders.clear();
      for (final orderData in response) {
        final order = _parseOrderFromResponse(orderData, includeCustomerInfo: true);
        _myOrders.add(order);
      }

      print('[DEBUG] Parsed my orders:');
      print(_myOrders);
    } catch (e) {
      print('Error loading my orders: $e');
    }
  }

  Future<bool> acceptOrder(String orderId, double? proposedPrice, AuthService authService) async {
    _setAcceptingOrder(true);
    try {
      if (authService.currentUser?.id == null) {
        throw Exception('Vendor not authenticated');
      }

      // Find the broadcast record for this order and vendor
      final order = _availableOrders.firstWhere((o) => o.id == orderId);
      final broadcastId = order.broadcastId;
      
      if (broadcastId == null) {
        throw Exception('Broadcast not found');
      }

      // Always use the already available price for acceptance
      final acceptancePrice = order.finalPrice ?? order.approxPrice;

      // Update the broadcast status to accepted
      await _supabase
          .from('order_broadcasts')
          .update({
            'status': 'accepted',
            'response_at': DateTime.now().toIso8601String(),
          })
          .eq('id', broadcastId);

      // Insert vendor response (always 'accept' here)
      final responseData = {
        'broadcast_id': broadcastId,
        'order_id': orderId,
        'vendor_id': authService.currentUser?.id,
        'response_type': 'accept',
        'proposed_price': acceptancePrice,
        'created_at': DateTime.now().toIso8601String(),
      };
      await _supabase
          .from('vendor_responses')
          .insert(responseData);

      // Do NOT remove from available orders unless status is Confirmed
      await loadMyOrders(authService);
      return true;
    } catch (e) {
      return false;
    } finally {
      _setAcceptingOrder(false);
    }
  }

  Future<bool> rejectOrder(String orderId, String reason, AuthService authService) async {
    try {
      if (authService.currentUser?.id == null) {
        throw Exception('Vendor not authenticated');
      }

      // Find the broadcast record for this order and vendor
      final order = _availableOrders.firstWhere((o) => o.id == orderId);
      final broadcastId = order.broadcastId;
      
      if (broadcastId == null) {
        throw Exception('Broadcast not found');
      }

      // Update the broadcast status to rejected
      await _supabase
          .from('order_broadcasts')
          .update({
            'status': 'rejected',
            'response_at': DateTime.now().toIso8601String(),
          })
          .eq('id', broadcastId);

      // Insert vendor response (always 'reject' here)
      await _supabase
          .from('vendor_responses')
          .insert({
            'broadcast_id': broadcastId,
            'order_id': orderId,
            'vendor_id': authService.currentUser?.id,
            'response_type': 'reject',
            'message': reason,
            'created_at': DateTime.now().toIso8601String(),
          });

      // Remove from available orders
      _availableOrders.removeWhere((order) => order.id == orderId);
      notifyListeners();

      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> requestPriceUpdate(String orderId, double newPrice, String reason, AuthService authService) async {
    try {
      // Only allow one price update request per order per vendor
      final existingRequests = await _supabase
        .from('price_update_requests')
        .select()
        .eq('order_id', orderId)
        .eq('vendor_id', authService.currentUser?.id as String);
      if (existingRequests != null && existingRequests.isNotEmpty) {
        // Already requested
        return false;
      }

      // Insert price update request
      await _supabase.from('price_update_requests').insert({
        'order_id': orderId,
        'vendor_id': authService.currentUser?.id,
        'requested_price': newPrice,
        'reason': reason,
        'status': 'pending',
        'created_at': DateTime.now().toIso8601String(),
      });

      // Insert vendor response (type 'price_update')
      final order = _availableOrders.firstWhere((o) => o.id == orderId, orElse: () => _myOrders.firstWhere((o) => o.id == orderId));
      final broadcastId = order.broadcastId;
      if (broadcastId != null) {
        await _supabase
            .from('vendor_responses')
            .insert({
              'broadcast_id': broadcastId,
              'order_id': orderId,
              'vendor_id': authService.currentUser?.id,
              'response_type': 'price_update',
              'proposed_price': newPrice,
              'original_price': order.approxPrice ?? 0.0,
              'message': reason,
              'created_at': DateTime.now().toIso8601String(),
            });
      }

      await loadMyOrders(authService);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateOrderStatus(String orderId, String newStatus, AuthService authService) async {
    try {
      await _supabase
          .from('orders')
          .update({
            'status': newStatus,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', orderId);

      await loadMyOrders(authService);
      return true;
    } catch (e) {
      return false;
    }
  }

  OrderModel? getOrderById(String orderId, List<OrderModel> orders) {
    try {
      return orders.firstWhere((order) => order.id == orderId);
    } catch (e) {
      return null;
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setAcceptingOrder(bool accepting) {
    _isAcceptingOrder = accepting;
    notifyListeners();
  }

  OrderModel _parseOrderFromResponse(Map<String, dynamic> data, {bool includeCustomerInfo = false}) {
    // Parse common items
    final commonItemsData = data['common_items_in_orders'] as List<dynamic>? ?? [];
    final commonItems = commonItemsData.map((item) {
      final commonItemData = item['common_items'];
      return CommonItemModel(
        id: commonItemData['id'],
        name: commonItemData['name'],
        quantity: item['quantity'],
        description: commonItemData['description'],
        imageUrl: commonItemData['image_url'],
      );
    }).toList();

    // Parse custom items
    final customItemsData = data['custom_items'] as List<dynamic>? ?? [];
    final customItems = customItemsData.map((item) => CustomItemModel(
      id: item['id'],
      name: item['name'],
      quantity: item['quantity'],
      description: item['description'],
      weight: item['weight']?.toDouble(),
      dimensions: item['dimensions'],
    )).toList();

    // Parse question answers
    final qaData = data['order_question_answers'] as List<dynamic>? ?? [];
    final questionAnswers = qaData.map((qa) {
      final questionData = qa['service_questions'];
      return QuestionAnswerModel(
        questionId: qa['question_id'],
        question: questionData['question'],
        questionType: questionData['question_type'],
        answer: qa['answer'],
      );
    }).toList();

    // Customer contact info (only for assigned orders)
    String? customerContact;
    if (includeCustomerInfo && data['profiles'] != null) {
      final profile = data['profiles'];
      customerContact = '${profile['full_name']} - ${profile['phone_number']}';
    }

    return OrderModel(
      id: data['id'] ?? '',
      serviceType: data['service_type'] ?? '',
      status: data['status'] ?? '',
      approxPrice: data['approx_price']?.toDouble(),
      finalPrice: data['final_price']?.toDouble(),
      createdAt: DateTime.parse(data['created_at'] ?? DateTime.now().toIso8601String()),
      scheduledDate: data['scheduled_date'] != null 
          ? DateTime.parse(data['scheduled_date']) 
          : null,
      city: data['city'] ?? '',
      pickupAddress: data['pickup_address'] ?? '',
      deliveryAddress: data['drop_address'] ?? '',
      pickupPincode: data['pickup_pincode'] ?? '',
      dropPincode: data['drop_pincode'] ?? '',
      commonItems: commonItems,
      customItems: customItems,
      questionAnswers: questionAnswers,
      specialInstructions: data['special_instructions'],
      vendorId: data['vendor_id'],
      distance: data['distance']?.toDouble(),
      priority: data['priority'] ?? 1,
      customerContactMasked: customerContact,
    );
  }
}