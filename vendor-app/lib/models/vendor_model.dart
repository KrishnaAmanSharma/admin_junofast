class VendorModel {
  final String id;
  final String email;
  final String fullName;
  final String phoneNumber;
  final String businessName;
  final List<String> serviceTypes;
  final String city;
  final String address;
  final String status; // pending_approval, approved, suspended, rejected
  final double rating;
  final int totalOrders;
  final int completedOrders;
  final double totalEarnings;
  final String? profileImageUrl;
  final String? businessLicense;
  final String? insuranceInfo;
  final DateTime createdAt;
  final DateTime? approvedAt;
  final Map<String, dynamic>? documents;
  final bool isOnline;
  final DateTime? lastActiveAt;

  VendorModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.phoneNumber,
    required this.businessName,
    required this.serviceTypes,
    required this.city,
    required this.address,
    required this.status,
    required this.rating,
    required this.totalOrders,
    required this.completedOrders,
    required this.totalEarnings,
    this.profileImageUrl,
    this.businessLicense,
    this.insuranceInfo,
    required this.createdAt,
    this.approvedAt,
    this.documents,
    this.isOnline = false,
    this.lastActiveAt,
  });

  factory VendorModel.fromJson(Map<String, dynamic> json) {
    return VendorModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      fullName: json['full_name'] ?? '',
      phoneNumber: json['phone_number'] ?? '',
      businessName: json['business_name'] ?? '',
      serviceTypes: List<String>.from(json['service_types'] ?? []),
      city: json['city'] ?? '',
      address: json['address'] ?? '',
      status: json['status'] ?? 'pending_approval',
      rating: (json['rating'] ?? 0.0).toDouble(),
      totalOrders: json['total_orders'] ?? 0,
      completedOrders: json['completed_orders'] ?? 0,
      totalEarnings: (json['total_earnings'] ?? 0.0).toDouble(),
      profileImageUrl: json['profile_image_url'],
      businessLicense: json['business_license'],
      insuranceInfo: json['insurance_info'],
      createdAt: DateTime.parse(json['created_at']),
      approvedAt: json['approved_at'] != null 
          ? DateTime.parse(json['approved_at']) 
          : null,
      documents: json['documents'],
      isOnline: json['is_online'] ?? false,
      lastActiveAt: json['last_active_at'] != null 
          ? DateTime.parse(json['last_active_at']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      'phone_number': phoneNumber,
      'business_name': businessName,
      'service_types': serviceTypes,
      'city': city,
      'address': address,
      'status': status,
      'rating': rating,
      'total_orders': totalOrders,
      'completed_orders': completedOrders,
      'total_earnings': totalEarnings,
      'profile_image_url': profileImageUrl,
      'business_license': businessLicense,
      'insurance_info': insuranceInfo,
      'created_at': createdAt.toIso8601String(),
      'approved_at': approvedAt?.toIso8601String(),
      'documents': documents,
      'is_online': isOnline,
      'last_active_at': lastActiveAt?.toIso8601String(),
    };
  }

  VendorModel copyWith({
    String? id,
    String? email,
    String? fullName,
    String? phoneNumber,
    String? businessName,
    List<String>? serviceTypes,
    String? city,
    String? address,
    String? status,
    double? rating,
    int? totalOrders,
    int? completedOrders,
    double? totalEarnings,
    String? profileImageUrl,
    String? businessLicense,
    String? insuranceInfo,
    DateTime? createdAt,
    DateTime? approvedAt,
    Map<String, dynamic>? documents,
    bool? isOnline,
    DateTime? lastActiveAt,
  }) {
    return VendorModel(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      businessName: businessName ?? this.businessName,
      serviceTypes: serviceTypes ?? this.serviceTypes,
      city: city ?? this.city,
      address: address ?? this.address,
      status: status ?? this.status,
      rating: rating ?? this.rating,
      totalOrders: totalOrders ?? this.totalOrders,
      completedOrders: completedOrders ?? this.completedOrders,
      totalEarnings: totalEarnings ?? this.totalEarnings,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      businessLicense: businessLicense ?? this.businessLicense,
      insuranceInfo: insuranceInfo ?? this.insuranceInfo,
      createdAt: createdAt ?? this.createdAt,
      approvedAt: approvedAt ?? this.approvedAt,
      documents: documents ?? this.documents,
      isOnline: isOnline ?? this.isOnline,
      lastActiveAt: lastActiveAt ?? this.lastActiveAt,
    );
  }

  bool get isApproved => status == 'approved';
  bool get isPendingApproval => status == 'pending_approval';
  bool get isSuspended => status == 'suspended';
  bool get isRejected => status == 'rejected';
  
  String get statusDisplayText {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending_approval':
        return 'Pending Approval';
      case 'suspended':
        return 'Suspended';
      case 'rejected':
        return 'Rejected';
      default:
        return status.toUpperCase();
    }
  }

  String get ratingText {
    if (totalOrders == 0) return 'No ratings yet';
    return '${rating.toStringAsFixed(1)} (${totalOrders} orders)';
  }

  double get completionRate {
    if (totalOrders == 0) return 0.0;
    return (completedOrders / totalOrders) * 100;
  }

  String get formattedEarnings {
    return '\$${totalEarnings.toStringAsFixed(2)}';
  }

  String get serviceTypesText {
    if (serviceTypes.isEmpty) return 'No services';
    if (serviceTypes.length == 1) return serviceTypes.first;
    return '${serviceTypes.first} +${serviceTypes.length - 1} more';
  }
}