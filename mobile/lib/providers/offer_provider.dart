
import 'package:flutter/material.dart';
import '../models/offer_model.dart';
import '../services/api_service.dart';

class OfferProvider extends ChangeNotifier {
  List<OfferModel> _offers = [];
  bool _isLoading = false;
  String? _error;

  bool _usingDemoData = false;

  List<OfferModel> get offers => List.unmodifiable(_offers);
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get usingDemoData => _usingDemoData;

  // Données temporaires en attendant le backend
  final List<OfferModel> _demoOffers = [
    OfferModel(
      id: 1,
      shopId: 1,
      title: 'Sandwich au poulet',
      category: 'Sandwich',
      description: 'Délicieux sandwich au poulet frais.',
      originalPrice: 8.0,
      discountPrice: 4.5,
      quantity: 10,
      pickupStart: '12:00',
      pickupEnd: '14:00',
      photoUrl: null,
      status: 'active',
      shopName: 'Campus Food',
    ),
    OfferModel(
      id: 2,
      shopId: 1,
      title: 'Pizza Margherita',
      category: 'Plat chaud',
      description: 'Pizza avec fromage et sauce tomate.',
      originalPrice: 12.0,
      discountPrice: 7.0,
      quantity: 5,
      pickupStart: '13:00',
      pickupEnd: '15:00',
      photoUrl: null,
      status: 'active',
      shopName: 'Campus Food',
    ),
    OfferModel(
      id: 3,
      shopId: 2,
      title: 'Jus d orange frais',
      category: 'Boisson',
      description: 'Jus naturel préparé chaque jour.',
      originalPrice: 5.0,
      discountPrice: 2.5,
      quantity: 8,
      pickupStart: '10:00',
      pickupEnd: '16:00',
      photoUrl: null,
      status: 'active',
      shopName: 'Fresh Corner',
    ),
    OfferModel(
      id: 4,
      shopId: 2,
      title: 'Salade fraîche',
      category: 'Salade',
      description: 'Salade fraîche et équilibrée.',
      originalPrice: 9.0,
      discountPrice: 5.0,
      quantity: 6,
      pickupStart: '11:00',
      pickupEnd: '14:00',
      photoUrl: null,
      status: 'active',
      shopName: 'Fresh Corner',
    ),
  ];

  Future<void> loadOffers() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.instance.getOffers();
      final data = response.data;

      if (data is! List) {
        throw Exception('Format des offres incorrect');
      }

      _offers = data
          .map((item) => OfferModel.fromJson(
                Map<String, dynamic>.from(item),
              ))
          .where((offer) =>
              offer.status == 'active' && offer.quantity > 0)
          .toList();

      _usingDemoData = false;
    } catch (e) {
      // Le backend n'est pas encore disponible.
      _offers = List<OfferModel>.from(_demoOffers);
      _usingDemoData = true;
      _error = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
