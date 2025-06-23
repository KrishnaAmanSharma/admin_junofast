import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../configs/app_constants.dart';
import '../services/orders_controller.dart';

class OrderTrackingPage extends StatefulWidget {
  const OrderTrackingPage({Key? key}) : super(key: key);

  @override
  _OrderTrackingPageState createState() => _OrderTrackingPageState();
}

class _OrderTrackingPageState extends State<OrderTrackingPage> {
  late OrdersController ordersController;
  String? orderId;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    ordersController = Provider.of<OrdersController>(context, listen: false);
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is String) {
      orderId = args;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: AppBar(
        title: const Text('Order Tracking'),
      ),
      body: const Center(
        child: Text('Order Tracking Page - To be implemented'),
      ),
    );
  }
}