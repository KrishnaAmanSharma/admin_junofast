import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:internet_connection_checker/internet_connection_checker.dart';

class ConnectivityService {
  // Singleton instance
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;
  ConnectivityService._internal();

  // Stream controllers
  final _internetConnectionController = StreamController<bool>.broadcast();

  // Stream getters
  Stream<bool> get internetConnectionStream => _internetConnectionController.stream;
  

  // Internet connection checker instance
  late InternetConnectionChecker _internetConnectionChecker;
  StreamSubscription<InternetConnectionStatus>? _internetConnectionSubscription;

  // Initialize the service
  Future<void> initialize() async {
    try {
      // Initialize internet connection checker
      _internetConnectionChecker = InternetConnectionChecker.instance;

      // Start listening to internet connection changes
      _internetConnectionSubscription = _internetConnectionChecker.onStatusChange.listen(
        (InternetConnectionStatus status) {
          final isConnected = status == InternetConnectionStatus.connected;
          _internetConnectionController.add(isConnected);
        },
      );

      // Check initial internet connection status
      final initialConnectionStatus = await _internetConnectionChecker.hasConnection;
      _internetConnectionController.add(initialConnectionStatus);

    
    } catch (e) {
      debugPrint('Error initializing ConnectivityService: $e');
      // Provide default values in case of initialization error
      _internetConnectionController.add(true); // Assume connected
     
    }
  }

  // Check current internet connection status
  Future<bool> checkInternetConnection() async {
    try {
      return await _internetConnectionChecker.hasConnection;
    } catch (e) {
      debugPrint('Error checking internet connection: $e');
      return true; // Assume connected if check fails
    }
  }

  // Dispose resources
  void dispose() {
    _internetConnectionSubscription?.cancel();
    _internetConnectionController.close();
  }
}