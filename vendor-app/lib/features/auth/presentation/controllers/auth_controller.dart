import 'package:get/get.dart';
import 'package:flutter/material.dart';
import '../../../../core/services/auth_service.dart';
import '../../../../core/constants/app_constants.dart';

class AuthController extends GetxController {
  final AuthService _authService = AuthService();
  
  bool get isAuthenticated => _authService.isAuthenticated;
  bool get isLoading => _authService.isLoading;

  Future<bool> login(String email, String password) async {
    try {
      final success = await _authService.login(email, password);
      if (success) {
        Get.offAllNamed('/dashboard');
      }
      return success;
    } catch (e) {
      Get.snackbar(
        'Login Failed',
        e.toString().replaceAll('Exception: ', ''),
        backgroundColor: AppConstants.errorColor,
        colorText: Colors.white,
        snackPosition: SnackPosition.TOP,
      );
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
    required String phoneNumber,
    required String businessName,
    required List<String> serviceTypes,
    required String city,
    required String address,
  }) async {
    try {
      final success = await _authService.register(
        email: email,
        password: password,
        fullName: fullName,
        phoneNumber: phoneNumber,
        businessName: businessName,
        serviceTypes: serviceTypes,
        city: city,
        address: address,
      );
      
      if (success) {
        Get.snackbar(
          'Registration Successful',
          'Your account has been created and is pending approval.',
          backgroundColor: AppConstants.successColor,
          colorText: Colors.white,
          duration: const Duration(seconds: 4),
        );
        Get.offAllNamed('/dashboard');
      }
      return success;
    } catch (e) {
      Get.snackbar(
        'Registration Failed',
        e.toString().replaceAll('Exception: ', ''),
        backgroundColor: AppConstants.errorColor,
        colorText: Colors.white,
        snackPosition: SnackPosition.TOP,
      );
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _authService.logout();
      Get.offAllNamed('/login');
    } catch (e) {
      Get.snackbar(
        'Logout Error',
        'Failed to logout properly',
        backgroundColor: AppConstants.errorColor,
        colorText: Colors.white,
      );
    }
  }

  Future<bool> resetPassword(String email) async {
    try {
      await _authService.resetPassword(email);
      Get.snackbar(
        'Password Reset',
        'Check your email for password reset instructions.',
        backgroundColor: AppConstants.successColor,
        colorText: Colors.white,
        duration: const Duration(seconds: 4),
      );
      return true;
    } catch (e) {
      Get.snackbar(
        'Reset Failed',
        e.toString().replaceAll('Exception: ', ''),
        backgroundColor: AppConstants.errorColor,
        colorText: Colors.white,
      );
      return false;
    }
  }
}