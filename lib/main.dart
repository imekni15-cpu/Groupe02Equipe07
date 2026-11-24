import 'package:flutter/material.dart';
import 'screens/merchant/merchant_dashboard.dart';
import 'screens/merchant/scan_qr_screen.dart';
import 'screens/merchant/my_offers_screen.dart';
import 'screens/student/student_dashboard.dart';

void main() => runApp(const CampusSaveApp());

class CampusSaveApp extends StatelessWidget {
const CampusSaveApp({super.key});

@override
Widget build(BuildContext context) {
return MaterialApp(
title: 'CampusSave',
debugShowCheckedModeBanner: false,
theme: ThemeData(
colorSchemeSeed: const Color(0xFF2E7D32),
useMaterial3: true,
),
home: const RoleChooser(),
);
}
}

// Écran temporaire pour la démo (le vrai login est fait par P5)
class RoleChooser extends StatelessWidget {
const RoleChooser({super.key});

@override
Widget build(BuildContext context) {
return Scaffold(
body: Center(
child: Padding(
padding: const EdgeInsets.all(32),
child: Column(
mainAxisAlignment: MainAxisAlignment.center,
children: [
const Icon(Icons.eco, size: 80, color: Color(0xFF2E7D32)),
const SizedBox(height: 8),
const Text('CampusSave',
style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
const SizedBox(height: 40),
SizedBox(
width: double.infinity,
height: 52,
child: FilledButton.icon(
icon: const Icon(Icons.store),
label: const Text('Espace commerçant'),
onPressed: () => Navigator.push(context,
MaterialPageRoute(builder: (_) => const MerchantHome())),
),
),
const SizedBox(height: 16),
SizedBox(
width: double.infinity,
height: 52,
child: OutlinedButton.icon(
icon: const Icon(Icons.school),
label: const Text('Espace étudiant'),
onPressed: () => Navigator.push(context,
MaterialPageRoute(builder: (_) => const StudentDashboard())),
),
),
],
),
),
),
);
}
}

class MerchantHome extends StatefulWidget {
const MerchantHome({super.key});

@override
State<MerchantHome> createState() => _MerchantHomeState();
}

class _MerchantHomeState extends State<MerchantHome> {
int _index = 0;
final _pages = const [MerchantDashboard(), ScanQrScreen(), MyOffersScreen()];

@override
Widget build(BuildContext context) {
return Scaffold(
body: _pages[_index],
bottomNavigationBar: NavigationBar(
selectedIndex: _index,
onDestinationSelected: (i) => setState(() => _index = i),
destinations: const [
NavigationDestination(icon: Icon(Icons.dashboard), label: 'Dashboard'),
NavigationDestination(icon: Icon(Icons.qr_code_scanner), label: 'Scanner'),
NavigationDestination(icon: Icon(Icons.local_offer), label: 'Offres'),
],
),
);
}
}
