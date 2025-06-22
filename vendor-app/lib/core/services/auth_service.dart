import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'storage_service.dart';
import '../constants/app_constants.dart';

class AuthService extends ChangeNotifier {
  bool _isAuthenticated = false;
  bool _isLoading = false;
  User? _currentUser;
  Map<String, dynamic>? _vendorProfile;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  User? get currentUser => _currentUser;
  Map<String, dynamic>? get vendorProfile => _vendorProfile;

  AuthService() {
    _initializeAuth();
  }

  Future<void> _initializeAuth() async {
    _setLoading(true);
    
    final token = StorageService.getToken();
    if (token != null) {
      try {
        // Verify token with Supabase
        final client = Supabase.instance.client;
        final response = await client.auth.getUser();
        
        if (response.user != null) {
          _currentUser = response.user;
          _isAuthenticated = true;
          await _loadVendorProfile();
        } else {
          await logout();
        }
      } catch (e) {
        await logout();
      }
    }
    
    _setLoading(false);
  }

  Future<bool> login(String email, String password) async {
    _setLoading(true);
    
    try {
      final client = Supabase.instance.client;
      final response = await client.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user != null) {
        _currentUser = response.user;
        _isAuthenticated = true;
        
        // Save token
        await StorageService.saveToken(response.session?.accessToken ?? '');
        
        // Load vendor profile
        await _loadVendorProfile();
        
        _setLoading(false);
        return true;
      }
    } catch (e) {
      _setLoading(false);
      throw Exception('Login failed: ${e.toString()}');
    }
    
    _setLoading(false);
    return false;
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
    _setLoading(true);
    
    try {
      final client = Supabase.instance.client;
      
      // Create auth user
      final authResponse = await client.auth.signUp(
        email: email,
        password: password,
      );

      if (authResponse.user != null) {
        // Create vendor profile
        await client.from('vendor_profiles').insert({
          'id': authResponse.user!.id,
          'email': email,
          'full_name': fullName,
          'phone_number': phoneNumber,
          'business_name': businessName,
          'service_types': serviceTypes,
          'city': city,
          'address': address,
          'status': 'pending_approval',
          'rating': 0.0,
          'total_orders': 0,
          'created_at': DateTime.now().toIso8601String(),
        });

        _currentUser = authResponse.user;
        _isAuthenticated = true;
        
        // Save token
        await StorageService.saveToken(authResponse.session?.accessToken ?? '');
        
        // Load vendor profile
        await _loadVendorProfile();
        
        _setLoading(false);
        return true;
      }
    } catch (e) {
      _setLoading(false);
      throw Exception('Registration failed: ${e.toString()}');
    }
    
    _setLoading(false);
    return false;
  }

  Future<void> _loadVendorProfile() async {
    if (_currentUser == null) return;
    
    try {
      final client = Supabase.instance.client;
      final response = await client
          .from('vendor_profiles')
          .select()
          .eq('id', _currentUser!.id)
          .single();
      
      _vendorProfile = response;
      await StorageService.saveUserData(_vendorProfile!);
    } catch (e) {
      print('Error loading vendor profile: $e');
    }
  }

  Future<void> updateProfile(Map<String, dynamic> updates) async {
    if (_currentUser == null) return;
    
    try {
      final client = Supabase.instance.client;
      await client
          .from('vendor_profiles')
          .update(updates)
          .eq('id', _currentUser!.id);
      
      // Reload profile
      await _loadVendorProfile();
      notifyListeners();
    } catch (e) {
      throw Exception('Profile update failed: ${e.toString()}');
    }
  }

  Future<void> logout() async {
    _setLoading(true);
    
    try {
      final client = Supabase.instance.client;
      await client.auth.signOut();
    } catch (e) {
      print('Error during logout: $e');
    }
    
    // Clear local data
    await StorageService.removeToken();
    await StorageService.removeUserData();
    
    _currentUser = null;
    _vendorProfile = null;
    _isAuthenticated = false;
    
    _setLoading(false);
  }

  Future<void> resetPassword(String email) async {
    try {
      final client = Supabase.instance.client;
      await client.auth.resetPasswordForEmail(email);
    } catch (e) {
      throw Exception('Password reset failed: ${e.toString()}');
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }
}