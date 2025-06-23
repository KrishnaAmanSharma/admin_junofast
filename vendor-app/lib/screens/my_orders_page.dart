import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../configs/app_constants.dart';
import '../services/orders_controller.dart';
import '../models/order_model.dart';
import '../services/auth_service.dart';
import '../widgets/order_card.dart';

class MyOrdersPage extends StatefulWidget {
  const MyOrdersPage({Key? key}) : super(key: key);

  @override
  State<MyOrdersPage> createState() => _MyOrdersPageState();
}

class _MyOrdersPageState extends State<MyOrdersPage> with TickerProviderStateMixin {
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
    final ordersController = Provider.of<OrdersController>(context, listen: false);
    final authService = Provider.of<AuthService>(context, listen: false);
    await ordersController.loadMyOrders(authService);
  }

  List<OrderModel> _getFilteredOrders(String filter, OrdersController ordersController) {
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
    return Consumer2<OrdersController, AuthService>(
      builder: (context, controller, authService, child) {
        if (controller.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        final orders = _getFilteredOrders(filter, controller);
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
                    ? () => _showPriceUpdateDialog(order, controller, authService) 
                    : null,
                onReject: () {},
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
                onPressed: () => Navigator.pushNamed(context, '/available-orders'),
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
    Navigator.pushNamed(context, '/order-details', arguments: order.id);
  }

  void _showPriceUpdateDialog(OrderModel order, OrdersController controller, AuthService authService) {
    showDialog(
      context: context,
      builder: (context) {
        final priceController = TextEditingController();
        final reasonController = TextEditingController();
        final adminPrice = order.finalPrice ?? order.approxPrice;
        return AlertDialog(
          title: const Text('Request Price Update'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (adminPrice != null) ...[
                Text('Current Price by Admin: \$${adminPrice.toStringAsFixed(2)}',
                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
                ),
                const SizedBox(height: 8),
              ],
              TextField(
                controller: priceController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'New Price'),
              ),
              TextField(
                controller: reasonController,
                decoration: const InputDecoration(labelText: 'Reason'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final priceText = priceController.text.trim();
                final reason = reasonController.text.trim();
                if (priceText.isEmpty || reason.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Please fill in all fields'),
                      backgroundColor: AppConstants.errorColor,
                    ),
                  );
                  return;
                }
                final newPrice = double.tryParse(priceText);
                if (newPrice == null || newPrice <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Please enter a valid price'),
                      backgroundColor: AppConstants.errorColor,
                    ),
                  );
                  return;
                }
                final success = await controller.requestPriceUpdate(order.id, newPrice, reason, authService);
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Price update requested'),
                      backgroundColor: AppConstants.successColor,
                    ),
                  );
                  Navigator.pop(context);
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to request price update'),
                      backgroundColor: AppConstants.errorColor,
                    ),
                  );
                }
              },
              child: const Text('Submit'),
            ),
          ],
        );
      },
    );
  }
}