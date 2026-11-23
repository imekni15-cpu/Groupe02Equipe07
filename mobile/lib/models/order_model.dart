import 'package:cloud_firestore/cloud_firestore.dart';
class OrderModel {
  final String id;
  final String userId;
  final String offerName;
  final int quantity;
  final double totalPrice;
  final String status;
  final DateTime createdAt;
  final String? paymentUrl;

  OrderModel({
    required this.id,
    required this.userId,
    required this.offerName,
    required this.quantity,
    required this.totalPrice,
    required this.status,
    required this.createdAt,
    this.paymentUrl,
  });

  factory OrderModel.fromFirestore(String id, Map<String, dynamic> data) {
    return OrderModel(
      id: id,
      userId: data['userId'] ?? '',
      offerName: data['offerName'] ?? 'Commande CampusSave',
      quantity: (data['quantity'] as num?)?.toInt() ?? 1,
      totalPrice: (data['totalPrice'] as num?)?.toDouble() ?? 0,
      status: data['status'] ?? 'pending',
      createdAt: data['createdAt'] is Timestamp
          ? (data['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      paymentUrl: data['paymentUrl'],
    );
  }
}
