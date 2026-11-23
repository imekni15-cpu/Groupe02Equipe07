
import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ApiService {
  // Instance unique du service API
  static final ApiService instance = ApiService._internal();

  late final Dio dio;

  ApiService._internal() {
    dio = Dio(
      BaseOptions(
        // Adresse du Backend CampusSave
        baseUrl: 'http://localhost:5000/api',

        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        sendTimeout: const Duration(seconds: 15),

        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Intercepteur Firebase
    // Ajoute automatiquement le token à chaque requête
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          try {
            final user = FirebaseAuth.instance.currentUser;

            if (user != null) {
              final token = await user.getIdToken();

              if (token != null) {
                options.headers['Authorization'] =
                    'Bearer $token';
              }
            }

            handler.next(options);
          } catch (error) {
            handler.reject(
              DioException(
                requestOptions: options,
                error: error,
              ),
            );
          }
        },
      ),
    );
  }

  // ==========================================
  // 1. TEST DE CONNEXION AU BACKEND
  // ==========================================

  Future<Response> checkBackend() async {
    return await dio.get('/health');
  }

  // ==========================================
  // 2. OFFRES
  // ==========================================

  // Récupérer toutes les offres
  Future<Response> getOffers() async {
    return await dio.get('/offers');
  }

  // Récupérer une offre par son identifiant
  Future<Response> getOfferById(int id) async {
    return await dio.get('/offers/$id');
  }

  // ==========================================
  // 3. COMMANDES ÉTUDIANT
  // ==========================================

  // Récupérer les commandes de l'étudiant
  Future<Response> getMyOrders() async {
    return await dio.get('/orders/mine');
  }

  // Créer une commande
  Future<Response> createOrder({
    required int shopId,
    required List<Map<String, dynamic>> items,
  }) async {
    return await dio.post(
      '/orders',
      data: {
        'shopId': shopId,
        'items': items,
      },
    );
  }

  // Annuler une commande
  Future<Response> cancelOrder(int orderId) async {
    return await dio.delete('/orders/$orderId');
  }

  // ==========================================
  // 4. AUTHENTIFICATION FIREBASE
  // ==========================================

  // Récupérer l'utilisateur connecté
  User? get currentUser {
    return FirebaseAuth.instance.currentUser;
  }

  // Récupérer son token Firebase
  Future<String?> getCurrentUserToken() async {
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      return null;
    }

    return await user.getIdToken();
  }

  // Vérifier si un utilisateur est connecté
  bool get isLoggedIn {
    return FirebaseAuth.instance.currentUser != null;
  }

  // ==========================================
  // 5. DÉCONNEXION
  // ==========================================

  Future<void> logout() async {
    await FirebaseAuth.instance.signOut();
  }
}
