
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import 'firebase_options.dart';
import 'providers/reservation_provider.dart';
import 'providers/offer_provider.dart';
import 'providers/cart_provider.dart';
import 'models/offer_model.dart';
import 'screens/auth/login_screen.dart';
import 'screens/offers/offer_details_screen.dart';
import 'screens/orders/order_tracking_screen.dart';

const Color greenColor = Color(0xFF239B62);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(const CampusSaveApp());
}

// APPLICATION
class CampusSaveApp extends StatelessWidget {
  const CampusSaveApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => ReservationProvider(),
        ),
        ChangeNotifierProvider(
          create: (_) => OfferProvider(),
        ),
        ChangeNotifierProvider(
          create: (_) => CartProvider(),
        ),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'CampusSave',
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: greenColor,
          ),
          scaffoldBackgroundColor: const Color(0xFFF7F9F7),
          appBarTheme: const AppBarTheme(
            backgroundColor: Colors.white,
            foregroundColor: Colors.black,
            elevation: 0,
          ),
        ),
        home: const AuthGate(),
      ),
    );
  }
}

// AUTHENTIFICATION
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(
                color: greenColor,
              ),
            ),
          );
        }

        if (snapshot.hasData) {
          return const MainNavigation();
        }

        return LoginScreen(onLogin: () {});
      },
    );
  }
}

