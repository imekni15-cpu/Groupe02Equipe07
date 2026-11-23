
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../services/order_service.dart';

class OrderTrackingScreen extends StatelessWidget {
  OrderTrackingScreen({super.key});

  final OrderService orderService = OrderService();

  final Color greenColor = const Color(0xFF239B62);

  String getStatusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'En attente de paiement';
      case 'paid':
        return 'Payée';
      case 'ready':
        return 'Prête';
      case 'completed':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
      default:
        return 'Statut inconnu';
    }
  }

  Color getStatusColor(String status) {
    switch (status) {
      case 'paid':
      case 'completed':
        return Colors.green;
      case 'ready':
        return Colors.blue;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Suivi des commandes'),
        backgroundColor: greenColor,
        foregroundColor: Colors.white,
      ),
      body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream: orderService.getMyOrders(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (snapshot.hasError) {
            return Center(
              child: Text(
                'Erreur : ${snapshot.error}',
                textAlign: TextAlign.center,
              ),
            );
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.shopping_bag_outlined,
                    size: 70,
                    color: Colors.grey,
                  ),
                  SizedBox(height: 15),
                  Text(
                    'Aucune commande pour le moment',
                    style: TextStyle(fontSize: 17),
                  ),
                ],
              ),
            );
          }

          final orders = snapshot.data!.docs.toList();

          // Trier les commandes : les plus récentes en premier
          orders.sort((a, b) {
            final dateA = a.data()['createdAt'];
            final dateB = b.data()['createdAt'];

            final timeA = dateA is Timestamp
                ? dateA.millisecondsSinceEpoch
                : 0;

            final timeB = dateB is Timestamp
                ? dateB.millisecondsSinceEpoch
                : 0;

            return timeB.compareTo(timeA);
          });

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: orders.length,
            itemBuilder: (context, index) {
              final document = orders[index];
              final data = document.data();

              final String offerName =
                  data['offerName'] ?? 'Commande CampusSave';

              final int quantity =
                  (data['quantity'] as num?)?.toInt() ?? 1;

              final double totalPrice =
                  (data['totalPrice'] as num?)?.toDouble() ?? 0;

              final String status = data['status'] ?? 'pending';

              final Color statusColor = getStatusColor(status);

              return Card(
                margin: const EdgeInsets.only(bottom: 15),
                elevation: 3,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.receipt_long,
                            color: greenColor,
                            size: 30,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              offerName,
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      Text('Quantité : $quantity'),

                      const SizedBox(height: 5),

                      Text(
                        'Total : ${totalPrice.toStringAsFixed(2)} DT',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 12),

                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 7,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          getStatusLabel(status),
                          style: TextStyle(
                            color: statusColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),

                      const SizedBox(height: 10),

                      Text(
                        'Référence : ${document.id}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
