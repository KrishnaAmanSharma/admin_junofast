import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/constants/app_constants.dart';
import '../controllers/orders_controller.dart';
import '../../data/models/order_model.dart';
import '../widgets/order_card.dart';
import '../widgets/order_filters.dart';

class AvailableOrdersPage extends StatefulWidget {
  const AvailableOrdersPage({Key? key}) : super(key: key);

  @override
  State<AvailableOrdersPage> createState() => _AvailableOrdersPageState();
}

class _AvailableOrdersPageState extends State<AvailableOrdersPage> {
  final OrdersController ordersController = Get.find<OrdersController>();
  String selectedServiceType = 'All';
  String sortBy = 'created_at';
  bool showFilters = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshOrders();
    });
  }

  Future<void> _refreshOrders() async {
    await ordersController.loadAvailableOrders();
  }

  List<OrderModel> get filteredOrders {
    var orders = ordersController.availableOrders;
    
    if (selectedServiceType != 'All') {
      orders = orders.where((order) => order.serviceType == selectedServiceType).toList();
    }
    
    switch (sortBy) {
      case 'price_high':
        orders.sort((a, b) => (b.estimatedPrice ?? 0).compareTo(a.estimatedPrice ?? 0));
        break;
      case 'price_low':
        orders.sort((a, b) => (a.estimatedPrice ?? 0).compareTo(b.estimatedPrice ?? 0));
        break;
      case 'distance':
        orders.sort((a, b) => (a.distance ?? 0).compareTo(b.distance ?? 0));
        break;
      case 'priority':
        orders.sort((a, b) => b.priority.compareTo(a.priority));
        break;
      default:
        orders.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    }
    
    return orders;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: AppBar(
        title: const Text('Available Orders'),
        actions: [
          IconButton(
            onPressed: () {
              setState(() {
                showFilters = !showFilters;
              });
            },
            icon: Icon(
              showFilters ? Icons.filter_list_off : Icons.filter_list,
              color: showFilters ? AppConstants.primaryColor : null,
            ),
          ),
          IconButton(
            onPressed: _refreshOrders,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Column(
        children: [
          if (showFilters) 
            OrderFilters(
              selectedServiceType: selectedServiceType,
              sortBy: sortBy,
              onServiceTypeChanged: (value) {
                setState(() {
                  selectedServiceType = value;
                });
              },
              onSortChanged: (value) {
                setState(() {
                  sortBy = value;
                });
              },
            ),
          Expanded(
            child: GetBuilder<OrdersController>(
              builder: (controller) {
                if (controller.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (controller.error != null) {
                  return _buildErrorState(controller.error!);
                }

                final orders = filteredOrders;

                if (orders.isEmpty) {
                  return _buildEmptyState();
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
                        isAvailable: true,
                        onAccept: () => _showAcceptOrderDialog(order),
                        onReject: () => _showRejectOrderDialog(order),
                        onViewDetails: () => _viewOrderDetails(order),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: AppConstants.errorColor,
            ),
            const SizedBox(height: 16),
            Text(
              'Oops! Something went wrong',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              error,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _refreshOrders,
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.work_outline,
              size: 64,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              'No Available Orders',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Check back soon for new orders in your area',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _refreshOrders,
              icon: const Icon(Icons.refresh),
              label: const Text('Refresh'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAcceptOrderDialog(OrderModel order) {
    final priceController = TextEditingController();
    priceController.text = order.estimatedPrice?.toStringAsFixed(2) ?? '';

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Accept Order'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Do you want to accept this ${order.serviceType} order?',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: priceController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Your Price (\$)',
                hintText: 'Enter your price for this order',
                prefixIcon: Icon(Icons.attach_money),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'You can propose a different price or accept the estimated price.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          GetBuilder<OrdersController>(
            builder: (controller) => ElevatedButton(
              onPressed: controller.isAcceptingOrder 
                  ? null 
                  : () async {
                      final priceText = priceController.text.trim();
                      double? proposedPrice;
                      
                      if (priceText.isNotEmpty) {
                        proposedPrice = double.tryParse(priceText);
                        if (proposedPrice == null || proposedPrice <= 0) {
                          Get.snackbar(
                            'Invalid Price',
                            'Please enter a valid price',
                            backgroundColor: AppConstants.errorColor,
                            colorText: Colors.white,
                          );
                          return;
                        }
                      }

                      final success = await controller.acceptOrder(order.id, proposedPrice);
                      if (success) {
                        Navigator.of(context).pop();
                      }
                    },
              child: controller.isAcceptingOrder
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Accept Order'),
            ),
          ),
        ],
      ),
    );
  }

  void _showRejectOrderDialog(OrderModel order) {
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Order'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Are you sure you want to reject this ${order.serviceType} order?',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Reason (optional)',
                hintText: 'Why are you rejecting this order?',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          GetBuilder<OrdersController>(
            builder: (controller) => ElevatedButton(
              onPressed: controller.isAcceptingOrder 
                  ? null 
                  : () async {
                      final reason = reasonController.text.trim();
                      final success = await controller.rejectOrder(
                        order.id, 
                        reason.isEmpty ? 'No reason provided' : reason
                      );
                      if (success) {
                        Navigator.of(context).pop();
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConstants.errorColor,
              ),
              child: controller.isAcceptingOrder
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Reject Order'),
            ),
          ),
        ],
      ),
    );
  }

  void _viewOrderDetails(OrderModel order) {
    Get.toNamed('/order-details', arguments: order.id);
  }
}