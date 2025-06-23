import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/constants/app_constants.dart';
import '../controllers/orders_controller.dart';
import '../../data/models/order_model.dart';
import '../widgets/order_card.dart';

class MyOrdersPage extends StatefulWidget {
  const MyOrdersPage({Key? key}) : super(key: key);

  @override
  State<MyOrdersPage> createState() => _MyOrdersPageState();
}

class _MyOrdersPageState extends State<MyOrdersPage> with TickerProviderStateMixin {
  final OrdersController ordersController = Get.find<OrdersController>();
  late TabController _tabController;

  final List<String> _tabs = ['All', 'Active', 'Completed', 'Cancelled'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _refreshOrders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _refreshOrders() async {
    await ordersController.loadMyOrders();
  }

  List<OrderModel> _getFilteredOrders(String filter) {
    final allOrders = ordersController.myOrders;
    
    switch (filter) {
      case 'Active':
        return allOrders.where((order) => 
          order.status == 'assigned' || order.status == 'in_progress').toList();
      case 'Completed':
        return allOrders.where((order) => order.status == 'completed').toList();
      case 'Cancelled':
        return allOrders.where((order) => order.status == 'cancelled').toList();
      default:
        return allOrders;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: AppBar(
        title: const Text('My Orders'),
        actions: [
          IconButton(
            onPressed: _refreshOrders,
            icon: const Icon(Icons.refresh),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
          labelColor: AppConstants.primaryColor,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppConstants.primaryColor,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: _tabs.map((tab) => _buildOrdersList(tab)).toList(),
      ),
    );
  }

  Widget _buildOrdersList(String filter) {
    return GetBuilder<OrdersController>(
      builder: (controller) {
        if (controller.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        final orders = _getFilteredOrders(filter);

        if (orders.isEmpty) {
          return _buildEmptyState(filter);
        }

        return RefreshIndicator(
          onRefresh: _refreshOrders,
          child: ListView.builder(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            itemCount: orders.length,
            itemBuilder: (context, index) {
              final order = orders[index];
              return OrderCard(
                order: order,
                isAvailable: false,
                onViewDetails: () => _viewOrderDetails(order),
                onRequestPriceUpdate: order.canRequestPriceUpdate 
                    ? () => _showPriceUpdateDialog(order) 
                    : null,
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(String filter) {
    String title;
    String subtitle;
    IconData icon;

    switch (filter) {
      case 'Active':
        title = 'No Active Orders';
        subtitle = 'You don\'t have any active orders right now';
        icon = Icons.work_outline;
        break;
      case 'Completed':
        title = 'No Completed Orders';
        subtitle = 'Complete some orders to see them here';
        icon = Icons.check_circle_outline;
        break;
      case 'Cancelled':
        title = 'No Cancelled Orders';
        subtitle = 'All your orders are going well!';
        icon = Icons.cancel_outlined;
        break;
      default:
        title = 'No Orders Yet';
        subtitle = 'Start accepting orders to see them here';
        icon = Icons.inbox_outlined;
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
            if (filter == 'All') ...[
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => Get.toNamed('/available-orders'),
                icon: const Icon(Icons.search),
                label: const Text('Find Orders'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _viewOrderDetails(OrderModel order) {
    Get.toNamed('/order-details', arguments: order.id);
  }

  void _showPriceUpdateDialog(OrderModel order) {
    final priceController = TextEditingController();
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Request Price Update'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: priceController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'New Price (\$)',
                hintText: 'Enter your proposed price',
                prefixIcon: Icon(Icons.attach_money),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Reason for Price Change',
                hintText: 'Explain why you need to change the price',
                prefixIcon: Icon(Icons.description),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final priceText = priceController.text.trim();
              final reason = reasonController.text.trim();
              
              if (priceText.isEmpty || reason.isEmpty) {
                Get.snackbar(
                  'Validation Error',
                  'Please fill in all fields',
                  backgroundColor: AppConstants.errorColor,
                  colorText: Colors.white,
                );
                return;
              }

              final newPrice = double.tryParse(priceText);
              if (newPrice == null || newPrice <= 0) {
                Get.snackbar(
                  'Invalid Price',
                  'Please enter a valid price',
                  backgroundColor: AppConstants.errorColor,
                  colorText: Colors.white,
                );
                return;
              }

              final success = await ordersController.requestPriceUpdate(
                order.id, 
                newPrice, 
                reason
              );
              
              if (success) {
                Navigator.of(context).pop();
              }
            },
            child: const Text('Send Request'),
          ),
        ],
      ),
    );
  }
}