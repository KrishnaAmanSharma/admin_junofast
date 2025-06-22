import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class StorageService {
  static SharedPreferences? _preferences;

  static Future<void> init() async {
    _preferences = await SharedPreferences.getInstance();
  }

  // Token Management
  static Future<void> saveToken(String token) async {
    await _preferences?.setString(AppConstants.userTokenKey, token);
  }

  static String? getToken() {
    return _preferences?.getString(AppConstants.userTokenKey);
  }

  static Future<void> removeToken() async {
    await _preferences?.remove(AppConstants.userTokenKey);
  }

  // User Data Management
  static Future<void> saveUserData(Map<String, dynamic> userData) async {
    await _preferences?.setString(
      AppConstants.userDataKey, 
      jsonEncode(userData)
    );
  }

  static Map<String, dynamic>? getUserData() {
    final userDataString = _preferences?.getString(AppConstants.userDataKey);
    if (userDataString != null) {
      return jsonDecode(userDataString);
    }
    return null;
  }

  static Future<void> removeUserData() async {
    await _preferences?.remove(AppConstants.userDataKey);
  }

  // FCM Token Management
  static Future<void> saveFCMToken(String fcmToken) async {
    await _preferences?.setString(AppConstants.fcmTokenKey, fcmToken);
  }

  static String? getFCMToken() {
    return _preferences?.getString(AppConstants.fcmTokenKey);
  }

  // Notification Settings
  static Future<void> saveNotificationSettings(Map<String, bool> settings) async {
    await _preferences?.setString(
      AppConstants.notificationSettingsKey,
      jsonEncode(settings)
    );
  }

  static Map<String, bool> getNotificationSettings() {
    final settingsString = _preferences?.getString(AppConstants.notificationSettingsKey);
    if (settingsString != null) {
      final decoded = jsonDecode(settingsString) as Map<String, dynamic>;
      return decoded.map((key, value) => MapEntry(key, value as bool));
    }
    return {
      'newOrders': true,
      'orderUpdates': true,
      'payments': true,
      'general': true,
    };
  }

  // Generic Storage Methods
  static Future<void> setString(String key, String value) async {
    await _preferences?.setString(key, value);
  }

  static String? getString(String key) {
    return _preferences?.getString(key);
  }

  static Future<void> setBool(String key, bool value) async {
    await _preferences?.setBool(key, value);
  }

  static bool? getBool(String key) {
    return _preferences?.getBool(key);
  }

  static Future<void> setInt(String key, int value) async {
    await _preferences?.setInt(key, value);
  }

  static int? getInt(String key) {
    return _preferences?.getInt(key);
  }

  static Future<void> setDouble(String key, double value) async {
    await _preferences?.setDouble(key, value);
  }

  static double? getDouble(String key) {
    return _preferences?.getDouble(key);
  }

  static Future<void> remove(String key) async {
    await _preferences?.remove(key);
  }

  static Future<void> clear() async {
    await _preferences?.clear();
  }
}