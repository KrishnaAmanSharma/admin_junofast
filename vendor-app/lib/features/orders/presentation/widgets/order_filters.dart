import 'package:flutter/material.dart';
import '../../../../core/constants/app_constants.dart';

class OrderFilters extends StatelessWidget {
  final String selectedServiceType;
  final String sortBy;
  final Function(String) onServiceTypeChanged;
  final Function(String) onSortChanged;

  const OrderFilters({
    Key? key,
    required this.selectedServiceType,
    required this.sortBy,
    required this.onServiceTypeChanged,
    required this.onSortChanged,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppConstants.defaultPadding),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Filters',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildServiceTypeFilter(),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSortFilter(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildServiceTypeFilter() {
    final serviceTypes = ['All', ...AppConstants.serviceTypes];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Service Type',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade700,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(8),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: selectedServiceType,
              isExpanded: true,
              items: serviceTypes.map((type) {
                return DropdownMenuItem<String>(
                  value: type,
                  child: Text(
                    type,
                    style: const TextStyle(fontSize: 14),
                    overflow: TextOverflow.ellipsis,
                  ),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  onServiceTypeChanged(value);
                }
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSortFilter() {
    final sortOptions = [
      {'value': 'created_at', 'label': 'Newest First'},
      {'value': 'price_high', 'label': 'Price: High to Low'},
      {'value': 'price_low', 'label': 'Price: Low to High'},
      {'value': 'distance', 'label': 'Distance'},
      {'value': 'priority', 'label': 'Priority'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Sort By',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade700,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(8),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: sortBy,
              isExpanded: true,
              items: sortOptions.map((option) {
                return DropdownMenuItem<String>(
                  value: option['value']!,
                  child: Text(
                    option['label']!,
                    style: const TextStyle(fontSize: 14),
                    overflow: TextOverflow.ellipsis,
                  ),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  onSortChanged(value);
                }
              },
            ),
          ),
        ),
      ],
    );
  }
}