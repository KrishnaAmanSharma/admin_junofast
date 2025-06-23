import 'dart:io';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/auth_service.dart';
import '../models/vendor_model.dart';

class ProfileController extends ChangeNotifier {
  VendorModel? _vendorProfile;
  bool _isLoading = false;
  bool _isUpdating = false;
  String? _error;

  VendorModel? get vendorProfile => _vendorProfile;
  bool get isLoading => _isLoading;
  bool get isUpdating => _isUpdating;
  String? get error => _error;

  Future<void> loadProfile(String userId) async {
    _setLoading(true);
    try {
      final client = Supabase.instance.client;
      final response = await client
          .from('vendor_profiles')
          .select()
          .eq('id', userId)
          .single();
      _vendorProfile = VendorModel.fromJson(response);
      _error = null;
    } catch (e) {
      _vendorProfile = null;
      _error = 'Failed to load profile: ${e.toString()}';
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateProfile(String userId, Map<String, dynamic> updates) async {
    _setUpdating(true);
    try {
      final client = Supabase.instance.client;
      await client
          .from('vendor_profiles')
          .update(updates)
          .eq('id', userId);
      await loadProfile(userId);
      _setUpdating(false);
      return true;
    } catch (e) {
      _setUpdating(false);
      return false;
    }
  }

  Future<bool> updateOnlineStatus(bool isOnline, AuthService authService) async {
    try {
      final userId = authService.currentUser?.id;
      if (userId == null) return false;

      await Supabase.instance.client
          .from('vendor_profiles')
          .update({
            'is_online': isOnline,
            'last_active_at': DateTime.now().toIso8601String(),
          })
          .eq('id', userId);

      if (_vendorProfile != null) {
        _vendorProfile = _vendorProfile!.copyWith(
          isOnline: isOnline,
          lastActiveAt: DateTime.now(),
        );
        notifyListeners();
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> uploadProfileImage(String imagePath, AuthService authService, {void Function(String error)? onError}) async {
    _setUpdating(true);
    try {
      final userId = authService.currentUser?.id;
      if (userId == null) {
        throw Exception('User not authenticated');
      }

      // Upload image to Supabase storage
      final fileName = 'profile_$userId.jpg';
      await Supabase.instance.client.storage
          .from('vendor_profiles')
          .upload(fileName, File(imagePath));

      // Get public URL
      final imageUrl = Supabase.instance.client.storage
          .from('vendor_profiles')
          .getPublicUrl(fileName);

      // Update profile with image URL
      await updateProfile(userId, {'profile_image_url': imageUrl});
      return true;
    } catch (e) {
      if (onError != null) {
        onError('Failed to upload image: ${e.toString()}');
      }
      return false;
    } finally {
      _setUpdating(false);
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setUpdating(bool updating) {
    _isUpdating = updating;
    notifyListeners();
  }
}