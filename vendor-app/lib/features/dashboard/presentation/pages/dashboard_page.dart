import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/services/auth_service.dart';
import '../widgets/dashboard_stats_card.dart';
import '../widgets/recent_orders_card.dart';
import '../widgets/earnings_overview_card.dart';
import '../widgets/quick_actions_card.dart';
import '../../../orders/presentation/controllers/orders_controller.dart';
import '../../../profile/presentation/controllers/profile_controller.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({Key? key}) : super(key: key);

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  int _selectedIndex = 0;
  final OrdersController ordersController = Get.find<OrdersController>();
  final ProfileController profileController = Get.find<ProfileController>();

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    await Future.wait([
      ordersController.loadAvailableOrders(),
      ordersController.loadMyOrders(),
      profileController.loadProfile(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _buildDashboardContent(),
      _buildAvailableOrdersPage(),
      _buildMyOrdersPage(),
      _buildEarningsPage(),
      _buildProfilePage(),
    ];

    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: _buildAppBar(),
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        child: pages[_selectedIndex],
      ),
      bottomNavigationBar: _buildBottomNavigation(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    final titles = [
      'Dashboard',
      'Available Orders',
      'My Orders',
      'Earnings',
      'Profile',
    ];

    return AppBar(
      title: Text(titles[_selectedIndex]),
      backgroundColor: Colors.white,
      elevation: 0,
      actions: [
        IconButton(
          onPressed: () => Get.toNamed('/notifications'),
          icon: Stack(
            children: [
              const Icon(Icons.notifications_outlined),
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(
                    color: AppConstants.errorColor,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 8,
                    minHeight: 8,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildDashboardContent() {
    return Consumer<AuthService>(
      builder: (context, authService, child) {
        final vendor = authService.vendorProfile;
        
        if (vendor == null) {
          return const Center(child: CircularProgressIndicator());
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Header
              _buildWelcomeHeader(vendor),
              const SizedBox(height: 24),
              
              // Status Banner
              if (vendor['status'] != 'approved') _buildStatusBanner(vendor),
              
              // Stats Cards
              _buildStatsSection(vendor),
              const SizedBox(height: 24),
              
              // Quick Actions
              const QuickActionsCard(),
              const SizedBox(height: 24),
              
              // Earnings Overview
              const EarningsOverviewCard(),
              const SizedBox(height: 24),
              
              // Recent Orders
              const RecentOrdersCard(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildWelcomeHeader(Map<String, dynamic> vendor) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppConstants.primaryColor,
            AppConstants.primaryColor.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppConstants.borderRadius),
        boxShadow: [
          BoxShadow(
            color: AppConstants.primaryColor.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hello, ${vendor['full_name']?.split(' ').first ?? 'Vendor'}!',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  vendor['business_name'] ?? 'Business Name',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        vendor['is_online'] == true 
                            ? Icons.circle 
                            : Icons.circle_outlined,
                        color: vendor['is_online'] == true 
                            ? AppConstants.successColor 
                            : Colors.white70,
                        size: 12,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        vendor['is_online'] == true ? 'Online' : 'Offline',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(30),
            ),
            child: const Icon(
              Icons.person,
              color: Colors.white,
              size: 30,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBanner(Map<String, dynamic> vendor) {
    final status = vendor['status'] ?? 'pending_approval';
    Color bannerColor;
    IconData bannerIcon;
    String bannerText;
    
    switch (status) {
      case 'pending_approval':
        bannerColor = AppConstants.warningColor;
        bannerIcon = Icons.pending;
        bannerText = 'Your account is pending approval. You\'ll be notified once approved.';
        break;
      case 'suspended':
        bannerColor = AppConstants.errorColor;
        bannerIcon = Icons.block;
        bannerText = 'Your account has been suspended. Contact support for assistance.';
        break;
      case 'rejected':
        bannerColor = AppConstants.errorColor;
        bannerIcon = Icons.cancel;
        bannerText = 'Your application was rejected. Please resubmit with correct information.';
        break;
      default:
        return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bannerColor.withOpacity(0.1),
        border: Border.all(color: bannerColor.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(AppConstants.borderRadius),
      ),
      child: Row(
        children: [
          Icon(bannerIcon, color: bannerColor),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              bannerText,
              style: TextStyle(
                color: bannerColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsSection(Map<String, dynamic> vendor) {
    return Row(
      children: [
        Expanded(
          child: DashboardStatsCard(
            title: 'Total Orders',
            value: '${vendor['total_orders'] ?? 0}',
            icon: Icons.receipt_long,
            color: AppConstants.primaryColor,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: DashboardStatsCard(
            title: 'Rating',
            value: '${(vendor['rating'] ?? 0.0).toStringAsFixed(1)}⭐',
            icon: Icons.star,
            color: AppConstants.warningColor,
          ),
        ),
      ],
    );
  }

  Widget _buildAvailableOrdersPage() {
    return Container(); // Placeholder - will be implemented in available_orders_page.dart
  }

  Widget _buildMyOrdersPage() {
    return Container(); // Placeholder - will be implemented in my_orders_page.dart
  }

  Widget _buildEarningsPage() {
    return Container(); // Placeholder - will be implemented in earnings_page.dart
  }

  Widget _buildProfilePage() {
    return Container(); // Placeholder - will be implemented in profile_page.dart
  }

  Widget _buildBottomNavigation() {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      currentIndex: _selectedIndex,
      onTap: (index) {
        setState(() {
          _selectedIndex = index;
        });
      },
      selectedItemColor: AppConstants.primaryColor,
      unselectedItemColor: Colors.grey,
      backgroundColor: Colors.white,
      elevation: 8,
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.dashboard),
          label: 'Dashboard',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.work_outline),
          label: 'Available',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.assignment),
          label: 'My Orders',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.attach_money),
          label: 'Earnings',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person),
          label: 'Profile',
        ),
      ],
    );
  }
}