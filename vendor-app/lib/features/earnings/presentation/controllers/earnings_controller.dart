import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/services/auth_service.dart';

class EarningsController extends GetxController {
  double _totalEarnings = 0.0;
  double _monthlyEarnings = 0.0;
  double _weeklyEarnings = 0.0;
  double _dailyEarnings = 0.0;
  List<Map<String, dynamic>> _earningsHistory = [];
  Map<String, double> _earningsByService = {};
  bool _isLoading = false;
  String? _error;

  double get totalEarnings => _totalEarnings;
  double get monthlyEarnings => _monthlyEarnings;
  double get weeklyEarnings => _weeklyEarnings;
  double get dailyEarnings => _dailyEarnings;
  List<Map<String, dynamic>> get earningsHistory => _earningsHistory;
  Map<String, double> get earningsByService => _earningsByService;
  bool get isLoading => _isLoading;
  String? get error => _error;

  final SupabaseClient _supabase = Supabase.instance.client;

  @override
  void onInit() {
    super.onInit();
    loadEarnings();
  }

  Future<void> loadEarnings() async {
    _setLoading(true);
    try {
      final authService = Get.find<AuthService>();
      final vendorId = authService.currentUser?.id;
      
      if (vendorId == null) {
        throw Exception('Vendor not authenticated');
      }

      // Load completed orders with earnings
      final ordersResponse = await _supabase
          .from('orders')
          .select('final_price, service_type, completed_at, created_at')
          .eq('vendor_id', vendorId)
          .eq('status', 'completed')
          .not('final_price', 'is', null)
          .order('completed_at', ascending: false);

      _calculateEarnings(ordersResponse);
      _calculateEarningsByService(ordersResponse);
      _buildEarningsHistory(ordersResponse);

      _error = null;
    } catch (e) {
      _error = 'Failed to load earnings: ${e.toString()}';
    } finally {
      _setLoading(false);
    }
  }

  void _calculateEarnings(List<dynamic> orders) {
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    final startOfWeek = now.subtract(Duration(days: now.weekday - 1));
    final startOfDay = DateTime(now.year, now.month, now.day);

    _totalEarnings = 0.0;
    _monthlyEarnings = 0.0;
    _weeklyEarnings = 0.0;
    _dailyEarnings = 0.0;

    for (final order in orders) {
      final price = (order['final_price'] as num?)?.toDouble() ?? 0.0;
      final completedAt = DateTime.parse(order['completed_at'] ?? order['created_at']);

      _totalEarnings += price;

      if (completedAt.isAfter(startOfMonth)) {
        _monthlyEarnings += price;
      }

      if (completedAt.isAfter(startOfWeek)) {
        _weeklyEarnings += price;
      }

      if (completedAt.isAfter(startOfDay)) {
        _dailyEarnings += price;
      }
    }
  }

  void _calculateEarningsByService(List<dynamic> orders) {
    _earningsByService.clear();

    for (final order in orders) {
      final serviceType = order['service_type'] as String;
      final price = (order['final_price'] as num?)?.toDouble() ?? 0.0;

      _earningsByService[serviceType] = (_earningsByService[serviceType] ?? 0.0) + price;
    }
  }

  void _buildEarningsHistory(List<dynamic> orders) {
    final Map<String, double> dailyEarnings = {};

    for (final order in orders) {
      final price = (order['final_price'] as num?)?.toDouble() ?? 0.0;
      final completedAt = DateTime.parse(order['completed_at'] ?? order['created_at']);
      final dateKey = '${completedAt.year}-${completedAt.month.toString().padLeft(2, '0')}-${completedAt.day.toString().padLeft(2, '0')}';

      dailyEarnings[dateKey] = (dailyEarnings[dateKey] ?? 0.0) + price;
    }

    _earningsHistory = dailyEarnings.entries
        .map((entry) => {
              'date': entry.key,
              'amount': entry.value,
            })
        .toList()
      ..sort((a, b) => b['date'].compareTo(a['date']));

    // Keep only last 30 days
    if (_earningsHistory.length > 30) {
      _earningsHistory = _earningsHistory.take(30).toList();
    }
  }

  double getEarningsGrowth() {
    if (_earningsHistory.length < 2) return 0.0;

    final thisWeekEarnings = _weeklyEarnings;
    final lastWeekStart = DateTime.now().subtract(const Duration(days: 14));
    final lastWeekEnd = DateTime.now().subtract(const Duration(days: 7));

    double lastWeekEarnings = 0.0;
    for (final entry in _earningsHistory) {
      final date = DateTime.parse(entry['date']);
      if (date.isAfter(lastWeekStart) && date.isBefore(lastWeekEnd)) {
        lastWeekEarnings += entry['amount'] as double;
      }
    }

    if (lastWeekEarnings == 0) return thisWeekEarnings > 0 ? 100.0 : 0.0;
    return ((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings) * 100;
  }

  String getTopServiceType() {
    if (_earningsByService.isEmpty) return 'No data';

    final topEntry = _earningsByService.entries
        .reduce((a, b) => a.value > b.value ? a : b);

    return topEntry.key;
  }

  int getCompletedOrdersCount() {
    return _earningsHistory.fold(0, (sum, entry) {
      // This is a simplified count - in real app, you'd track orders count separately
      return sum + (entry['amount'] as double > 0 ? 1 : 0);
    });
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    update();
  }
}