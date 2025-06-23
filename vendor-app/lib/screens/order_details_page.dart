import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../configs/app_constants.dart';
import '../services/orders_controller.dart';
import '../models/order_model.dart';
import '../services/auth_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class OrderDetailsPage extends StatefulWidget {
  const OrderDetailsPage({Key? key}) : super(key: key);

  @override
  State<OrderDetailsPage> createState() => _OrderDetailsPageState();
}

class _OrderDetailsPageState extends State<OrderDetailsPage> {
  late OrdersController ordersController;
  String? orderId;
  OrderModel? order;
  List<Map<String, dynamic>> orderDetails = [];
  bool orderDetailsLoading = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    ordersController = Provider.of<OrdersController>(context, listen: false);
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is String) {
      orderId = args;
      final available = ordersController.availableOrders.where((o) => o.id == orderId);
      if (available.isNotEmpty) {
        order = available.first;
      } else {
        final myOrder = ordersController.myOrders.where((o) => o.id == orderId);
        if (myOrder.isNotEmpty) {
          order = myOrder.first;
        } else {
          order = null;
        }
      }
      if (orderId != null) {
        _fetchOrderDetails(orderId!);
      }
    }
  }

  Future<void> _fetchOrderDetails(String orderId) async {
    setState(() { orderDetailsLoading = true; });
    try {
      final supabase = Supabase.instance.client;
      final response = await supabase
          .from('order_details')
          .select()
          .eq('order_id', orderId)
          .order('created_at', ascending: true);
      setState(() {
        orderDetails = List<Map<String, dynamic>>.from(response);
        orderDetailsLoading = false;
      });
      // Debug print
      print('[DEBUG] order_details for order $orderId: $orderDetails');
    } catch (e) {
      setState(() { orderDetailsLoading = false; });
      print('[DEBUG] Failed to fetch order_details: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Order Details')),
        body: const Center(
          child: Text('Order not found'),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: AppBar(
        title: Text('Order #${order!.id.substring(0, 8)}'),
        actions: [
          if (order!.isAssigned && order!.customerContactMasked != null)
            IconButton(
              onPressed: _showContactInfo,
              icon: const Icon(Icons.contact_phone),
              tooltip: 'Contact Customer',
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatusCard(),
            const SizedBox(height: 16),
            _buildServiceInfo(),
            const SizedBox(height: 16),
            _buildLocationInfo(),
            const SizedBox(height: 16),
            _buildPriceInfo(),
            const SizedBox(height: 16),
            if (order!.commonItems.isNotEmpty) ...[
              _buildCommonItems(),
              const SizedBox(height: 16),
            ],
            if (order!.customItems.isNotEmpty) ...[
              _buildCustomItems(),
              const SizedBox(height: 16),
            ],
            if (order!.questionAnswers.isNotEmpty) ...[
              _buildQuestionAnswers(),
              const SizedBox(height: 16),
            ],
            if (order!.specialInstructions != null) ...[
              _buildSpecialInstructions(),
              const SizedBox(height: 16),
            ],
            _buildOrderDetailsSection(),
            const SizedBox(height: 16),
            _buildOrderTimeline(),
            const SizedBox(height: 24),
            if (!order!.isAssigned)
              Card(
                color: AppConstants.warningColor.withOpacity(0.1),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const Icon(Icons.lock_outline, color: AppConstants.warningColor),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Accept the order to view customer details.',
                          style: TextStyle(
                            color: AppConstants.warningColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            _buildActionButtons(),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            _buildStatusIcon(),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    order!.statusDisplayText,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Service: ${order!.serviceType}',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            if (order!.priority > 1)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppConstants.errorColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'HIGH PRIORITY',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: AppConstants.errorColor,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusIcon() {
    Color color;
    IconData icon;

    switch (order!.status) {
      case 'pending':
        color = AppConstants.pendingColor;
        icon = Icons.pending;
        break;
      case 'assigned':
        color = AppConstants.assignedColor;
        icon = Icons.assignment;
        break;
      case 'in_progress':
        color = AppConstants.inProgressColor;
        icon = Icons.work;
        break;
      case 'completed':
        color = AppConstants.completedColor;
        icon = Icons.check_circle;
        break;
      case 'cancelled':
        color = AppConstants.cancelledColor;
        icon = Icons.cancel;
        break;
      default:
        color = Colors.grey;
        icon = Icons.info;
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, color: color, size: 24),
    );
  }

  Widget _buildServiceInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Service Information',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildInfoRow('Service Type', order!.serviceType),
            if (order!.scheduledDate != null)
              _buildInfoRow(
                'Scheduled Date',
                '${order!.scheduledDate!.day}/${order!.scheduledDate!.month}/${order!.scheduledDate!.year}',
              ),
            _buildInfoRow(
              'Order Date',
              '${order!.createdAt.day}/${order!.createdAt.month}/${order!.createdAt.year}',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Location Details',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildInfoRow('City', order!.city),
            _buildInfoRow('Pickup Address', order!.pickupAddress),
            _buildInfoRow('Pickup Pincode', order!.pickupPincode),
            _buildInfoRow('Delivery Address', order!.deliveryAddress),
            _buildInfoRow('Delivery Pincode', order!.dropPincode),
            if (order!.distance != null)
              _buildInfoRow('Distance', '${order!.distance!.toStringAsFixed(1)} km'),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Price Information',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            if (order!.approxPrice != null)
              _buildInfoRow('Estimated Price', '\$${order!.approxPrice!.toStringAsFixed(2)}'),
            if (order!.finalPrice != null)
              _buildInfoRow(
                'Final Price',
                '\$${order!.finalPrice!.toStringAsFixed(2)}',
                valueColor: AppConstants.primaryColor,
                valueWeight: FontWeight.bold,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommonItems() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Standard Items',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...order!.commonItems.map((item) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: AppConstants.primaryColor,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text('${item.name} (Qty: ${item.quantity})'),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomItems() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Custom Items',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...order!.customItems.map((item) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: AppConstants.secondaryColor,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '${item.name} (Qty: ${item.quantity})',
                          style: const TextStyle(fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                  if (item.description != null)
                    Padding(
                      padding: const EdgeInsets.only(left: 20, top: 4),
                      child: Text(
                        item.description!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestionAnswers() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Service Questions',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...order!.questionAnswers.map((qa) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    qa.question,
                    style: const TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    qa.formattedAnswer,
                    style: TextStyle(
                      color: Colors.grey.shade700,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildSpecialInstructions() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Special Instructions',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppConstants.warningColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: AppConstants.warningColor.withOpacity(0.3),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.info_outline,
                    color: AppConstants.warningColor,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      order!.specialInstructions!,
                      style: TextStyle(
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderDetailsSection() {
    if (orderDetailsLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (orderDetails.isEmpty) {
      return const SizedBox.shrink();
    }
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Additional Order Details',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...orderDetails.map((detail) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Icon(Icons.info_outline, size: 16, color: AppConstants.primaryColor),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${detail['name'] ?? ''}: ${detail['value'] ?? ''}',
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderTimeline() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Order Timeline',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildTimelineItem(
              'Order Created',
              order!.createdAt,
              Icons.create,
              AppConstants.primaryColor,
              isCompleted: true,
            ),
            if (order!.isAssigned)
              _buildTimelineItem(
                'Order Assigned',
                order!.createdAt, // This would be assignment date in real app
                Icons.assignment,
                AppConstants.assignedColor,
                isCompleted: true,
              ),
            if (order!.status == 'in_progress')
              _buildTimelineItem(
                'Work Started',
                DateTime.now(), // This would be start date in real app
                Icons.work,
                AppConstants.inProgressColor,
                isCompleted: true,
              ),
            if (order!.status == 'completed')
              _buildTimelineItem(
                'Order Completed',
                DateTime.now(), // This would be completion date in real app
                Icons.check_circle,
                AppConstants.completedColor,
                isCompleted: true,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimelineItem(
    String title,
    DateTime dateTime,
    IconData icon,
    Color color, {
    bool isCompleted = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isCompleted ? color : Colors.grey.shade300,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 16,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    color: isCompleted ? AppConstants.textColor : Colors.grey,
                  ),
                ),
                Text(
                  '${dateTime.day}/${dateTime.month}/${dateTime.year} at ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    if (!order!.isAssigned) return const SizedBox.shrink();

    return Column(
      children: [
        if (order!.status == 'assigned')
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _updateOrderStatus('in_progress'),
              icon: const Icon(Icons.play_arrow),
              label: const Text('Start Work'),
            ),
          ),
        if (order!.status == 'in_progress') ...[
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _updateOrderStatus('completed'),
              icon: const Icon(Icons.check),
              label: const Text('Mark as Completed'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConstants.successColor,
              ),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _showCancelDialog,
              icon: const Icon(Icons.cancel),
              label: const Text('Cancel Order'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppConstants.errorColor,
                side: const BorderSide(color: AppConstants.errorColor),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildInfoRow(
    String label,
    String value, {
    Color? valueColor,
    FontWeight? valueWeight,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 14,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                color: valueColor ?? AppConstants.textColor,
                fontWeight: valueWeight ?? FontWeight.normal,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showContactInfo() {
    if (order!.customerContactMasked == null) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Customer Contact'),
        content: Text(order!.customerContactMasked!),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).pop();
              // In real app, this would initiate a call
            },
            icon: const Icon(Icons.call),
            label: const Text('Call'),
          ),
        ],
      ),
    );
  }

  Future<void> _updateOrderStatus(String newStatus) async {
    final authService = Provider.of<AuthService>(context, listen: false);
    final success = await ordersController.updateOrderStatus(order!.id, newStatus, authService);
    if (success) {
      setState(() {
        order = ordersController.getOrderById(order!.id, ordersController.myOrders);
      });
    }
  }

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Order'),
        content: const Text('Are you sure you want to cancel this order? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('No, Keep Order'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await _updateOrderStatus('cancelled');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.errorColor,
            ),
            child: const Text('Yes, Cancel Order'),
          ),
        ],
      ),
    );
  }
}