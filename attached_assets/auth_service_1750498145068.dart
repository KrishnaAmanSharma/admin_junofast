import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../config/supabase_config.dart';

class AuthService {
  final SupabaseClient _supabaseClient = Supabase.instance.client;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    clientId: SupabaseConfig.googleClientId,
  );

  // Get current user
  User? get currentUser => _supabaseClient.auth.currentUser;

  // Check if user is logged in
  bool get isAuthenticated => currentUser != null;

  // Initialize Supabase
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: SupabaseConfig.supabaseUrl,
      anonKey: SupabaseConfig.supabaseAnonKey,
    );
  }

  // Sign up with email and password
Future<AuthResponse> signUpWithEmail({
  required String email,
  required String password,
  required String fullName,
  String? phoneNumber,
}) async {
  try {
    // The user data will be stored in auth.users.raw_user_meta_data
    // and automatically copied to profiles table via the trigger
    final response = await _supabaseClient.auth.signUp(
      email: email,
      password: password,
      data: {
        'full_name': fullName,
        'phone_number': phoneNumber,
      },
    );
    
    return response;
  } catch (e) {
    rethrow;
  }
}

  // Sign in with email and password
  Future<AuthResponse> signInWithEmail({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _supabaseClient.auth.signInWithPassword(
        email: email,
        password: password,
      );
      
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Sign in with Google
  Future<AuthResponse?> signInWithGoogle(BuildContext context) async {
  try {
    // Start the Google sign-in process
    final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
    
    if (googleUser == null) {
      // User canceled the sign-in process
      return null;
    }
    
    // Get authentication details from Google
    final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
    
    // Sign in to Supabase with Google OAuth
    final response = await _supabaseClient.auth.signInWithIdToken(
      provider: OAuthProvider.google,
      idToken: googleAuth.idToken!,
      accessToken: googleAuth.accessToken,
    );
    
    return response;
  } catch (e) {
    rethrow;
  }
}

  // Sign out
  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      await _supabaseClient.auth.signOut();
    } catch (e) {
      rethrow;
    }
  }

  // Reset password
  Future<void> resetPassword(String email) async {
    try {
      await _supabaseClient.auth.resetPasswordForEmail(email);
    } catch (e) {
      rethrow;
    }
  }

  // Update user profile (name and phone number only)
  Future<void> updateProfile({
    required String fullName,
    required String phoneNumber,
  }) async {
    final user = _supabaseClient.auth.currentUser;
    if (user == null) throw Exception('No user logged in');
    final userId = user.id;

    // Update the profiles table
    await _supabaseClient.from('profiles').update({
      'full_name': fullName,
      'phone_number': phoneNumber,
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', userId);

    // Update the auth user's metadata
    await _supabaseClient.auth.updateUser(
      UserAttributes(
        data: {
          'full_name': fullName,
          'phone_number': phoneNumber,
        },
      ),
    );
  }
}