import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_model.dart';
import '../models/common_item_model.dart';
import '../models/order_model.dart';


class OrderService {
  final SupabaseClient _supabaseClient = Supabase.instance.client;

  // Create a new order with all details
  Future<String> createOrder({
    required String serviceType,
    required Map<String, dynamic> orderDetails,
    required String pickupAddress,
    required String pickupPincode,
    double? pickupLatitude,
    double? pickupLongitude,
    required String dropAddress,
    required String dropPincode,
    required List<CommonItemModel> commonItems,
    required List<Map<String, dynamic>> customItems,
    required Map<int, List<File>> customItemPhotos,
    List<Map<String, dynamic>>? serviceQuestions,
  }) async {
    try {
      // First upload all photos and get their paths
      final customItemsWithPhotoPaths = await _processCustomItemsWithPhotos(
        customItems,
        customItemPhotos,
      );

      // Convert order details to the format expected by the function
      final orderDetailsJson = orderDetails.entries.map((entry) {
        return {
          'name': entry.key,
          'value': entry.value.toString(),
        };
      }).toList();

      // Convert CommonItemModel objects to the format expected by the database
      final serializedCommonItems = commonItems
          .where((item) => item.quantity > 0) // Only include items with quantity > 0
          .map((item) => item.toOrderItemJson())
          .toList();

      // Call the database function to create the complete order atomically
      final response = await _supabaseClient.rpc(
        'create_complete_order',
        params: {
          'p_user_id': _supabaseClient.auth.currentUser!.id,
          'p_service_type': serviceType,
          'p_pickup_address': pickupAddress,
          'p_pickup_pincode': pickupPincode,
          'p_pickup_latitude': pickupLatitude,
          'p_pickup_longitude': pickupLongitude,
          'p_drop_address': dropAddress,
          'p_drop_pincode': dropPincode,
          'p_order_details': orderDetailsJson,
          'p_common_items': serializedCommonItems,
          'p_custom_items': customItemsWithPhotoPaths,
          'p_service_questions': serviceQuestions ?? [],
        },
      );

      return response as String; // Returns the order ID
    } catch (e) {
      print('Error creating order: $e');
      rethrow;
    }
  }

  // Helper method to upload photos and process custom items
  Future<List<Map<String, dynamic>>> _processCustomItemsWithPhotos(
    List<Map<String, dynamic>> customItems,
    Map<int, List<File>> customItemPhotos,
  ) async {
    final userId = _supabaseClient.auth.currentUser!.id;
    final result = <Map<String, dynamic>>[];

    for (int i = 0; i < customItems.length; i++) {
      final item = Map<String, dynamic>.from(customItems[i]);
      final photos = customItemPhotos[i] ?? [];
      final photoPaths = <String>[];

      // Upload each photo to storage
      for (final photo in photos) {
        final fileName = '${DateTime.now().millisecondsSinceEpoch}_${photo.path.split('/').last}';
        final storagePath = '$userId/$fileName';
        
        await _supabaseClient.storage
            .from('order_photos')
            .upload(storagePath, photo);

        photoPaths.add(storagePath);
      }

      item['photos'] = photoPaths;
      result.add(item);
    }

    return result;
  }

  // Get all orders for the current user
  Future<List<OrderModel>> getUserOrders() async {
    try {
      final response = await _supabaseClient
          .from('orders')
          .select('''
            *,
            order_details(*),
            common_items_in_orders(*, common_item:common_items(*)),
            custom_items(*, item_photos(*)),
            order_question_answers(*)
          ''')
          .order('created_at', ascending: false);

      return response.map<OrderModel>((order) => OrderModel.fromJson(order)).toList();
    } catch (e) {
      print('Error fetching orders: $e');
      rethrow;
    }
  }

  // Get a specific order by ID with all related data
  Future<OrderModel> getOrderById(String orderId) async {
    try {
      final response = await _supabaseClient
          .from('orders')
          .select('''
            *,
            order_details(*),
            common_items_in_orders(*, common_item:common_items(*)),
            custom_items(*, item_photos(*)),
            order_question_answers(*)
          ''')
          .eq('id', orderId)
          .single();

      return OrderModel.fromJson(response);
    } catch (e) {
      print('Error fetching order: $e');
      rethrow;
    }
  }

  // Update order status
  Future<void> updateOrderStatus(String orderId, String status) async {
    try {
      await _supabaseClient
          .from('orders')
          .update({'status': status})
          .eq('id', orderId);
    } catch (e) {
      print('Error updating order status: $e');
      rethrow;
    }
  }

  // Update order price
  Future<void> updateOrderPrice(String orderId, double price) async {
    try {
      await _supabaseClient
          .from('orders')
          .update({'approx_price': price})
          .eq('id', orderId);
    } catch (e) {
      print('Error updating order price: $e');
      rethrow;
    }
  }

