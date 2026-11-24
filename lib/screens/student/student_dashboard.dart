import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../widgets/stat_card.dart';

class StudentDashboard extends StatelessWidget {
const StudentDashboard({super.key});

@override
Widget build(BuildContext context) {
return Scaffold(
appBar: AppBar(title: const Text('Mon tableau de bord')),
body: FutureBuilder<Map<String, dynamic>>(
future: ApiService.getStatsEtudiant(),
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
StatCard(title: 'Commandes', value: '${s['totalCommandes'] ?? 0}', icon: Icons.receipt_long, color: Colors.blue),
StatCard(title: 'Économies', value: '${s['economies'] ?? 0} DT', icon: Icons.savings, color: Colors.green),
StatCard(title: 'Repas sauvés', value: '${s['repasSauves'] ?? 0}', icon: Icons.eco, color: Colors.teal),
StatCard(title: 'En cours', value: '${s['commandesEnCours'] ?? 0}', icon: Icons.hourglass_top, color: Colors.orange),
],
),
);
},
),
);
}
}
