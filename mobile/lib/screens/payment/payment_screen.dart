
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'order_confirmation_screen.dart';

class PaymentScreen extends StatefulWidget {
  final String orderId;
  final double amount;
  final String paymentUrl;
  final String returnUrl;

  const PaymentScreen({
    super.key,
    required this.orderId,
    required this.amount,
    required this.paymentUrl,
    required this.returnUrl,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  late final WebViewController controller;
  bool loading = true;
  bool opened = false;

  @override
  void initState() {
    super.initState();

    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => loading = true);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => loading = false);
          },
          onNavigationRequest: (request) {
            if (request.url.startsWith(widget.returnUrl)) {
              if (!opened) {
                opened = true;
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (_) => OrderConfirmationScreen(
                      orderId: widget.orderId,
                    ),
                  ),
                );
              }
              return NavigationDecision.prevent;
            }

            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.paymentUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Paiement Konnect'),
        backgroundColor: const Color(0xFF239B62),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: Colors.green.shade50,
            child: Column(
              children: [
                const Text('Montant à payer'),
                const SizedBox(height: 5),
                Text(
                  '${widget.amount.toStringAsFixed(2)} DT',
                  style: const TextStyle(
                    fontSize: 25,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF239B62),
                  ),
                ),
              ],
            ),
          ),
          if (loading) const LinearProgressIndicator(),
          Expanded(
            child: WebViewWidget(controller: controller),
          ),
        ],
      ),
    );
  }
}
