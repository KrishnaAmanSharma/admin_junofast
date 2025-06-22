import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/services/auth_service.dart';
import '../../../auth/data/models/vendor_model.dart';

class ProfileController extends GetxController {
  VendorModel? _vendorProfile;
  bool _isLoading = false;
  bool _isUpdating = false;
  String? _error;

  VendorModel? get vendorProfile => _vendorProfile;
  bool get isLoading => _isLoading;
  bool get isUpdating => _isUpdating;
  String? get error => _error;

  final SupabaseClient _supabase = Supabase.instance.client;

  @override
  void onInit() {
    super.onInit();
    loadProfile();
  }

  Future<void> loadProfile() async {
    _setLoading(true);
    try {
      final authService = Get.find<AuthService>();
      final userId = authService.currentUser?.id;
      
      if (userId == null) {
        throw Exception('User not authenticated');
      }

      final response = await _supabase
          .from('vendor_profiles')
          .select()
          .eq('id', userId)
          .single();

      _vendorProfile = VendorModel.fromJson(response);
      _error = null;
    } catch (e) {
      _error = 'Failed to load profile: ${e.toString()}';
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> updates) async {
    _setUpdating(true);
    try {
      final authService = Get.find<AuthService>();
      final userId = authService.currentUser?.id;
      
      if (userId == null) {
        throw Exception('User not authenticated');
      }

      await _supabase
          .from('vendor_profiles')
          .update(updates)
          .eq('id', userId);

      // Reload profile to get updated data
      await loadProfile();
      
      Get.snackbar(
        'Success',
        'Profile updated successfully',
        backgroundColor: const Color(0xFF059669),
        colorText: Colors.white,
      );
      
      return true;
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to update profile: ${e.toString()}',
        backgroundColor: const Color(0xFFDC2626),
        colorText: Colors.white,
      );
      return false;
    } finally {
      _setUpdating(false);
    }
  }

  Future<bool> updateOnlineStatus(bool isOnline) async {
    try {
      final authService = Get.find<AuthService>();
      final userId = authService.currentUser?.id;
      
      if (userId == null) return false;

      await _supabase
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
        update();
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> uploadProfileImage(String imagePath) async {
    _setUpdating(true);
    try {
      final authService = Get.find<AuthService>();
      final userId = authService.currentUser?.id;
      
      if (userId == null) {
        throw Exception('User not authenticated');
      }

      // Upload image to Supabase storage
      final fileName = 'profile_$userId.jpg';
      await _supabase.storage
          .from('vendor_profiles')
          .upload(fileName, File(imagePath));

      // Get public URL
      final imageUrl = _supabase.storage
          .from('vendor_profiles')
          .getPublicUrl(fileName);

      // Update profile with image URL
      await updateProfile({'profile_image_url': imageUrl});
      
      return true;
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to upload image: ${e.toString()}',
        backgroundColor: const Color(0xFFDC2626),
        colorText: Colors.white,
      );
      return false;
    } finally {
      _setUpdating(false);
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    update();
  }

  void _setUpdating(bool updating) {
    _isUpdating = updating;
    update();
  }
}