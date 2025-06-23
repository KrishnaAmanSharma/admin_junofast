import 'package:flutter/material.dart';
import '../configs/app_constants.dart';
import '../models/order_model.dart';

class OrderCard extends StatelessWidget {
  final OrderModel order;
  final bool isAvailable;
  final VoidCallback? onAccept;
  final VoidCallback? onViewDetails;
  final VoidCallback? onRequestPriceUpdate;

  const OrderCard({
    Key? key,
    required this.order,
    this.isAvailable = false,
    this.onAccept,
    this.onViewDetails,
    this.onRequestPriceUpdate, required void Function() onReject,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppConstants.borderRadius),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(context),
          _buildContent(context),
          _buildFooter(context),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppConstants.primaryColor.withOpacity(0.05),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(AppConstants.borderRadius),
          topRight: Radius.circular(AppConstants.borderRadius),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppConstants.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              _getServiceIcon(order.serviceType),
              color: AppConstants.primaryColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  order.serviceType,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppConstants.textColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Order #${order.id.substring(0, 8)}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
          _buildStatusBadge(),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildLocationInfo(),
          const SizedBox(height: 12),
          _buildPriceInfo(),
          const SizedBox(height: 12),
          _buildItemsInfo(),
          if (order.specialInstructions != null) ...[
            const SizedBox(height: 12),
            _buildSpecialInstructions(),
          ],
          const SizedBox(height: 12),
          _buildOrderDetails(context),
        ],
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    final bool canSendPriceUpdate = isAvailable && order.status.toLowerCase() == 'broadcasted' && onRequestPriceUpdate != null;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(AppConstants.borderRadius),
          bottomRight: Radius.circular(AppConstants.borderRadius),
        ),
      ),
      child: Row(
        children: [
          Text(
            _formatTimeAgo(order.createdAt),
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
          ),
          const Spacer(),
          if (isAvailable && order.status.toLowerCase() == 'broadcasted') ...[
            OutlinedButton(
              onPressed: onViewDetails,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                minimumSize: const Size(0, 36),
              ),
              child: const Text('Details'),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: onAccept,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                minimumSize: const Size(0, 36),
              ),
              child: const Text('Accept'),
            ),
            if (canSendPriceUpdate) ...[
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: onRequestPriceUpdate,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.warningColor,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  minimumSize: const Size(0, 36),
                ),
                child: const Text('Send Price Update Request'),
              ),
            ],
          ] else ...[
            OutlinedButton(
              onPressed: onViewDetails,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                minimumSize: const Size(0, 36),
              ),
              child: const Text('View Details'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLocationInfo() {
    return Row(
      children: [
        Icon(
          Icons.location_on_outlined,
          size: 16,
          color: Colors.grey.shade600,
        ),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            order.city,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade700,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        if (order.distance != null) ...[
          Icon(
            Icons.straighten,
            size: 14,
            color: Colors.grey.shade600,
          ),
          const SizedBox(width: 4),
          Text(
            '${order.distance!.toStringAsFixed(1)} km',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPriceInfo() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppConstants.primaryColor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: AppConstants.primaryColor.withOpacity(0.2),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.attach_money,
            color: AppConstants.primaryColor,
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(
            'Price: ',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade700,
            ),
          ),
          Text(
            order.formattedPrice,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppConstants.primaryColor,
            ),
          ),
          if (order.finalPrice != null && order.approxPrice != order.finalPrice) ...[
            const SizedBox(width: 8),
            Text(
              '(Est: \$${order.approxPrice?.toStringAsFixed(2) ?? 'N/A'})',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
                decoration: TextDecoration.lineThrough,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildItemsInfo() {
    final totalItems = order.commonItems.length + order.customItems.length;
    if (totalItems == 0) return const SizedBox.shrink();

    return Row(
      children: [
        Icon(
          Icons.inventory_2_outlined,
          size: 16,
          color: Colors.grey.shade600,
        ),
        const SizedBox(width: 4),
        Text(
          '$totalItems items',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey.shade700,
          ),
        ),
        const SizedBox(width: 16),
        if (order.commonItems.isNotEmpty) ...[
          Text(
            '${order.commonItems.length} standard',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
          ),
          if (order.customItems.isNotEmpty) ...[
            Text(
              ', ${order.customItems.length} custom',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ] else if (order.customItems.isNotEmpty) ...[
          Text(
            '${order.customItems.length} custom items',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildSpecialInstructions() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppConstants.warningColor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: AppConstants.warningColor.withOpacity(0.2),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.info_outline,
            color: AppConstants.warningColor,
            size: 16,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              order.specialInstructions!,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade700,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderDetails(BuildContext context) {
    return Row(
      children: [
        if (order.scheduledDate != null) ...[
          Icon(
            Icons.schedule,
            size: 14,
            color: Colors.grey.shade600,
          ),
          const SizedBox(width: 4),
          Text(
            'Scheduled: ${_formatDate(order.scheduledDate!)}',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
          ),
        ],
        const Spacer(),
        if (order.priority > 1) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
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
      ],
    );
  }

  Widget _buildStatusBadge() {
    Color backgroundColor;
    Color textColor;
    String displayText;

    switch (order.status) {
      case 'pending':
        backgroundColor = AppConstants.pendingColor.withOpacity(0.1);
        textColor = AppConstants.pendingColor;
        displayText = 'Available';
        break;
      case 'assigned':
        backgroundColor = AppConstants.assignedColor.withOpacity(0.1);
        textColor = AppConstants.assignedColor;
        displayText = 'Assigned';
        break;
      case 'in_progress':
        backgroundColor = AppConstants.inProgressColor.withOpacity(0.1);
        textColor = AppConstants.inProgressColor;
        displayText = 'In Progress';
        break;
      case 'completed':
        backgroundColor = AppConstants.completedColor.withOpacity(0.1);
        textColor = AppConstants.completedColor;
        displayText = 'Completed';
        break;
      case 'cancelled':
        backgroundColor = AppConstants.cancelledColor.withOpacity(0.1);
        textColor = AppConstants.cancelledColor;
        displayText = 'Cancelled';
        break;
      case 'price_updated':
        backgroundColor = AppConstants.warningColor.withOpacity(0.1);
        textColor = AppConstants.warningColor;
        displayText = 'Price Updated';
        break;
      default:
        backgroundColor = Colors.grey.withOpacity(0.1);
        textColor = Colors.grey;
        displayText = order.status.toUpperCase();
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        displayText,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  IconData _getServiceIcon(String serviceType) {
    switch (serviceType.toLowerCase()) {
      case 'house relocation':
        return Icons.home;
      case 'office relocation':
        return Icons.business;
      case 'vehicle transportation':
        return Icons.directions_car;
      case 'pet relocation':
        return Icons.pets;
      case 'industrial moving':
        return Icons.factory;
      case 'event/exhibition setup':
        return Icons.event;
      default:
        return Icons.local_shipping;
    }
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  String _formatDate(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
  }
}