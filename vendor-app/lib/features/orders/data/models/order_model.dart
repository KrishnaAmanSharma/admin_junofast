class OrderModel {
  final String id;
  final String serviceType;
  final String status;
  final double? estimatedPrice;
  final double? finalPrice;
  final DateTime createdAt;
  final DateTime? scheduledDate;
  final String city;
  final String pickupAddress;
  final String deliveryAddress;
  final List<CommonItemModel> commonItems;
  final List<CustomItemModel> customItems;
  final List<QuestionAnswerModel> questionAnswers;
  final String? specialInstructions;
  final String? vendorId;
  final double? distance;
  final int priority;
  final String? customerContactMasked; // Only shows after acceptance
  
  // Broadcast system fields
  String? broadcastId;
  DateTime? broadcastExpiresAt;

  OrderModel({
    required this.id,
    required this.serviceType,
    required this.status,
    this.estimatedPrice,
    this.finalPrice,
    required this.createdAt,
    this.scheduledDate,
    required this.city,
    required this.pickupAddress,
    required this.deliveryAddress,
    required this.commonItems,
    required this.customItems,
    required this.questionAnswers,
    this.specialInstructions,
    this.vendorId,
    this.distance,
    this.priority = 1,
    this.customerContactMasked,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] ?? '',
      serviceType: json['service_type'] ?? '',
      status: json['status'] ?? '',
      estimatedPrice: json['estimated_price']?.toDouble(),
      finalPrice: json['final_price']?.toDouble(),
      createdAt: DateTime.parse(json['created_at']),
      scheduledDate: json['scheduled_date'] != null 
          ? DateTime.parse(json['scheduled_date']) 
          : null,
      city: json['city'] ?? '',
      pickupAddress: json['pickup_address'] ?? '',
      deliveryAddress: json['delivery_address'] ?? '',
      commonItems: (json['common_items'] as List<dynamic>?)
          ?.map((item) => CommonItemModel.fromJson(item))
          .toList() ?? [],
      customItems: (json['custom_items'] as List<dynamic>?)
          ?.map((item) => CustomItemModel.fromJson(item))
          .toList() ?? [],
      questionAnswers: (json['question_answers'] as List<dynamic>?)
          ?.map((qa) => QuestionAnswerModel.fromJson(qa))
          .toList() ?? [],
      specialInstructions: json['special_instructions'],
      vendorId: json['vendor_id'],
      distance: json['distance']?.toDouble(),
      priority: json['priority'] ?? 1,
      customerContactMasked: json['customer_contact_masked'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'service_type': serviceType,
      'status': status,
      'estimated_price': estimatedPrice,
      'final_price': finalPrice,
      'created_at': createdAt.toIso8601String(),
      'scheduled_date': scheduledDate?.toIso8601String(),
      'city': city,
      'pickup_address': pickupAddress,
      'delivery_address': deliveryAddress,
      'common_items': commonItems.map((item) => item.toJson()).toList(),
      'custom_items': customItems.map((item) => item.toJson()).toList(),
      'question_answers': questionAnswers.map((qa) => qa.toJson()).toList(),
      'special_instructions': specialInstructions,
      'vendor_id': vendorId,
      'distance': distance,
      'priority': priority,
      'customer_contact_masked': customerContactMasked,
    };
  }

  OrderModel copyWith({
    String? id,
    String? serviceType,
    String? status,
    double? estimatedPrice,
    double? finalPrice,
    DateTime? createdAt,
    DateTime? scheduledDate,
    String? city,
    String? pickupAddress,
    String? deliveryAddress,
    List<CommonItemModel>? commonItems,
    List<CustomItemModel>? customItems,
    List<QuestionAnswerModel>? questionAnswers,
    String? specialInstructions,
    String? vendorId,
    double? distance,
    int? priority,
    String? customerContactMasked,
  }) {
    return OrderModel(
      id: id ?? this.id,
      serviceType: serviceType ?? this.serviceType,
      status: status ?? this.status,
      estimatedPrice: estimatedPrice ?? this.estimatedPrice,
      finalPrice: finalPrice ?? this.finalPrice,
      createdAt: createdAt ?? this.createdAt,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      city: city ?? this.city,
      pickupAddress: pickupAddress ?? this.pickupAddress,
      deliveryAddress: deliveryAddress ?? this.deliveryAddress,
      commonItems: commonItems ?? this.commonItems,
      customItems: customItems ?? this.customItems,
      questionAnswers: questionAnswers ?? this.questionAnswers,
      specialInstructions: specialInstructions ?? this.specialInstructions,
      vendorId: vendorId ?? this.vendorId,
      distance: distance ?? this.distance,
      priority: priority ?? this.priority,
      customerContactMasked: customerContactMasked ?? this.customerContactMasked,
    );
  }

  bool get isAvailable => status == 'pending' && vendorId == null;
  bool get isAssigned => vendorId != null;
  bool get canAccept => isAvailable;
  bool get canRequestPriceUpdate => isAssigned && status != 'completed';
  
  String get formattedPrice {
    final price = finalPrice ?? estimatedPrice;
    if (price == null) return 'Price not set';
    return '\$${price.toStringAsFixed(2)}';
  }

  String get statusDisplayText {
    switch (status) {
      case 'pending':
        return 'Available';
      case 'assigned':
        return 'Assigned';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'price_updated':
        return 'Price Updated';
      default:
        return status.toUpperCase();
    }
  }
}

class CommonItemModel {
  final String id;
  final String name;
  final int quantity;
  final String? description;
  final String? imageUrl;

  CommonItemModel({
    required this.id,
    required this.name,
    required this.quantity,
    this.description,
    this.imageUrl,
  });

  factory CommonItemModel.fromJson(Map<String, dynamic> json) {
    return CommonItemModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      quantity: json['quantity'] ?? 0,
      description: json['description'],
      imageUrl: json['image_url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'quantity': quantity,
      'description': description,
      'image_url': imageUrl,
    };
  }
}

class CustomItemModel {
  final String id;
  final String name;
  final int quantity;
  final String? description;
  final double? weight;
  final String? dimensions;

  CustomItemModel({
    required this.id,
    required this.name,
    required this.quantity,
    this.description,
    this.weight,
    this.dimensions,
  });

  factory CustomItemModel.fromJson(Map<String, dynamic> json) {
    return CustomItemModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      quantity: json['quantity'] ?? 0,
      description: json['description'],
      weight: json['weight']?.toDouble(),
      dimensions: json['dimensions'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'quantity': quantity,
      'description': description,
      'weight': weight,
      'dimensions': dimensions,
    };
  }
}

class QuestionAnswerModel {
  final String questionId;
  final String question;
  final String questionType;
  final dynamic answer;

  QuestionAnswerModel({
    required this.questionId,
    required this.question,
    required this.questionType,
    required this.answer,
  });

  factory QuestionAnswerModel.fromJson(Map<String, dynamic> json) {
    return QuestionAnswerModel(
      questionId: json['question_id'] ?? '',
      question: json['question'] ?? '',
      questionType: json['question_type'] ?? '',
      answer: json['answer'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'question_id': questionId,
      'question': question,
      'question_type': questionType,
      'answer': answer,
    };
  }

  String get formattedAnswer {
    if (answer == null) return 'No answer';
    
    switch (questionType) {
      case 'boolean':
        return answer ? 'Yes' : 'No';
      case 'date':
        try {
          final date = DateTime.parse(answer.toString());
          return '${date.day}/${date.month}/${date.year}';
        } catch (e) {
          return answer.toString();
        }
      case 'number':
        return answer.toString();
      default:
        return answer.toString();
    }
  }
}