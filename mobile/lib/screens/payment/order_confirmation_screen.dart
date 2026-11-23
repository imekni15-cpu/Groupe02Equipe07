
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:qr_flutter/qr_flutter.dart';

class OrderConfirmationScreen extends StatelessWidget {
  final String orderId;

  const OrderConfirmationScreen({
    super.key,
    required this.orderId,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Confirmation'),
        backgroundColor: const Color(0xFF239B62),
        foregroundColor: Colors.white,
      ),
      body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
        stream: FirebaseFirestore.instance
            .collection('orders')
            .doc(orderId)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return const Center(
              child: Text('Erreur de chargement de la commande'),
            );
          }

          if (!snapshot.hasData || !snapshot.data!.exists) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          final data = snapshot.data!.data()!;
          final status = data['status'] ?? 'pending';

          if (status != 'paid') {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.hourglass_top,
                      color: Colors.orange,
                      size: 75,
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Paiement en attente de confirmation',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Votre paiement sera confirmé après vérification '
                      'par le serveur.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    Text('Commande : $orderId'),
                  ],
                ),
              ),
            );
          }

          return Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.check_circle,
                    color: Colors.green,
                    size: 80,
                  ),
                  const SizedBox(height: 15),
                  const Text(
                    'Paiement confirmé !',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(data['offerName'] ?? 'Commande CampusSave'),
                  const SizedBox(height: 20),
                  QrImageView(
                    data: 'CAMPUSSAVE_ORDER:$orderId',
                    version: QrVersions.auto,
                    size: 220,
                  ),
                  const SizedBox(height: 10),
                  const Text('Présentez ce QR Code au commerçant'),
                  const SizedBox(height: 10),
                  Text(
                    'Commande : $orderId',
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
