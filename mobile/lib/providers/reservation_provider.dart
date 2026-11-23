
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/reservation_model.dart';
import 'cart_provider.dart';

class ReservationProvider extends ChangeNotifier {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  final List<ReservationModel> _reservations = [];

  List<ReservationModel> get reservations =>
      List.unmodifiable(_reservations);

  bool isLoading = false;
  String? error;

  // =========================
  // CHARGER LES RESERVATIONS
  // =========================
  Future<void> loadReservations() async {
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      _reservations.clear();
      error = null;
      notifyListeners();
      return;
    }

    isLoading = true;
    error = null;
    notifyListeners();

    try {
      final snapshot = await _db
          .collection('reservations')
          .where('userId', isEqualTo: user.uid)
          .get();

      _reservations.clear();

      for (final doc in snapshot.docs) {
        _reservations.add(
          ReservationModel.fromMap(doc.id, doc.data()),
        );
      }

      _reservations.sort(
        (a, b) => b.date.compareTo(a.date),
      );
    } catch (e) {
      error = 'Impossible de charger les réservations : $e';
      debugPrint(error);
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  // =========================
  // AJOUTER UNE RESERVATION
  // =========================
  Future<String> addReservation({
    required String offerName,
    required String restaurant,
    required double price,
    required int quantity,
  }) async {
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      throw Exception('Utilisateur non connecté');
    }

    if (quantity <= 0 || price <= 0) {
      throw Exception('Quantité ou prix invalide');
    }

    final docRef = await _db.collection('reservations').add({
      'userId': user.uid,
      'offerName': offerName,
      'restaurant': restaurant,
      'price': price,
      'quantity': quantity,
      'totalPrice': price * quantity,
      'date': FieldValue.serverTimestamp(),
      'status': 'pending_payment',
      'paymentStatus': 'pending',
      'qrCode': null,
      'paymentId': null,
    });

    final reservation = ReservationModel(
      id: docRef.id,
      offerName: offerName,
      restaurant: restaurant,
      price: price,
      quantity: quantity,
      date: DateTime.now(),
    );

    _reservations.insert(0, reservation);
    notifyListeners();

    return docRef.id;
  }

  // =========================
  // CONFIRMER LES OFFRES DU PANIER
  // =========================
  Future<void> confirmCart(List<CartItem> cartItems) async {
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      throw Exception('Utilisateur non connecté');
    }

    if (cartItems.isEmpty) {
      throw Exception('Votre panier est vide');
    }

    final batch = _db.batch();
    final newReservations = <ReservationModel>[];

    for (final item in cartItems) {
      if (item.quantity <= 0 ||
          item.quantity > item.offer.quantity) {
        throw Exception(
          'Quantité invalide pour ${item.offer.title}',
        );
      }

      final docRef = _db.collection('reservations').doc();

      batch.set(docRef, {
        'userId': user.uid,
        'offerId': item.offer.id,
        'offerName': item.offer.title,
        'restaurant': item.offer.shopName ?? 'CampusSave',
        'price': item.offer.discountPrice,
        'quantity': item.quantity,
        'totalPrice': item.total,
        'date': FieldValue.serverTimestamp(),
        'status': 'pending_payment',
        'paymentStatus': 'pending',
        'qrCode': null,
        'paymentId': null,
      });

      newReservations.add(
        ReservationModel(
          id: docRef.id,
          offerName: item.offer.title,
          restaurant: item.offer.shopName ?? 'CampusSave',
          price: item.offer.discountPrice,
          quantity: item.quantity,
          date: DateTime.now(),
        ),
      );
    }

    await batch.commit();

    _reservations.insertAll(0, newReservations);
    notifyListeners();
  }

  // =========================
  // ANNULER UNE RESERVATION
  // =========================
  Future<void> cancelReservation(String id) async {
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      throw Exception('Utilisateur non connecté');
    }

    final docRef = _db.collection('reservations').doc(id);

    // DIAGNOSTIC
    debugPrint('========== ANNULATION ==========');
    debugPrint('UID connecté : ${user.uid}');
    debugPrint('ID réservation : $id');
    debugPrint('Chemin Firestore : ${docRef.path}');

    // Lire le document
    final doc = await docRef.get();

    debugPrint('Document existe : ${doc.exists}');
    debugPrint('UserId document : ${doc.data()?['userId']}');
    debugPrint('==============================');

    if (!doc.exists) {
      throw Exception('Réservation introuvable');
    }

    final data = doc.data();

    // Vérifier le propriétaire
    if (data == null || data['userId'] != user.uid) {
      throw Exception(
        'Vous ne pouvez pas annuler cette réservation',
      );
    }

    // Vérifier si déjà annulée
    if (data['status'] == 'cancelled' ||
        data['paymentStatus'] == 'cancelled') {
      throw Exception('Cette réservation est déjà annulée');
    }

    // Interdire annulation après paiement
    if (data['paymentStatus'] == 'paid' ||
        data['status'] == 'paid' ||
        data['status'] == 'picked_up') {
      throw Exception(
        'Cette réservation ne peut plus être annulée',
      );
    }

    // Supprimer de Firestore
    await docRef.delete();

    // Supprimer de la liste locale après réussite
    _reservations.removeWhere(
      (reservation) => reservation.id == id,
    );

    notifyListeners();

    debugPrint('Réservation supprimée avec succès.');
  }
}
