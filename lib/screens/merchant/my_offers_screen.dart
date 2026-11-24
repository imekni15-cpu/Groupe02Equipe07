import 'dart:io';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'offer_form_screen.dart';

class MyOffersScreen extends StatefulWidget {
const MyOffersScreen({super.key});

@override
State<MyOffersScreen> createState() => _MyOffersScreenState();
}

class _MyOffersScreenState extends State<MyOffersScreen> {
late Future<List<Map<String, dynamic>>> _future;

@override
void initState() {
super.initState();
_future = ApiService.getMesOffres();
}

void _reload() {
setState(() {
_future = ApiService.getMesOffres();
});
}

Future<void> _openForm([Map<String, dynamic>? offre]) async {
final changed = await Navigator.push<bool>(
context,
MaterialPageRoute(builder: (_) => OfferFormScreen(offre: offre)),
);
if (changed == true) _reload();
}

Future<void> _delete(Map<String, dynamic> offre) async {
final ok = await showDialog<bool>(
context: context,
builder: (_) => AlertDialog(
title: const Text('Supprimer ?'),
content: Text('Supprimer "${offre['titre']}" ?'),
actions: [
TextButton(
onPressed: () => Navigator.pop(context, false),
child: const Text('Non'),
),
FilledButton(
onPressed: () => Navigator.pop(context, true),
child: const Text('Oui'),
),
],
),
);
if (ok == true) {
await ApiService.supprimerOffre(offre['id']);
_reload();
}
}

Widget _leading(Map<String, dynamic> o) {
final path = o['photoPath'];
if (path != null && File(path).existsSync()) {
return ClipRRect(
borderRadius: BorderRadius.circular(8),
child: Image.file(File(path), width: 56, height: 56, fit: BoxFit.cover),
);
}
return const CircleAvatar(
radius: 28,
backgroundColor: Color(0xFFE8F5E9),
child: Icon(Icons.fastfood, color: Color(0xFF2E7D32)),
);
}

@override
Widget build(BuildContext context) {
return Scaffold(
appBar: AppBar(title: const Text('Mes offres')),
body: FutureBuilder<List<Map<String, dynamic>>>(
future: _future,
builder: (context, snap) {
if (snap.connectionState != ConnectionState.done) {
return const Center(child: CircularProgressIndicator());
}
if (snap.hasError) {
return const Center(child: Text('Erreur de chargement'));
}
final offres = snap.data ?? [];
if (offres.isEmpty) {
return const Center(child: Text('Aucune offre. Appuyez sur + pour ajouter.'));
}
return ListView.builder(
padding: const EdgeInsets.all(12),
itemCount: offres.length,
itemBuilder: (_, i) {
final o = offres[i];
return Card(
child: ListTile(
leading: _leading(o),
title: Text('${o['titre']}'),
subtitle: Text(
'${o['prixReduit']} DT (au lieu de ${o['prixInitial']} DT)\n'
'Qté: ${o['quantite']} | ${o['heureDebut']} - ${o['heureFin']}',
),
isThreeLine: true,
trailing: Row(
mainAxisSize: MainAxisSize.min,
children: [
IconButton(
icon: const Icon(Icons.edit, color: Colors.blue),
onPressed: () => _openForm(o),
),
IconButton(
icon: const Icon(Icons.delete, color: Colors.red),
onPressed: () => _delete(o),
),
],
),
),
);
},
);
},
),
floatingActionButton: FloatingActionButton(
onPressed: () => _openForm(),
child: const Icon(Icons.add),
),
);
}
}