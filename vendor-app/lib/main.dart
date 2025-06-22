import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:get/get.dart';

import 'core/theme/app_theme.dart';
import 'core/constants/app_constants.dart';
import 'core/services/storage_service.dart';
import 'core/services/auth_service.dart';
import 'core/services/notification_service.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/dashboard/presentation/pages/dashboard_page.dart';
import 'features/orders/presentation/controllers/orders_controller.dart';
import 'features/profile/presentation/controllers/profile_controller.dart';
import 'features/auth/presentation/controllers/auth_controller.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize services
  await StorageService.init();
  await NotificationService.init();
  
  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(const VendorApp());
}

class VendorApp extends StatelessWidget {
  const VendorApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
      ],
      child: GetMaterialApp(
        title: AppConstants.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.light,
        initialBinding: InitialBinding(),
        home: const AuthWrapper(),
        getPages: AppConstants.routes,
      ),
    );
  }
}

class InitialBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<AuthController>(() => AuthController());
    Get.lazyPut<OrdersController>(() => OrdersController());
    Get.lazyPut<ProfileController>(() => ProfileController());
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthService>(
      builder: (context, authService, child) {
        if (authService.isLoading) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }
        
        return authService.isAuthenticated 
            ? const DashboardPage() 
            : const LoginPage();
      },
    );
  }
}