  // Update an existing order
  Future<void> updateOrder(OrderModel order) async {
    final Map<String, dynamic> orderData = order.toJson();
    try {
      final String orderId = orderData['id'];
      
      // Update the main order record
      await _supabaseClient
          .from('orders')
          .update({
            'service_type': orderData['service_type'],
            'pickup_address': orderData['pickup_address'],
            'pickup_pincode': orderData['pickup_pincode'],
            'pickup_latitude': orderData['pickup_latitude'],
            'pickup_longitude': orderData['pickup_longitude'],
            'drop_address': orderData['drop_address'],
            'drop_pincode': orderData['drop_pincode'],
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', orderId);
      
      // Handle common items - first delete existing ones from junction table
      await _supabaseClient
          .from('common_items_in_orders')
          .delete()
          .eq('order_id', orderId);
      
      // Insert updated common items to junction table
      if (orderData['common_items'] != null && (orderData['common_items'] as List).isNotEmpty) {
        final commonItems = (orderData['common_items'] as List).map((item) {
          // Prepare data for common_items_in_orders junction table
          final serializedItem = Map<String, dynamic>.from(item);
          serializedItem.remove('icon');
          
          return {
            'order_id': orderId,
            'item_id': serializedItem['id'],
            'name': serializedItem['name'],
            'description': serializedItem['description'] ?? '',
            'image_url': serializedItem['image_url'] ?? '',
            'quantity': serializedItem['quantity'],
          };
        }).toList();
        
        await _supabaseClient
            .from('common_items_in_orders')
            .insert(commonItems);
      }
      
      // Handle custom items - first delete existing ones and their photos
      final existingCustomItems = await _supabaseClient
          .from('custom_items')
          .select('id')
          .eq('order_id', orderId);
      
      for (final item in existingCustomItems) {
        // Delete associated photos
        await _supabaseClient
            .from('item_photos')
            .delete()
            .eq('custom_item_id', item['id']);
      }
      
      // Delete all custom items
      await _supabaseClient
          .from('custom_items')
          .delete()
          .eq('order_id', orderId);
      
      // Insert updated custom items and their photos
      if (orderData['custom_items'] != null && (orderData['custom_items'] as List).isNotEmpty) {
        for (final item in orderData['custom_items']) {
          // Insert custom item
          final customItemResponse = await _supabaseClient
              .from('custom_items')
              .insert({
                'order_id': orderId,
                'name': item['name'],
                'description': item['description'] ?? '',
                'quantity': item['quantity'] ?? 1,
              })
              .select()
              .single();
          
          final customItemId = customItemResponse['id'];
          
          // Handle photos
          if (item['photos'] != null && (item['photos'] as List).isNotEmpty) {
            for (final photoPath in item['photos']) {
              // If it's a local file path, upload it
              if (photoPath.startsWith('/') || photoPath.contains('\\')) {
                final file = File(photoPath);
                final fileName = '${DateTime.now().millisecondsSinceEpoch}_${file.path.split('/').last}';
                final storagePath = '${_supabaseClient.auth.currentUser!.id}/$fileName';
                
                await _supabaseClient.storage
                    .from('order_photos')
                    .upload(storagePath, file);
                
                // Insert photo record
                await _supabaseClient
                    .from('item_photos')
                    .insert({
                      'custom_item_id': customItemId,
                      'photo_url': storagePath,
                    });
              } else {
                // It's already a storage path, just insert the record
                await _supabaseClient
                    .from('item_photos')
                    .insert({
                      'custom_item_id': customItemId,
                      'photo_url': photoPath,
                    });
              }
            }
          }
        }
      }
      
      // Handle order details - first delete existing ones
      await _supabaseClient
          .from('order_details')
          .delete()
          .eq('order_id', orderId);
      
      // Insert updated order details
      if (orderData['order_details'] != null && (orderData['order_details'] as List).isNotEmpty) {
        final orderDetails = (orderData['order_details'] as List).map((detail) {
          return {
            'order_id': orderId,
            'name': detail['name'],
            'value': detail['value'],
          };
        }).toList();
        
        await _supabaseClient
            .from('order_details')
            .insert(orderDetails);
      }
      
      // Handle question answers - first delete existing ones
      await _supabaseClient
          .from('order_question_answers')
          .delete()
          .eq('order_id', orderId);
      
      // Insert updated question answers
      if (orderData['question_answers'] != null && (orderData['question_answers'] as List).isNotEmpty) {
        final questionAnswers = (orderData['question_answers'] as List).map((answer) {
          return {
            'order_id': orderId,
            'question_id': answer['question_id'],
            'question': answer['question'],
            'answer': answer['answer'],
            'question_type': answer['question_type'],
            'parent_question_id': answer['parent_question_id'],
            'additional_data': answer['additional_data'],
          };
        }).toList();
        
        await _supabaseClient
            .from('order_question_answers')
            .insert(questionAnswers);
      }
    } catch (e) {
      print('Error updating order: $e');
      rethrow;
    }
  }
}