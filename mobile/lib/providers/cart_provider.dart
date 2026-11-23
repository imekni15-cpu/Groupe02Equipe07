
import 'package:flutter/material.dart';
import '../models/offer_model.dart';

class CartItem {
  final OfferModel offer;
  int quantity;

  CartItem({
    required this.offer,
    this.quantity = 1,
  });

  double get total => offer.discountPrice * quantity;
}

class CartProvider extends ChangeNotifier {
  final Map<int, CartItem> _items = {};

  List<CartItem> get items => _items.values.toList();

  int get totalItems {
    return _items.values.fold(
      0,
      (total, item) => total + item.quantity,
    );
  }

  double get totalPrice {
    return _items.values.fold(
      0,
      (total, item) => total + item.total,
    );
  }

  bool get isEmpty => _items.isEmpty;

  // Ajouter une offre
  void addOffer(OfferModel offer, {int quantity = 1}) {
    if (quantity <= 0 || offer.quantity <= 0) return;

    final existing = _items[offer.id];

    if (existing != null) {
      final newQuantity = existing.quantity + quantity;

      if (newQuantity <= offer.quantity) {
        existing.quantity = newQuantity;
      }
    } else {
      final safeQuantity =
          quantity > offer.quantity ? offer.quantity : quantity;

      _items[offer.id] = CartItem(
        offer: offer,
        quantity: safeQuantity,
      );
    }

    notifyListeners();
  }

  // Augmenter la quantité
  void increaseQuantity(int offerId) {
    final item = _items[offerId];

    if (item == null) return;

    if (item.quantity < item.offer.quantity) {
      item.quantity++;
      notifyListeners();
    }
  }

  // Diminuer la quantité
  void decreaseQuantity(int offerId) {
    final item = _items[offerId];

    if (item == null) return;

    if (item.quantity > 1) {
      item.quantity--;
      notifyListeners();
    }
  }

  // Supprimer une offre
  void removeOffer(int offerId) {
    _items.remove(offerId);
    notifyListeners();
  }

  // Vider le panier
  void clearCart() {
    _items.clear();
    notifyListeners();
  }
}
