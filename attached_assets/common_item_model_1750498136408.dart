import 'package:flutter/material.dart';

class CommonItemModel {
  final String id;
  final String serviceTypeId; // Foreign key to ServiceTypeModel
  final String name;
  final String description;
  final String imageUrl;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  
  // UI-only field, not stored in database
  final IconData? icon;
  int quantity; // For tracking selected quantity in UI

  CommonItemModel({
    required this.id,
    required this.serviceTypeId,
    required this.name,
    required this.description,
    required this.imageUrl,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
    this.icon,
    this.quantity = 0,
  });

  factory CommonItemModel.fromJson(Map<String, dynamic> json) {
    return CommonItemModel(
      id: json['id'] ?? '',
      serviceTypeId: json['service_type_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      imageUrl: json['image_url'] ?? '',
      isActive: json['is_active'] ?? true,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      quantity: json['quantity'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'service_type_id': serviceTypeId,
      'name': name,
      'description': description,
      'image_url': imageUrl,
      'is_active': isActive,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'quantity': quantity,
    };
  }

  // Convert to a map format suitable for order creation
  Map<String, dynamic> toOrderItemJson() {
    return {
      'item_id': id,
      'name': name,
      'description': description,
      'image_url': imageUrl,
      'quantity': quantity,
    };
  }

  CommonItemModel copyWith({
    String? id,
    String? serviceTypeId,
    String? name,
    String? description,
    String? imageUrl,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
    IconData? icon,
    int? quantity,
  }) {
    return CommonItemModel(
      id: id ?? this.id,
      serviceTypeId: serviceTypeId ?? this.serviceTypeId,
      name: name ?? this.name,
      description: description ?? this.description,
      imageUrl: imageUrl ?? this.imageUrl,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      icon: icon ?? this.icon,
      quantity: quantity ?? this.quantity,
    );
  }
}