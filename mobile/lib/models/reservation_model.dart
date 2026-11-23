import 'package:cloud_firestore/cloud_firestore.dart';
class ReservationModel {
  final String id;
  final String offerName;
  final String restaurant;
  final double price;
  final int quantity;
  final DateTime date;
  final String status;
  final String paymentStatus;
  final String? qrCode;
  final String? paymentId;

  ReservationModel({
    required this.id,
    required this.offerName,
    required this.restaurant,
    required this.price,
    required this.quantity,
    required this.date,
    this.status = 'pending_payment',
    this.paymentStatus = 'pending',
    this.qrCode,
    this.paymentId,
  });

  double get totalPrice => price * quantity;

  bool get isPaid => paymentStatus == 'paid';

  bool get hasQrCode => qrCode != null && qrCode!.isNotEmpty;

  factory ReservationModel.fromMap(
    String id,
    Map<String, dynamic> data,
  ) {
    final dateValue = data['date'];

    DateTime reservationDate;

    if (dateValue is Timestamp) {
      reservationDate = dateValue.toDate();
    } else {
      reservationDate = DateTime.now();
    }

    return ReservationModel(
      id: id,
      offerName: data['offerName'] ?? '',
      restaurant: data['restaurant'] ?? '',
      price: (data['price'] as num?)?.toDouble() ?? 0,
      quantity: (data['quantity'] as num?)?.toInt() ?? 1,
      date: reservationDate,
      status: data['status'] ?? 'pending_payment',
      paymentStatus: data['paymentStatus'] ?? 'pending',
      qrCode: data['qrCode'],
      paymentId: data['paymentId'],
    );
  }
}
