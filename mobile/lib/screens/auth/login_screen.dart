
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLogin;

  const LoginScreen({
    super.key,
    required this.onLogin,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final formKey = GlobalKey<FormState>();

  final firstNameController = TextEditingController();
  final lastNameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();

  final FirebaseAuth auth = FirebaseAuth.instance;
  final FirebaseFirestore firestore = FirebaseFirestore.instance;

  bool isRegister = false;
  bool obscurePassword = true;
  bool isLoading = false;

  @override
  void dispose() {
    firstNameController.dispose();
    lastNameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  // Afficher un message
  void showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // Créer ou compléter le profil Firestore
  Future<void> saveUserProfile(User user) async {
    final userRef = firestore.collection('users').doc(user.uid);

    final userSnapshot = await userRef.get();

    final data = <String, dynamic>{
      'uid': user.uid,
      'email': user.email,
      'role': 'student',
      'lastLoginAt': FieldValue.serverTimestamp(),
    };

    if (!userSnapshot.exists) {
      // Récupérer le nom depuis Firebase Authentication
      final fullName = user.displayName?.trim() ?? '';
      final nameParts = fullName.isEmpty
          ? <String>[]
          : fullName.split(RegExp(r'\s+'));

      final firstName = nameParts.isNotEmpty
          ? nameParts.first
          : '';

      final lastName = nameParts.length > 1
          ? nameParts.skip(1).join(' ')
          : '';

      data.addAll({
        'firstName': firstName,
        'lastName': lastName,
        'createdAt': FieldValue.serverTimestamp(),
      });
    }

    await userRef.set(data, SetOptions(merge: true));
  }

  // Inscription et connexion
  Future<void> submitForm() async {
    if (!formKey.currentState!.validate()) return;

    setState(() {
      isLoading = true;
    });

    final email = emailController.text.trim().toLowerCase();
    final password = passwordController.text;

    try {
      if (isRegister) {
        // 1. Créer le compte Firebase Authentication
        final credential = await auth.createUserWithEmailAndPassword(
          email: email,
          password: password,
        );

        final user = credential.user!;

        // 2. Récupérer les informations
        final firstName = firstNameController.text.trim();
        final lastName = lastNameController.text.trim();
        final fullName = '$firstName $lastName';

        // 3. Enregistrer le nom dans Firebase Authentication
        await user.updateDisplayName(fullName);

        // 4. Enregistrer le profil dans Firestore
        await firestore.collection('users').doc(user.uid).set({
          'uid': user.uid,
          'firstName': firstName,
          'lastName': lastName,
          'email': email,
          'role': 'student',
          'createdAt': FieldValue.serverTimestamp(),
          'lastLoginAt': FieldValue.serverTimestamp(),
        });

        // 5. Déconnexion après inscription
        await auth.signOut();

        if (!mounted) return;

        setState(() {
          isRegister = false;
          passwordController.clear();
          confirmPasswordController.clear();
        });

        showMessage(
          'Compte créé avec succès ! Connecte-toi maintenant.',
        );
      } else {
        // 1. Connexion avec un compte existant
        final credential = await auth.signInWithEmailAndPassword(
          email: email,
          password: password,
        );

        final user = credential.user!;

        // 2. Vérifier et créer le profil Firestore s'il manque
        await saveUserProfile(user);

        if (!mounted) return;

        // 3. Ouvrir l'application
        widget.onLogin();
      }
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;

      switch (e.code) {
        case 'email-already-in-use':
          showMessage('Cette adresse e-mail est déjà utilisée.');
          break;

        case 'invalid-email':
          showMessage('Adresse e-mail invalide.');
          break;

        case 'weak-password':
          showMessage('Mot de passe trop faible (6 caractères minimum).');
          break;

        case 'user-not-found':
        case 'wrong-password':
        case 'invalid-credential':
          showMessage('E-mail ou mot de passe incorrect.');
          break;

        case 'too-many-requests':
          showMessage('Trop de tentatives. Réessaie plus tard.');
          break;

        case 'network-request-failed':
          showMessage('Problème de connexion Internet.');
          break;

        default:
          showMessage('Erreur Firebase : ${e.message ?? e.code}');
      }
    } on FirebaseException catch (e) {
      if (!mounted) return;

      showMessage(
        'Erreur Firebase : ${e.message ?? e.code}',
      );
    } catch (e) {
      if (!mounted) return;

      showMessage('Une erreur est survenue : $e');
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  // Champ texte réutilisable
  Widget buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool isEmail = false,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType:
          isEmail ? TextInputType.emailAddress : TextInputType.text,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
        ),
      ),
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'Ce champ est obligatoire';
        }

        if (isEmail &&
            !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
                .hasMatch(value.trim())) {
          return 'Adresse e-mail invalide';
        }

        return null;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9F7),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(25),
            child: Form(
              key: formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(
                    Icons.eco,
                    color: Color(0xFF239B62),
                    size: 75,
                  ),

                  const SizedBox(height: 10),

                  const Text(
                    'CampusSave',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF239B62),
                    ),
                  ),

                  const SizedBox(height: 8),

                  Text(
                    isRegister
                        ? 'Créer votre compte étudiant'
                        : 'Bienvenue sur CampusSave !',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.grey),
                  ),

                  const SizedBox(height: 30),

                  if (isRegister) ...[
                    buildTextField(
                      controller: firstNameController,
                      label: 'Prénom',
                      icon: Icons.person_outline,
                    ),

                    const SizedBox(height: 15),

                    buildTextField(
                      controller: lastNameController,
                      label: 'Nom',
                      icon: Icons.person_outline,
                    ),

                    const SizedBox(height: 15),
                  ],

                  buildTextField(
                    controller: emailController,
                    label: 'Adresse e-mail',
                    icon: Icons.email_outlined,
                    isEmail: true,
                  ),

                  const SizedBox(height: 15),

                  // Mot de passe
                  TextFormField(
                    controller: passwordController,
                    obscureText: obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Mot de passe',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        onPressed: () {
                          setState(() {
                            obscurePassword = !obscurePassword;
                          });
                        },
                        icon: Icon(
                          obscurePassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                        ),
                      ),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.length < 6) {
                        return 'Minimum 6 caractères';
                      }

                      return null;
                    },
                  ),

                  // Confirmation du mot de passe
                  if (isRegister) ...[
                    const SizedBox(height: 15),

                    TextFormField(
                      controller: confirmPasswordController,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: 'Confirmer le mot de passe',
                        prefixIcon: const Icon(Icons.lock_outline),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      validator: (value) {
                        if (value != passwordController.text) {
                          return 'Les mots de passe ne correspondent pas';
                        }

                        return null;
                      },
                    ),
                  ],

                  const SizedBox(height: 25),

                  // Bouton principal
                  ElevatedButton(
                    onPressed: isLoading ? null : submitForm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF239B62),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: isLoading
                        ? const CircularProgressIndicator(
                            color: Colors.white,
                          )
                        : Text(
                            isRegister
                                ? 'Créer mon compte'
                                : 'Se connecter',
                          ),
                  ),

                  const SizedBox(height: 15),

                  // Changer de formulaire
                  TextButton(
                    onPressed: isLoading
                        ? null
                        : () {
                            setState(() {
                              isRegister = !isRegister;
                            });
                          },
                    child: Text(
                      isRegister
                          ? 'Déjà un compte ? Se connecter'
                          : 'Pas encore de compte ? S’inscrire',
                      style: const TextStyle(
                        color: Color(0xFF239B62),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),

                  if (!isRegister)
                    const Text(
                      'Connecte-toi avec ton compte étudiant.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.grey,
                        height: 1.6,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