// NAVIGATION PRINCIPALE
class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int selectedIndex = 0;

  final List<Widget> pages = [
    const HomeScreen(),
    const OffersScreen(),
    const ReservationsScreen(),
    OrderTrackingScreen(),
    const ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<OfferProvider>().loadOffers();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: selectedIndex,
        children: pages,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: (index) {
          setState(() {
            selectedIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Accueil',
          ),
          NavigationDestination(
            icon: Icon(Icons.restaurant_menu),
            label: 'Offres',
          ),
          NavigationDestination(
            icon: Icon(Icons.shopping_bag_outlined),
            selectedIcon: Icon(Icons.shopping_bag),
            label: 'Réservations',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Commandes',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}

// DETAILS D'UNE OFFRE
void openOfferDetails(BuildContext context, OfferModel offer) {
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (_) => OfferDetailsScreen(
        name: offer.title,
        restaurant: offer.shopName ?? 'Commerce partenaire',
        description: offer.description,
        oldPrice: offer.originalPrice,
        newPrice: offer.discountPrice,
        image: offer.photoUrl ?? '',
        quantity: offer.quantity,
      ),
    ),
  );
}

// CARTE D'UNE OFFRE
class OfferCard extends StatelessWidget {
  final OfferModel offer;

  const OfferCard({
    super.key,
    required this.offer,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => openOfferDetails(context, offer),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5EC),
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Icon(
                Icons.restaurant,
                size: 36,
                color: greenColor,
              ),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    offer.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    offer.shopName ?? 'Commerce partenaire',
                    style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 7),
                  Row(
                    children: [
                      Text(
                        '${offer.originalPrice.toStringAsFixed(2)} DT',
                        style: const TextStyle(
                          color: Colors.grey,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        '${offer.discountPrice.toStringAsFixed(2)} DT',
                        style: const TextStyle(
                          color: greenColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Quantité disponible : ${offer.quantity}',
                    style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }
}

// FILTRAGE DES CATEGORIES
bool matchesCategory(OfferModel offer, String selectedCategory) {
  if (selectedCategory == 'Tout') {
    return true;
  }

  final category = offer.category.toLowerCase().trim();

  switch (selectedCategory) {
    case 'Sandwichs':
      return category.contains('sandwich');

    case 'Pizzas':
      return category.contains('pizza');

    case 'Boissons':
      return category.contains('boisson');

    case 'Repas':
      return category.contains('plat') ||
          category.contains('salade') ||
          category.contains('repas');

    default:
      return category == selectedCategory.toLowerCase();
  }
}

// ACCUEIL
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final searchController = TextEditingController();

  String selectedCategory = 'Tout';

  final categories = const [
    'Tout',
    'Sandwichs',
    'Pizzas',
    'Boissons',
    'Repas',
  ];

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<OfferProvider>(
      builder: (context, provider, child) {
        final query = searchController.text.toLowerCase().trim();

        final filteredOffers = provider.offers.where((offer) {
          final matchesSearch =
              offer.title.toLowerCase().contains(query) ||
              (offer.shopName ?? '').toLowerCase().contains(query);

          final categoryMatches =
              matchesCategory(offer, selectedCategory);

          return matchesSearch && categoryMatches;
        }).toList();

        return Scaffold(
          appBar: AppBar(
            title: const Row(
              children: [
                Icon(
                  Icons.eco,
                  color: greenColor,
                  size: 30,
                ),
                SizedBox(width: 8),
                Text(
                  'CampusSave',
                  style: TextStyle(
                    color: greenColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            actions: [
              IconButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Notifications bientôt disponibles.',
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.notifications_none),
              ),
            ],
          ),
          body: RefreshIndicator(
            color: greenColor,
            onRefresh: provider.loadOffers,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Bonjour étudiant 👋',
                    style: TextStyle(
                      fontSize: 25,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Économise et lutte contre le gaspillage alimentaire.',
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 22),

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      color: greenColor,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Mange malin,\néconomise plus !',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 23,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 10),
                        Text(
                          'Découvre les repas disponibles près de ton campus.',
                          style: TextStyle(color: Colors.white),
                        ),
                        SizedBox(height: 12),
                        Icon(
                          Icons.restaurant,
                          color: Colors.white,
                          size: 45,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 22),

                  TextField(
                    controller: searchController,
                    onChanged: (_) => setState(() {}),
                    decoration: InputDecoration(
                      hintText: 'Rechercher un repas...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: IconButton(
                        onPressed: () {
                          searchController.clear();
                          setState(() {});
                        },
                        icon: const Icon(Icons.close),
                      ),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(15),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),

                  const SizedBox(height: 25),

                  const Text(
                    'Catégories',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 14),

                  SizedBox(
                    height: 43,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: categories.length,
                      separatorBuilder: (_, index) =>
                          const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final category = categories[index];
                        final selected = selectedCategory == category;

                        return ChoiceChip(
                          label: Text(category),
                          selected: selected,
                          selectedColor: greenColor,
                          labelStyle: TextStyle(
                            color: selected ? Colors.white : Colors.black,
                          ),
                          onSelected: (_) {
                            setState(() {
                              selectedCategory = category;
                            });
                          },
                        );
                      },
                    ),
                  ),

                  const SizedBox(height: 25),

                  const Text(
                    'Offres disponibles',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 15),

                  if (provider.isLoading)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(25),
                        child: CircularProgressIndicator(
                          color: greenColor,
                        ),
                      ),
                    )
                  else if (provider.error != null)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          children: [
                            const Icon(
                              Icons.error_outline,
                              color: Colors.red,
                              size: 40,
                            ),
                            const SizedBox(height: 10),
                            Text(
                              provider.error!,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 10),
                            ElevatedButton(
                              onPressed: provider.loadOffers,
                              child: const Text('Réessayer'),
                            ),
                          ],
                        ),
                      ),
                    )
                  else if (filteredOffers.isEmpty)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(25),
                        child: Text('Aucune offre trouvée.'),
                      ),
                    )
                  else
                    ...filteredOffers.map(
                      (offer) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: OfferCard(offer: offer),
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

// TOUTES LES OFFRES
class OffersScreen extends StatefulWidget {
  const OffersScreen({super.key});

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  final searchController = TextEditingController();

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<OfferProvider>(
      builder: (context, provider, child) {
        final query = searchController.text.toLowerCase().trim();

        final filteredOffers = provider.offers.where((offer) {
          return offer.title.toLowerCase().contains(query) ||
              (offer.shopName ?? '').toLowerCase().contains(query);
        }).toList();

        return Scaffold(
          appBar: AppBar(
            title: const Text('Toutes les offres'),
          ),
          body: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(18),
                child: TextField(
                  controller: searchController,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: 'Rechercher une offre...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      onPressed: () {
                        searchController.clear();
                        setState(() {});
                      },
                      icon: const Icon(Icons.close),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),

              Expanded(
                child: provider.isLoading
                    ? const Center(
                        child: CircularProgressIndicator(
                          color: greenColor,
                        ),
                      )
                    : provider.error != null
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  provider.error!,
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 10),
                                ElevatedButton(
                                  onPressed: provider.loadOffers,
                                  child: const Text('Réessayer'),
                                ),
                              ],
                            ),
                          )
                        : filteredOffers.isEmpty
                            ? const Center(
                                child: Text('Aucune offre trouvée.'),
                              )
                            : RefreshIndicator(
                                color: greenColor,
                                onRefresh: provider.loadOffers,
                                child: ListView.builder(
                                  physics:
                                      const AlwaysScrollableScrollPhysics(),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 18,
                                  ),
                                  itemCount: filteredOffers.length,
                                  itemBuilder: (context, index) {
                                    return Padding(
                                      padding:
                                          const EdgeInsets.only(bottom: 12),
                                      child: OfferCard(
                                        offer: filteredOffers[index],
                                      ),
                                    );
                                  },
                                ),
                              ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// RESERVATIONS FIRESTORE
class ReservationsScreen extends StatefulWidget {
  const ReservationsScreen({super.key});

  @override
  State<ReservationsScreen> createState() =>
      _ReservationsScreenState();
}

class _ReservationsScreenState extends State<ReservationsScreen> {
  bool isLoading = true;

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        loadData();
      }
    });
  }

  Future<void> loadData() async {
    try {
      await context.read<ReservationProvider>().loadReservations();
    } catch (e) {
      debugPrint('Erreur chargement réservations : $e');
    }

    if (mounted) {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> cancelReservation(String id) async {
    try {
      await context
          .read<ReservationProvider>()
          .cancelReservation(id);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Réservation annulée avec succès.'),
        ),
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur lors de l’annulation : $e'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mes réservations'),
      ),
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: greenColor,
              ),
            )
          : Consumer<ReservationProvider>(
              builder: (context, provider, child) {
                final reservations = provider.reservations;

                if (reservations.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.shopping_bag_outlined,
                          size: 70,
                          color: greenColor,
                        ),
                        SizedBox(height: 15),
                        Text(
                          'Aucune réservation pour le moment.',
                          style: TextStyle(fontSize: 16),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Découvre les offres disponibles !',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  color: greenColor,
                  onRefresh: provider.loadReservations,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(18),
                    itemCount: reservations.length,
                    itemBuilder: (context, index) {
                      final reservation = reservations[index];
                      final date = reservation.date;

                      final formattedDate =
                          '${date.day.toString().padLeft(2, '0')}/'
                          '${date.month.toString().padLeft(2, '0')}/'
                          '${date.year}';

                      return Card(
                        color: Colors.white,
                        margin: const EdgeInsets.only(bottom: 15),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              Text(
                                reservation.offerName,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Restaurant : ${reservation.restaurant}',
                              ),
                              Text(
                                'Quantité : ${reservation.quantity}',
                              ),
                              Text(
                                'Prix total : '
                                '${reservation.totalPrice.toStringAsFixed(2)} DT',
                                style: const TextStyle(
                                  color: greenColor,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 7),
                              Text(
                                'Date : $formattedDate',
                                style: const TextStyle(
                                  color: Colors.grey,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton.icon(
                                  onPressed: () {
                                    cancelReservation(reservation.id);
                                  },
                                  icon: const Icon(
                                    Icons.delete_outline,
                                    color: Colors.red,
                                  ),
                                  label: const Text(
                                    'Annuler',
                                    style: TextStyle(
                                      color: Colors.red,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
    );
  }
}

// PROFIL FIRESTORE
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> editProfile(
    BuildContext context,
    String firstName,
    String lastName,
  ) async {
    final firstController =
        TextEditingController(text: firstName);
    final lastController =
        TextEditingController(text: lastName);

    final result = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Modifier mon profil'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: firstController,
                decoration: const InputDecoration(
                  labelText: 'Prénom',
                ),
              ),
              TextField(
                controller: lastController,
                decoration: const InputDecoration(
                  labelText: 'Nom',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext, false);
              },
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(dialogContext, true);
              },
              child: const Text('Enregistrer'),
            ),
          ],
        );
      },
    );

    if (result == true) {
      final user = FirebaseAuth.instance.currentUser;

      if (user == null) {
        firstController.dispose();
        lastController.dispose();
        return;
      }

      final newFirstName = firstController.text.trim();
      final newLastName = lastController.text.trim();

      if (newFirstName.isEmpty || newLastName.isEmpty) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Veuillez remplir tous les champs.'),
            ),
          );
        }
      } else {
        try {
          await FirebaseFirestore.instance
              .collection('users')
              .doc(user.uid)
              .set({
            'firstName': newFirstName,
            'lastName': newLastName,
            'email': user.email,
            'role': 'student',
            'updatedAt': FieldValue.serverTimestamp(),
          }, SetOptions(merge: true));

          await user.updateDisplayName(
            '$newFirstName $newLastName',
          );

          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Profil modifié avec succès.'),
              ),
            );
          }
        } catch (e) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Erreur : $e')),
            );
          }
        }
      }
    }

    firstController.dispose();
    lastController.dispose();
  }

  Future<void> logout(BuildContext context) async {
    try {
      await FirebaseAuth.instance.signOut();
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur de déconnexion : $e'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      return const Scaffold(
        body: Center(
          child: Text('Aucun utilisateur connecté.'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon profil'),
      ),
      body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
        stream: FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState ==
              ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(
                color: greenColor,
              ),
            );
          }

          final data = snapshot.data?.data() ?? {};

          final firstName =
              data['firstName']?.toString() ?? '';
          final lastName =
              data['lastName']?.toString() ?? '';
          final email =
              data['email']?.toString() ?? user.email ?? '';

          final fullName =
              '$firstName $lastName'.trim().isEmpty
                  ? 'Étudiant CampusSave'
                  : '$firstName $lastName'.trim();

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const Center(
                child: CircleAvatar(
                  radius: 45,
                  backgroundColor: Color(0xFFE8F5EC),
                  child: Icon(
                    Icons.person,
                    size: 50,
                    color: greenColor,
                  ),
                ),
              ),
              const SizedBox(height: 15),
              Center(
                child: Text(
                  fullName,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(height: 5),
              Center(
                child: Text(
                  email,
                  style: const TextStyle(
                    color: Colors.grey,
                  ),
                ),
              ),
              const SizedBox(height: 30),

              Card(
                color: Colors.white,
                child: ListTile(
                  leading: const Icon(
                    Icons.person_outline,
                    color: greenColor,
                  ),
                  title: const Text(
                    'Informations personnelles',
                  ),
                  subtitle: Text(fullName),
                  trailing: const Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                  ),
                  onTap: () {
                    editProfile(
                      context,
                      firstName,
                      lastName,
                    );
                  },
                ),
              ),

              const SizedBox(height: 10),

              Card(
                color: Colors.white,
                child: ListTile(
                  leading: const Icon(
                    Icons.email_outlined,
                    color: greenColor,
                  ),
                  title: const Text('Adresse e-mail'),
                  subtitle: Text(email),
                ),
              ),

              const SizedBox(height: 10),

              Card(
                color: Colors.white,
                child: ListTile(
                  leading: const Icon(
                    Icons.settings_outlined,
                    color: greenColor,
                  ),
                  title: const Text('Paramètres'),
                  subtitle: const Text(
                    'Paramètres de l’application',
                  ),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const SettingsScreen(),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 25),

              ElevatedButton.icon(
                onPressed: () => logout(context),
                icon: const Icon(
                  Icons.logout,
                  color: Colors.white,
                ),
                label: const Text(
                  'Déconnexion',
                  style: TextStyle(color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  padding: const EdgeInsets.symmetric(
                    vertical: 15,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// PARAMETRES
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() =>
      _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool notificationsEnabled = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Paramètres'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Préférences',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),

          Card(
            child: SwitchListTile(
              secondary: const Icon(
                Icons.notifications_outlined,
                color: greenColor,
              ),
              title: const Text('Notifications'),
              subtitle: const Text(
                'Activer ou désactiver les notifications',
              ),
              value: notificationsEnabled,
              onChanged: (value) {
                setState(() {
                  notificationsEnabled = value;
                });
              },
            ),
          ),

          const SizedBox(height: 20),

          const Text(
            'Application',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),

          Card(
            child: ListTile(
              leading: const Icon(
                Icons.info_outline,
                color: greenColor,
              ),
              title: const Text('À propos de CampusSave'),
              subtitle: const Text('Version 1.0.0'),
              onTap: () {
                showDialog<void>(
                  context: context,
                  builder: (dialogContext) => AlertDialog(
                    title: const Text(
                      'À propos de CampusSave',
                    ),
                    content: const Text(
                      'CampusSave est une application qui permet '
                      'aux étudiants de découvrir des offres et de '
                      'réserver des produits proposés par les '
                      'commerces partenaires.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () {
                          Navigator.pop(dialogContext);
                        },
                        child: const Text('Fermer'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          Card(
            child: ListTile(
              leading: const Icon(
                Icons.privacy_tip_outlined,
                color: greenColor,
              ),
              title: const Text('Confidentialité'),
              subtitle: const Text(
                'Protection de vos données',
              ),
              onTap: () {
                showDialog<void>(
                  context: context,
                  builder: (dialogContext) => AlertDialog(
                    title: const Text('Confidentialité'),
                    content: const Text(
                      'Vos données de compte et vos réservations '
                      'sont utilisées pour faire fonctionner '
                      'CampusSave. Elles sont accessibles selon '
                      'les règles de sécurité de l’application.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () {
                          Navigator.pop(dialogContext);
                        },
                        child: const Text('Fermer'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 20),

          const Center(
            child: Text(
              'CampusSave © 2026',
              style: TextStyle(color: Colors.grey),
            ),
          ),
        ],
      ),
    );
  }
}
