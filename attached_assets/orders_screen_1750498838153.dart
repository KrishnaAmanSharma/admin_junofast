import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../config/theme_config.dart';
import '../services/order_service.dart';
import '../models/order_model.dart';
import 'order_detail_screen.dart';
import 'edit_order_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({Key? key}) : super(key: key);

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  final OrderService _orderService = OrderService();
  bool _isLoading = true;
  List<OrderModel> _orders = [];
  String? _errorMessage;
  late TabController _tabController;
  
  // Filter options
  final List<String> _filterOptions = [
    'All',
    'Pending',
    'In Progress',
    'Completed',
    'Cancelled'
  ];
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _filterOptions.length, vsync: this);
    _tabController.addListener(_handleTabChange);
    _loadOrders();
  }
  
  @override
  void dispose() {
    _tabController.removeListener(_handleTabChange);
    _tabController.dispose();
    super.dispose();
  }
  
  void _handleTabChange() {
    if (!_tabController.indexIsChanging) {
      setState(() {}); // Refresh UI when tab changes
    }
  }

  Future<void> _loadOrders() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      final orders = await _orderService.getUserOrders();
      
      setState(() {
        _orders = orders;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load orders: $e';
        _isLoading = false;
      });
    }
  }
  
  List<OrderModel> get _filteredOrders {
    final currentFilter = _filterOptions[_tabController.index];
    if (currentFilter == 'All') {
      return _orders;
    }
    
    return _orders.where((order) {
      final status = order.status.toLowerCase();
      switch (currentFilter) {
        case 'Pending':
          return status == 'pending';
        case 'In Progress':
          return status == 'in progress' || status == 'price updated' || status == 'price accepted';
        case 'Completed':
          return status == 'completed';
        case 'Cancelled':
          return status == 'cancelled';
        default:
          return true;
      }
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'My Orders',
          style: AppTheme.headingStyle.copyWith(fontSize: 22),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.primaryColor),
            onPressed: _loadOrders,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppTheme.primaryColor,
          tabs: _filterOptions.map((filter) => Tab(text: filter)).toList(),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadOrders,
        child: _buildContent(),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _errorMessage!,
              style: AppTheme.bodyStyle.copyWith(color: Colors.red),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadOrders,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'Try Again',
                style: AppTheme.bodyStyle.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      );
    }

    final filteredOrders = _filteredOrders;
    
    if (filteredOrders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.inbox_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No orders found',
              style: AppTheme.headingStyle.copyWith(fontSize: 20),
            ),
            const SizedBox(height: 8),
            Text(
              _tabController.index == 0
                  ? 'Your order history will appear here'
                  : 'No ${_filterOptions[_tabController.index].toLowerCase()} orders',
              style: AppTheme.bodyStyle.copyWith(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filteredOrders.length,
      itemBuilder: (context, index) {
        final order = filteredOrders[index];
        return _buildOrderCard(order);
      },
    );
  }

  Widget _buildOrderCard(OrderModel order) {
    final String orderId = order.id;
    final String serviceType = order.serviceType;
    final OrderStatus status = order.orderStatus;
    final DateTime createdAt = order.createdAt;
    final double? price = order.approxPrice;
    
    // Format date
    final formattedDate = DateFormat('MMM dd, yyyy').format(createdAt);
    
    // Determine status color
    final statusColor = status.getStatusColor();

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => OrderDetailScreen(orderId: orderId),
            ),
          ).then((_) => _loadOrders()); // Refresh after returning from details
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      serviceType,
                      style: AppTheme.headingStyle.copyWith(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(30),
                    ),
                    child: Text(
                      status.toDisplayString(),
                      style: AppTheme.bodyStyle.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(
                    Icons.calendar_today_outlined,
                    size: 16,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 8),
                  Text(
                    formattedDate,
                    style: AppTheme.bodyStyle.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.numbers_outlined,
                    size: 16,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Order #${orderId.substring(0, 8)}...',
                    style: AppTheme.bodyStyle.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Price:',
                    style: AppTheme.bodyStyle.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  price != null
                      ? Text(
                          '₹${price.toStringAsFixed(2)}',
                          style: AppTheme.headingStyle.copyWith(
                            fontSize: 18,
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      : Text(
                          'Calculating...',
                          style: AppTheme.bodyStyle.copyWith(
                            color: Colors.grey[600],
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                ],
              ),
              if (status.isEditable) ...[  
                const SizedBox(height: 16),
                // Row(
                //   mainAxisAlignment: MainAxisAlignment.end,
                //   children: [
                //     OutlinedButton.icon(
                //       onPressed: () {
                //         Navigator.push(
                //           context,
                //           MaterialPageRoute(
                //             builder: (context) => EditOrderScreen(orderData: order.toJson()),
                //           ),
                //         ).then((_) => _loadOrders());
                //       },
                //       icon: const Icon(Icons.edit_outlined, size: 16),
                //       label: const Text('Edit Order'),
                //       style: OutlinedButton.styleFrom(
                //         foregroundColor: AppTheme.primaryColor,
                //         side: const BorderSide(color: AppTheme.primaryColor),
                //         shape: RoundedRectangleBorder(
                //           borderRadius: BorderRadius.circular(8),
                //         ),
                //       ),
                //     ),
                //   ],
                // ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}