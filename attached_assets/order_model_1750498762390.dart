import 'package:flutter/material.dart';
import 'common_item_model.dart';

enum OrderStatus {
  pending,
  priceUpdated,
  priceAccepted,
  inProgress,
  completed,
  cancelled;
  
  static OrderStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return OrderStatus.pending;
      case 'price updated':
        return OrderStatus.priceUpdated;
      case 'price accepted':
        return OrderStatus.priceAccepted;
      case 'in progress':
        return OrderStatus.inProgress;
      case 'completed':
        return OrderStatus.completed;
      case 'cancelled':
        return OrderStatus.cancelled;
      default:
        return OrderStatus.pending;
    }
  }
  
  String toDisplayString() {
    switch (this) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.priceUpdated:
        return 'Price Updated';
      case OrderStatus.priceAccepted:
        return 'Price Accepted';
      case OrderStatus.inProgress:
        return 'In Progress';
      case OrderStatus.completed:
        return 'Completed';
      case OrderStatus.cancelled:
        return 'Cancelled';
    }
  }
  
  Color getStatusColor() {
    switch (this) {
      case OrderStatus.pending:
        return Colors.orange;
      case OrderStatus.priceUpdated:
        return Colors.orange;
      case OrderStatus.priceAccepted:
        return Colors.purple;
      case OrderStatus.inProgress:
        return Colors.blue;
      case OrderStatus.completed:
        return Colors.green;
      case OrderStatus.cancelled:
        return Colors.red;
    }
  }
  
  bool get isEditable => this == OrderStatus.pending;
}

class OrderModel {
  final String id;
  final String userId;
  final String serviceType;
  final String status;
  final String pickupAddress;
  final String pickupPincode;
  final double? pickupLatitude;
  final double? pickupLongitude;
  final String dropAddress;
  final String dropPincode;
  final double? approxPrice;
  final Map<String, dynamic> orderDetails;
  final List<CommonItemModel> commonItems;
  final List<Map<String, dynamic>> customItems;
  final List<Map<String, dynamic>> questionAnswers; // Added field for question answers
  final DateTime createdAt;
  final DateTime updatedAt;

  OrderModel({
    required this.id,
    required this.userId,
    required this.serviceType,
    required this.status,
    required this.pickupAddress,
    required this.pickupPincode,
    this.pickupLatitude,
    this.pickupLongitude,
    required this.dropAddress,
    required this.dropPincode,
    this.approxPrice,
    required this.orderDetails,
    required this.commonItems,
    required this.customItems,
    required this.questionAnswers, // Added parameter
    required this.createdAt,
    required this.updatedAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    // Process common items
    List<CommonItemModel> commonItems = [];
    if (json['common_items_in_orders'] != null) {
      commonItems = List<CommonItemModel>.from(
        (json['common_items_in_orders'] as List).map(
          (item) {
            // Extract the common_item data and add quantity from the junction table
            final commonItem = Map<String, dynamic>.from(item['common_item']);
            commonItem['quantity'] = item['quantity'] ?? 0;
            return CommonItemModel.fromJson(commonItem);
          },
        ),
      );
    }

    // Process custom items
    List<Map<String, dynamic>> customItems = [];
    if (json['custom_items'] != null) {
      customItems = List<Map<String, dynamic>>.from(
        (json['custom_items'] as List).map(
          (item) => Map<String, dynamic>.from(item),
        ),
      );
    }

    // Process order details
    Map<String, dynamic> orderDetails = {};
    if (json['order_details'] != null) {
      for (var detail in json['order_details'] as List) {
        orderDetails[detail['name'] ?? ''] = detail['value'] ?? '';
      }
    }

    // Process question answers
    List<Map<String, dynamic>> questionAnswers = [];
    if (json['order_question_answers'] != null) {
      questionAnswers = List<Map<String, dynamic>>.from(
        (json['order_question_answers'] as List).map(
          (item) => Map<String, dynamic>.from(item),
        ),
      );
    }

    return OrderModel(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      serviceType: json['service_type'] ?? '',
      status: json['status'] ?? 'Pending',
      pickupAddress: json['pickup_address'] ?? '',
      pickupPincode: json['pickup_pincode'] ?? '',
      pickupLatitude: json['pickup_latitude'],
      pickupLongitude: json['pickup_longitude'],
      dropAddress: json['drop_address'] ?? '',
      dropPincode: json['drop_pincode'] ?? '',
      approxPrice: json['approx_price'] != null
          ? double.tryParse(json['approx_price'].toString())
          : null,
      orderDetails: orderDetails,
      commonItems: commonItems,
      customItems: customItems,
      questionAnswers: questionAnswers, // Added field
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    // Convert order details to list format for database
    List<Map<String, dynamic>> orderDetailsList = [];
    orderDetails.forEach((key, value) {
      orderDetailsList.add({
        'name': key,
        'value': value.toString(),
      });
    });

    // Convert common items to list format for database
    List<Map<String, dynamic>> commonItemsList = commonItems
        .map((item) => item.toOrderItemJson())
        .toList();

    return {
      'id': id,
      'user_id': userId,
      'service_type': serviceType,
      'status': status,
      'pickup_address': pickupAddress,
      'pickup_pincode': pickupPincode,
      'pickup_latitude': pickupLatitude,
      'pickup_longitude': pickupLongitude,
      'drop_address': dropAddress,
      'drop_pincode': dropPincode,
      'approx_price': approxPrice?.toString(),
      'order_details': orderDetailsList,
      'common_items': commonItemsList,
      'custom_items': customItems,
      'question_answers': questionAnswers, // Include question answers
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  OrderStatus get orderStatus => OrderStatus.fromString(status);
  
  bool get isEditable => orderStatus.isEditable;

  OrderModel copyWith({
    String? id,
    String? userId,
    String? serviceType,
    String? status,
    String? pickupAddress,
    String? pickupPincode,
    double? pickupLatitude,
    double? pickupLongitude,
    String? dropAddress,
    String? dropPincode,
    double? approxPrice,
    Map<String, dynamic>? orderDetails,
    List<CommonItemModel>? commonItems,
    List<Map<String, dynamic>>? customItems,
    List<Map<String, dynamic>>? questionAnswers, // Added parameter
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return OrderModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      serviceType: serviceType ?? this.serviceType,
      status: status ?? this.status,
      pickupAddress: pickupAddress ?? this.pickupAddress,
      pickupPincode: pickupPincode ?? this.pickupPincode,
      pickupLatitude: pickupLatitude ?? this.pickupLatitude,
      pickupLongitude: pickupLongitude ?? this.pickupLongitude,
      dropAddress: dropAddress ?? this.dropAddress,
      dropPincode: dropPincode ?? this.dropPincode,
      approxPrice: approxPrice ?? this.approxPrice,
      orderDetails: orderDetails ?? this.orderDetails,
      commonItems: commonItems ?? this.commonItems,
      customItems: customItems ?? this.customItems,
      questionAnswers: questionAnswers ?? this.questionAnswers, // Added field
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}