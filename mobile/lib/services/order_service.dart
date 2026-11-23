
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class OrderService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  String? get currentUserId => FirebaseAuth.instance.currentUser?.uid;

  // Créer une commande
  Future<String> createOrder({
    required String offerName,
    required int quantity,
    required double totalPrice,
  }) async {
    final userId = currentUserId;

    if (userId == null) {
      throw Exception('Utilisateur non connecté');
    }

    final doc = await _db.collection('orders').add({
      'userId': userId,
      'offerName': offerName,
      'quantity': quantity,
      'totalPrice': totalPrice,
      'status': 'pending',
      'paymentStatus': 'pending',
      'createdAt': FieldValue.serverTimestamp(),
    });

    return doc.id;
  }

  // Récupérer les commandes de l'utilisateur connecté
  Stream<QuerySnapshot<Map<String, dynamic>>> getMyOrders() {
    final userId = currentUserId;

    if (userId == null) {
      return const Stream.empty();
    }

    return _db
        .collection('orders')
        .where('userId', isEqualTo: userId)
        .snapshots();
  }

  // Récupérer une commande précise
  Stream<DocumentSnapshot<Map<String, dynamic>>> getOrder(
    String orderId,
  ) {
    return _db.collection('orders').doc(orderId).snapshots();
  }
}
