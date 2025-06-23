import 'package:flutter/material.dart';
import '../configs/app_constants.dart';

class QuickActionsCard extends StatelessWidget {
  const QuickActionsCard({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: AppConstants.cardElevation,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.borderRadius),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Quick Actions',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppConstants.textColor,
              ),
            ),
            const SizedBox(height: 16),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 2.5,
              children: [
                _buildActionButton(
                  icon: Icons.search,
                  title: 'Find Orders',
                  color: AppConstants.primaryColor,
                  onTap: () => Navigator.pushNamed(context, '/available-orders'),
                ),
                _buildActionButton(
                  icon: Icons.assignment,
                  title: 'My Orders',
                  color: AppConstants.secondaryColor,
                  onTap: () => Navigator.pushNamed(context, '/my-orders'),
                ),
                _buildActionButton(
                  icon: Icons.trending_up,
                  title: 'Earnings',
                  color: AppConstants.warningColor,
                  onTap: () => Navigator.pushNamed(context, '/earnings'),
                ),
                _buildActionButton(
                  icon: Icons.settings,
                  title: 'Settings',
                  color: Colors.grey.shade600,
                  onTap: () => Navigator.pushNamed(context, '/profile'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String title,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(AppConstants.borderRadius),
          border: Border.all(
            color: color.withOpacity(0.2),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: color,
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              title,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}