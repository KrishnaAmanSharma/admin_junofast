import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../config/theme_config.dart';
import '../services/order_service.dart';
import 'edit_order_screen.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({Key? key, required this.orderId}) : super(key: key);

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final OrderService _orderService = OrderService();
  bool _isLoading = true;
  Map<String, dynamic>? _orderData;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadOrderDetails();
  }

  Future<void> _loadOrderDetails() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      final orderData = await _orderService.getOrderById(widget.orderId);
      
      setState(() {
        _orderData = orderData.toJson();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load order details: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _cancelOrder() async {
    try {
      // Show confirmation dialog
      final confirm = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Cancel Order'),
          content: const Text('Are you sure you want to cancel this order? This action cannot be undone.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(
                'No',
                style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor),
              ),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'Yes, Cancel',
                style: AppTheme.bodyStyle.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      );

      if (confirm == true) {
        // Show loading indicator
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => const Center(child: CircularProgressIndicator()),
        );

        // Cancel the order
        await _orderService.updateOrderStatus(widget.orderId, 'Cancelled');
        
        // Close loading dialog
        Navigator.of(context).pop();
        
        // Reload order details
        await _loadOrderDetails();
        
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order cancelled successfully')),
        );
      }
    } catch (e) {
      // Close loading dialog if open
      Navigator.of(context).pop();
      
      // Show error message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to cancel order: $e')),
      );
    }
  }

  Future<void> _acceptPrice() async {
    try {
      // Show confirmation dialog
      final confirm = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Accept Price'),
          content: Text('Are you sure you want to accept the price of ₹${_orderData!['approx_price']}?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(
                'No',
                style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor),
              ),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'Yes, Accept',
                style: AppTheme.bodyStyle.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      );

      if (confirm == true) {
        // Show loading indicator
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => const Center(child: CircularProgressIndicator()),
        );

        // Update order status to accepted
        await _orderService.updateOrderStatus(widget.orderId, 'Price Accepted');
        
        // Close loading dialog
        Navigator.of(context).pop();
        
        // Reload order details
        await _loadOrderDetails();
        
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Price accepted successfully')),
        );
      }
    } catch (e) {
      // Close loading dialog if open
      Navigator.of(context).pop();
      
      // Show error message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to accept price: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.primaryColor),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Order Details',
          style: AppTheme.headingStyle.copyWith(fontSize: 22),
        ),
        centerTitle: true,
        // actions: [
        //   if (_orderData != null && _orderData!['status'] != 'Cancelled')
        //     IconButton(
        //       icon: const Icon(Icons.edit_outlined, color: AppTheme.primaryColor),
        //       onPressed: () {
        //         Navigator.push(
        //           context,
        //           MaterialPageRoute(
        //             builder: (context) => EditOrderScreen(orderData: _orderData!),
        //           ),
        //         ).then((_) => _loadOrderDetails());
        //       },
        //     ),
        // ],
      ),
      body: _buildContent(),
      bottomNavigationBar: _buildBottomButtons(),
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
              onPressed: _loadOrderDetails,
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

    if (_orderData == null) {
      return const Center(child: Text('Order not found'));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildOrderStatusCard(),
          const SizedBox(height: 24),
          _buildSectionTitle('Order Information'),
          _buildInfoCard(),
          const SizedBox(height: 24),
          _buildSectionTitle('Location Details'),
          _buildLocationCard(),
          const SizedBox(height: 24),
          _buildSectionTitle('Items'),
          _buildItemsList(),
          if (_orderData!['custom_items'] != null && (_orderData!['custom_items'] as List).isNotEmpty) ...[  
            const SizedBox(height: 24),
            _buildSectionTitle('Custom Items'),
            _buildCustomItemsList(),
          ],
          const SizedBox(height: 24),
          _buildSectionTitle('Service Questions'),
          _buildQuestionAnswersCard(),
          const SizedBox(height: 24),
          _buildSectionTitle('Additional Details'),
          _buildAdditionalDetailsCard(),
          const SizedBox(height: 100), // Extra space for bottom buttons
        ],
      ),
    );
  }

  Widget _buildQuestionAnswersCard() {
    if (_orderData == null) {
      return const SizedBox.shrink();
    }

    // Use the correct field name based on debug output
    final List<dynamic> questionAnswers = (_orderData!['question_answers'] ?? []) as List;

    if (questionAnswers.isEmpty) {
      return Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Colors.grey[200]!),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: Text(
              'No service questions answered for this order.',
              style: AppTheme.bodyStyle.copyWith(color: AppTheme.secondaryColor),
            ),
          ),
        ),
      );
    }

    // Group answers by question_id to handle add_items entries
    Map<String, List<Map<String, dynamic>>> groupedAnswers = {};
    for (var answer in questionAnswers) {
      if (answer is Map) {
        String questionId = answer['question_id']?.toString() ?? '';
        if (questionId.isNotEmpty) {
          if (!groupedAnswers.containsKey(questionId)) {
            groupedAnswers[questionId] = [];
          }
          groupedAnswers[questionId]!.add(Map<String, dynamic>.from(answer));
        }
      }
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: groupedAnswers.entries.map((entry) {
            final List<Map<String, dynamic>> answers = entry.value;
            final Map<String, dynamic> firstAnswer = answers.first;
            final String questionType = firstAnswer['question_type']?.toString() ?? '';
            final String question = firstAnswer['question']?.toString() ?? '';
            
            // Handle different question types
            if (questionType == 'add_items_entry') {
              // For add_items, display a list of added items
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    question,
                    style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  ...answers.map((answer) {
                    final String itemName = answer['answer']?.toString() ?? '';
                    final Map<String, dynamic> additionalData =
                        answer['additional_data'] != null && answer['additional_data'] is Map
                            ? Map<String, dynamic>.from(answer['additional_data'])
                            : {};
                    return Padding(
                      padding: const EdgeInsets.only(left: 16, bottom: 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '• $itemName',
                            style: AppTheme.bodyStyle,
                          ),
                          if (additionalData.isNotEmpty) ...[
                            ...additionalData.entries
                                .where((e) => e.key != 'name' && e.value != null && e.value.toString().isNotEmpty)
                                .map((e) => Padding(
                                      padding: const EdgeInsets.only(left: 16),
                                      child: Text(
                                        '${e.key}: ${e.value}',
                                        style: AppTheme.bodyStyle.copyWith(
                                          fontSize: 14,
                                          color: Colors.grey[700],
                                        ),
                                      ),
                                    ))
                                .toList(),
                          ],
                        ],
                      ),
                    );
                  }).toList(),
                  const Divider(),
                ],
              );
            } else {
              // For other question types, display question and answer
              String answer = firstAnswer['answer']?.toString() ?? '';
              // Format boolean answers
              if (questionType == 'boolean') {
                answer = answer.toLowerCase() == 'true' ? 'Yes' : 'No';
              }
              // Format date answers
              if (questionType == 'date' && answer.isNotEmpty) {
                try {
                  final DateTime date = DateTime.parse(answer);
                  answer = DateFormat('MMM dd, yyyy').format(date);
                } catch (e) {
                  // Keep original answer if parsing fails
                }
              }
              
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildInfoRow(question, answer.isEmpty ? 'Not answered' : answer),
                  const Divider(),
                ],
              );
            }
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildOrderStatusCard() {
    final String status = _orderData!['status']?.toString() ?? 'Processing';
    final DateTime createdAt = DateTime.parse(_orderData!['created_at']?.toString() ?? DateTime.now().toIso8601String());
    final double? price = _orderData!['approx_price'] != null ? double.tryParse(_orderData!['approx_price'].toString()) : null;
    
    // Format date
    final formattedDate = DateFormat('MMM dd, yyyy').format(createdAt);
    
    // Determine status color
    Color statusColor;
    switch (status.toLowerCase()) {
      case 'completed':
        statusColor = Colors.green;
        break;
      case 'cancelled':
        statusColor = Colors.red;
        break;
      case 'in progress':
        statusColor = Colors.blue;
        break;
      default:
        statusColor = Colors.orange;
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Text(
                    'Order #${widget.orderId.substring(0, 8)}...',
                    style: AppTheme.bodyStyle.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: Text(
                    status,
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
                Expanded(
                  child: Text(
                    'Created on $formattedDate',
                    style: AppTheme.bodyStyle.copyWith(
                      color: Colors.grey[600],
                    ),
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
                          fontSize: 20,
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
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: AppTheme.headingStyle.copyWith(
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    final String serviceType = _orderData!['service_type']?.toString() ?? 'Unknown Service';
    
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildInfoRow('Service Type', serviceType),
            const Divider(height: 24),
            _buildInfoRow('Order ID', widget.orderId),
            const Divider(height: 24),
            _buildInfoRow('Status', _orderData!['status']?.toString() ?? 'Processing'),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationCard() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildLocationRow(
              'Pickup Location',
              _orderData!['pickup_address']?.toString() ?? 'Not specified',
              _orderData!['pickup_pincode']?.toString() ?? '',
              Icons.location_on_outlined,
            ),
            const Divider(height: 24),
            _buildLocationRow(
              'Drop Location',
              _orderData!['drop_address']?.toString() ?? 'Not specified',
              _orderData!['drop_pincode']?.toString() ?? '',
              Icons.location_on_outlined,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildItemsList() {
    final List<dynamic> commonItems = _orderData!['common_items'] ?? [];
    
    if (commonItems.isEmpty) {
      return Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Colors.grey[200]!),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: Text(
              'No items found',
              style: AppTheme.bodyStyle.copyWith(color: Colors.grey[600]),
            ),
          ),
        ),
      );
    }
    
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: commonItems.length,
        separatorBuilder: (context, index) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final item = commonItems[index];
          return ListTile(
            title: Text(
              item['name']?.toString() ?? 'Unknown Item',
              style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
            ),
            trailing: Text(
              'Qty: ${item['quantity']?.toString() ?? '0'}',
              style: AppTheme.bodyStyle,
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          );
        },
      ),
    );
  }

  Widget _buildCustomItemsList() {
    final List<dynamic> customItems = _orderData!['custom_items'] ?? [];
    
    if (customItems.isEmpty) {
      return const SizedBox.shrink();
    }
    
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: customItems.length,
        separatorBuilder: (context, index) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final item = customItems[index];
          return ExpansionTile(
            title: Text(
              item['name']?.toString() ?? 'Custom Item',
              style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
            ),
            subtitle: item['description'] != null && item['description'].toString().isNotEmpty
                ? Text(
                    item['description'].toString(),
                    style: AppTheme.bodyStyle.copyWith(fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  )
                : null,
            trailing: Text(
              'Qty: ${item['quantity']?.toString() ?? '1'}',
              style: AppTheme.bodyStyle,
            ),
            children: [
              if (item['description'] != null && item['description'].toString().isNotEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Description: ${item['description']}',
                      style: AppTheme.bodyStyle,
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildAdditionalDetailsCard() {
    final List<dynamic> orderDetails = _orderData!['order_details'] ?? [];
    
    if (orderDetails.isEmpty) {
      return Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Colors.grey[200]!),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: Text(
              'No additional details',
              style: AppTheme.bodyStyle.copyWith(color: Colors.grey[600]),
            ),
          ),
        ),
      );
    }
    
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: orderDetails.map<Widget>((detail) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildInfoRow(
                detail['name']?.toString() ?? 'Unknown',
                detail['value']?.toString() ?? 'Not specified',
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: Text(
            label,
            style: AppTheme.bodyStyle.copyWith(color: Colors.grey[600]),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          flex: 3,
          child: Text(
            value,
            style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  Widget _buildLocationRow(String label, String address, String pincode, IconData icon) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppTheme.primaryColor),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: AppTheme.bodyStyle.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                address,
                style: AppTheme.bodyStyle,
              ),
              if (pincode.isNotEmpty) ...[  
                const SizedBox(height: 4),
                Text(
                  'Pincode: $pincode',
                  style: AppTheme.bodyStyle.copyWith(color: Colors.grey[600]),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget? _buildBottomButtons() {
    if (_orderData == null) return null;
    
    final String status = _orderData!['status']?.toString() ?? 'Processing';
    final bool canCancel = status != 'Cancelled' && status != 'Completed';
    final bool canAcceptPrice = status == 'Price Updated' && _orderData!['approx_price'] != null;
    
    if (!canCancel && !canAcceptPrice) return null;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Row(
        children: [
          if (canCancel)
            Expanded(
              child: OutlinedButton(
                onPressed: _cancelOrder,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  side: const BorderSide(color: Colors.red),
                ),
                child: Text(
                  'Cancel Order',
                  style: AppTheme.bodyStyle.copyWith(
                    color: Colors.red,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          if (canCancel && canAcceptPrice)
            const SizedBox(width: 16),
          if (canAcceptPrice)
            Expanded(
              child: ElevatedButton(
                onPressed: _acceptPrice,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: AppTheme.primaryColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  'Accept Price',
                  style: AppTheme.bodyStyle.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}