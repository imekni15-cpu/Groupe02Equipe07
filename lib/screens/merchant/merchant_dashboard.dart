import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../widgets/stat_card.dart';

class MerchantDashboard extends StatelessWidget {
const MerchantDashboard({super.key});

@override
Widget build(BuildContext context) {
return Scaffold(
appBar: AppBar(title: const Text('Tableau de bord commerçant')),
body: FutureBuilder<Map<String, dynamic>>(
future: ApiService.getStatsCommercant(),
builder: (context, snap) {
if (snap.connectionState != ConnectionState.done) {
return const Center(child: CircularProgressIndicator());
}
if (snap.hasError || !snap.hasData) {
return const Center(child: Text('Erreur de chargement'));
}
final s = snap.data!;
return Padding(
padding: const EdgeInsets.all(16),
child: GridView.count(
crossAxisCount: 2,
crossAxisSpacing: 12,
mainAxisSpacing: 12,
children: [
StatCard(title: 'Ventes', value: '${s['totalVentes'] ?? 0} DT', icon: Icons.payments, color: Colors.green),
StatCard(title: 'Commandes', value: '${s['totalCommandes'] ?? 0}', icon: Icons.receipt_long, color: Colors.blue),
StatCard(title: 'Invendus sauvés', value: '${s['invendusSauves'] ?? 0}', icon: Icons.eco, color: Colors.teal),
StatCard(title: 'Offres actives', value: '${s['offresActives'] ?? 0}', icon: Icons.local_offer, color: Colors.orange),
],
),
);
},
),
);
}
}
