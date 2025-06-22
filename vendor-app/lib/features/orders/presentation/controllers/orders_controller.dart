import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/models/order_model.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/services/auth_service.dart';

class OrdersController extends GetxController {
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

  @override
  void onInit() {
    super.onInit();
    loadAvailableOrders();
    loadMyOrders();
  }

  Future<void> loadAvailableOrders() async {
    _setLoading(true);
    try {
      // Get vendor's service types and city for filtering
      final authService = Get.find<AuthService>();
      final vendorProfile = authService.vendorProfile;
      
      if (vendorProfile == null) {
        throw Exception('Vendor profile not found');
      }

      final vendorServiceTypes = List<String>.from(vendorProfile['service_types'] ?? []);
      final vendorCity = vendorProfile['city'] ?? '';

      // Query available orders (pending status, no vendor assigned)
      final response = await _supabase
          .from('orders')
          .select('''
            *,
            order_common_items (
              id,
              quantity,
              common_items (
                id,
                name,
                description,
                image_url
              )
            ),
            order_custom_items (*),
            order_question_answers (
              question_id,
              answer,
              service_questions (
                question,
                question_type
              )
            )
          ''')
          .eq('status', AppConstants.orderStatusPending)
          .is_('vendor_id', null)
          .in_('service_type', vendorServiceTypes)
          .eq('city', vendorCity)
          .order('created_at', ascending: false);

      _availableOrders.clear();
      for (final orderData in response) {
        final order = _parseOrderFromResponse(orderData);
        _availableOrders.add(order);
      }

      _error = null;
    } catch (e) {
      _error = 'Failed to load available orders: ${e.toString()}';
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadMyOrders() async {
    try {
      final authService = Get.find<AuthService>();
      final vendorId = authService.currentUser?.id;
      
      if (vendorId == null) return;

      final response = await _supabase
          .from('orders')
          .select('''
            *,
            profiles!orders_user_id_fkey (
              full_name,
              phone_number,
              email
            ),
            order_common_items (
              id,
              quantity,
              common_items (
                id,
                name,
                description,
                image_url
              )
            ),
            order_custom_items (*),
            order_question_answers (
              question_id,
              answer,
              service_questions (
                question,
                question_type
              )
            )
          ''')
          .eq('vendor_id', vendorId)
          .order('created_at', ascending: false);

      _myOrders.clear();
      for (final orderData in response) {
        final order = _parseOrderFromResponse(orderData, includeCustomerInfo: true);
        _myOrders.add(order);
      }
    } catch (e) {
      print('Error loading my orders: $e');
    }
  }

  Future<bool> acceptOrder(String orderId, double? proposedPrice) async {
    _setAcceptingOrder(true);
    try {
      final authService = Get.find<AuthService>();
      final vendorId = authService.currentUser?.id;
      
      if (vendorId == null) {
        throw Exception('Vendor not authenticated');
      }

      // Update order with vendor assignment
      final updateData = {
        'vendor_id': vendorId,
        'status': AppConstants.orderStatusAssigned,
        'accepted_at': DateTime.now().toIso8601String(),
      };

      if (proposedPrice != null) {
        updateData['final_price'] = proposedPrice;
      }

      await _supabase
          .from('orders')
          .update(updateData)
          .eq('id', orderId);

      // Remove from available orders and refresh my orders
      _availableOrders.removeWhere((order) => order.id == orderId);
      await loadMyOrders();

      Get.snackbar(
        'Success',
        AppConstants.successOrderAccepted,
        backgroundColor: AppConstants.successColor,
        colorText: Colors.white,
      );

      return true;
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to accept order: ${e.toString()}',
        backgroundColor: AppConstants.errorColor,
        colorText: Colors.white,
      );
      return false;
    } finally {
      _setAcceptingOrder(false);
    }
  }

  Future<bool> requestPriceUpdate(String orderId, double newPrice, String reason) async {
    try {
      // Create price update request
      await _supabase.from('price_update_requests').insert({
        'order_id': orderId,
        'vendor_id': Get.find<AuthService>().currentUser?.id,
        'requested_price': newPrice,
        'reason': reason,
        'status': 'pending',
        'created_at': DateTime.now().toIso8601String(),
      });

      // Update order status
      await _supabase
          .from('orders')
          .update({
            'status': AppConstants.orderStatusPriceUpdated,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', orderId);

      await loadMyOrders();

      Get.snackbar(
        'Success',
        AppConstants.successPriceUpdateRequested,
        backgroundColor: AppConstants.successColor,
        colorText: Colors.white,
      );

      return true;
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to request price update: ${e.toString()}',
        backgroundColor: AppConstants.errorColor,
        colorText: Colors.white,
      );
      return false;
    }
  }

  Future<bool> updateOrderStatus(String orderId, String newStatus) async {
    try {
      await _supabase
          .from('orders')
          .update({
            'status': newStatus,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', orderId);

      await loadMyOrders();
      return true;
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to update order status: ${e.toString()}',
        backgroundColor: AppConstants.errorColor,
        colorText: Colors.white,
      );
      return false;
    }
  }

  OrderModel? getOrderById(String orderId) {
    try {
      return _myOrders.firstWhere((order) => order.id == orderId);
    } catch (e) {
      return _availableOrders.firstWhereOrNull((order) => order.id == orderId);
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    update();
  }

  void _setAcceptingOrder(bool accepting) {
    _isAcceptingOrder = accepting;
    update();
  }

  OrderModel _parseOrderFromResponse(Map<String, dynamic> data, {bool includeCustomerInfo = false}) {
    // Parse common items
    final commonItemsData = data['order_common_items'] as List<dynamic>? ?? [];
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
    final customItemsData = data['order_custom_items'] as List<dynamic>? ?? [];
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
      id: data['id'],
      serviceType: data['service_type'],
      status: data['status'],
      estimatedPrice: data['estimated_price']?.toDouble(),
      finalPrice: data['final_price']?.toDouble(),
      createdAt: DateTime.parse(data['created_at']),
      scheduledDate: data['scheduled_date'] != null 
          ? DateTime.parse(data['scheduled_date']) 
          : null,
      city: data['city'],
      pickupAddress: data['pickup_address'],
      deliveryAddress: data['delivery_address'],
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