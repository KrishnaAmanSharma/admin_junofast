import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import 'storage_service.dart';
import '../constants/app_constants.dart';

class NotificationService {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  static Future<void> init() async {
    await _initializeLocalNotifications();
    await _initializeFirebaseMessaging();
  }

  static Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestSoundPermission: true,
      requestBadgePermission: true,
      requestAlertPermission: true,
    );
    
    const initializationSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );
  }

  static Future<void> _initializeFirebaseMessaging() async {
    // Request permission
    await _requestPermission();
    
    // Get FCM token
    final token = await _firebaseMessaging.getToken();
    if (token != null) {
      await StorageService.saveFCMToken(token);
    }

    // Handle token refresh
    _firebaseMessaging.onTokenRefresh.listen((token) {
      StorageService.saveFCMToken(token);
    });

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);
    
    // Handle notification tap when app is terminated
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }

  static Future<void> _requestPermission() async {
    final notificationPermission = await Permission.notification.request();
    
    if (notificationPermission.isGranted) {
      final settings = await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      
      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        print('User granted notification permissions');
      }
    }
  }

  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    if (notification != null) {
      await showLocalNotification(
        id: message.hashCode,
        title: notification.title ?? 'New Notification',
        body: notification.body ?? '',
        payload: message.data['type'] ?? '',
      );
    }
  }

  static Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    print('Background message received: ${message.messageId}');
  }

  static void _handleNotificationTap(RemoteMessage message) {
    _navigateBasedOnNotification(message.data);
  }

  static void _onNotificationTapped(NotificationResponse details) {
    if (details.payload != null) {
      _navigateBasedOnNotification({'type': details.payload});
    }
  }

  static void _navigateBasedOnNotification(Map<String, dynamic> data) {
    final type = data['type'];
    
    switch (type) {
      case AppConstants.notificationTypeNewOrder:
        // Navigate to available orders
        break;
      case AppConstants.notificationTypeOrderUpdate:
        // Navigate to my orders
        break;
      case AppConstants.notificationTypePayment:
        // Navigate to earnings
        break;
      default:
        // Navigate to notifications page
        break;
    }
  }

  static Future<void> showLocalNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'vendor_channel',
      'Vendor Notifications',
      channelDescription: 'Notifications for vendor app',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      id,
      title,
      body,
      notificationDetails,
      payload: payload,
    );
  }

  static Future<void> cancelNotification(int id) async {
    await _localNotifications.cancel(id);
  }

  static Future<void> cancelAllNotifications() async {
    await _localNotifications.cancelAll();
  }

  static Future<String?> getFCMToken() async {
    return await _firebaseMessaging.getToken();
  }

  static Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
  }

  static Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseMessaging.unsubscribeFromTopic(topic);
  }
}