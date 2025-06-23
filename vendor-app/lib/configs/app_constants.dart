import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../screens/login_page.dart';
import '../screens/dashboard_page.dart';
import '../screens/available_orders_page.dart';
import '../screens/order_details_page.dart';
import '../screens/my_orders_page.dart';
import '../screens/order_tracking_page.dart';
import '../screens/profile_page.dart';
import '../screens/notifications_page.dart';
import '../screens/earnings_page.dart';

class AppConstants {
  // App Information
  static const String appName = 'Juno Fast Vendor';
  static const String appVersion = '1.0.0';
  static const String companyName = 'Juno Fast';

  // API Configuration
  static const String baseUrl = 'https://your-supabase-url.supabase.co';
  static const String apiKey = 'your-anon-key';

  // Storage Keys
  static const String userTokenKey = 'user_token';
  static const String userDataKey = 'user_data';
  static const String fcmTokenKey = 'fcm_token';
  static const String notificationSettingsKey = 'notification_settings';

  // Order Status
  static const String orderStatusPending = 'pending';
  static const String orderStatusAssigned = 'assigned';
  static const String orderStatusInProgress = 'in_progress';
  static const String orderStatusCompleted = 'completed';
  static const String orderStatusCancelled = 'cancelled';
  static const String orderStatusPriceUpdated = 'price_updated';

  // Service Types
  static const List<String> serviceTypes = [
    'House Relocation',
    'Office Relocation', 
    'Vehicle Transportation',
    'Pet Relocation',
    'Industrial Moving',
    'Event/Exhibition Setup'
  ];

  // Routes
  static List<GetPage> routes = [
    GetPage(name: '/login', page: () => const LoginPage()),
    GetPage(name: '/dashboard', page: () => const DashboardPage()),
    GetPage(name: '/available-orders', page: () => const AvailableOrdersPage()),
    GetPage(name: '/order-details', page: () => const OrderDetailsPage()),
    GetPage(name: '/my-orders', page: () => const MyOrdersPage()),
    GetPage(name: '/order-tracking', page: () => const OrderTrackingPage()),
    GetPage(name: '/profile', page: () => const ProfilePage()),
    GetPage(name: '/notifications', page: () => const NotificationsPage()),
    GetPage(name: '/earnings', page: () => const EarningsPage()),
  ];

  // Animation Durations
  static const Duration shortAnimationDuration = Duration(milliseconds: 200);
  static const Duration mediumAnimationDuration = Duration(milliseconds: 400);
  static const Duration longAnimationDuration = Duration(milliseconds: 600);

  // UI Constants
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double borderRadius = 12.0;
  static const double cardElevation = 4.0;

  // Colors (Juno Fast Brand Colors)
  static const Color primaryColor = Color(0xFF2563EB);
  static const Color secondaryColor = Color(0xFF059669);
  static const Color backgroundColor = Color(0xFFF8FAFC);
  static const Color textColor = Color(0xFF1E293B);
  static const Color accentColor = Color(0xFFDC2626);
  static const Color warningColor = Color(0xFFD97706);
  static const Color successColor = Color(0xFF059669);
  static const Color errorColor = Color(0xFFDC2626);
  static const Color infoColor = Color(0xFF2563EB);

  // Status Colors
  static const Color pendingColor = Color(0xFFD97706);
  static const Color assignedColor = Color(0xFF2563EB);
  static const Color inProgressColor = Color(0xFF7C3AED);
  static const Color completedColor = Color(0xFF059669);
  static const Color cancelledColor = Color(0xFFDC2626);

  // Notification Types
  static const String notificationTypeNewOrder = 'new_order';
  static const String notificationTypeOrderUpdate = 'order_update';
  static const String notificationTypePayment = 'payment';
  static const String notificationTypeGeneral = 'general';

  // Error Messages
  static const String errorNoInternet = 'No internet connection available';
  static const String errorGeneral = 'Something went wrong. Please try again.';
  static const String errorUnauthorized = 'Unauthorized access. Please login again.';
  static const String errorServerError = 'Server error. Please try again later.';

  // Success Messages
  static const String successOrderAccepted = 'Order accepted successfully!';
  static const String successOrderCompleted = 'Order completed successfully!';
  static const String successProfileUpdated = 'Profile updated successfully!';
  static const String successPriceUpdateRequested = 'Price update request sent!';
}