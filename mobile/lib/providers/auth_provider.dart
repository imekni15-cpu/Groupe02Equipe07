
import 'package:flutter/material.dart';
import '../models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _currentUser;

  bool _isLoading = false;

  // UTILISATEUR CONNECTE
  UserModel? get currentUser => _currentUser;

  // VERIFIER SI L'UTILISATEUR EST CONNECTE
  bool get isLoggedIn => _currentUser != null;

  // ETAT DE CHARGEMENT
  bool get isLoading => _isLoading;

  // MODIFIER L'ETAT DE CHARGEMENT
  void setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  // ENREGISTRER LES INFORMATIONS DE L'ETUDIANT
  void setUser(UserModel user) {
    _currentUser = user;
    notifyListeners();
  }

  // DECONNECTER L'ETUDIANT
  void logout() {
    _currentUser = null;
    _isLoading = false;
    notifyListeners();
  }
}
