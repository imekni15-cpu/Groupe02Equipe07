import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/api_service.dart';

class OfferFormScreen extends StatefulWidget {
final Map<String, dynamic>? offre;
const OfferFormScreen({super.key, this.offre});

@override
State<OfferFormScreen> createState() => _OfferFormScreenState();
}

class _OfferFormScreenState extends State<OfferFormScreen> {
final _formKey = GlobalKey<FormState>();
late final TextEditingController _titre;
late final TextEditingController _prixInitial;
late final TextEditingController _prixReduit;
late final TextEditingController _quantite;
late final TextEditingController _debut;
late final TextEditingController _fin;
String? _photoPath;
bool _saving = false;

bool get _isEdit => widget.offre != null;

@override
void initState() {
super.initState();
final o = widget.offre;
_titre = TextEditingController(text: o?['titre'] ?? '');
_prixInitial = TextEditingController(text: o != null ? '${o['prixInitial']}' : '');
_prixReduit = TextEditingController(text: o != null ? '${o['prixReduit']}' : '');
_quantite = TextEditingController(text: o != null ? '${o['quantite']}' : '');
_debut = TextEditingController(text: o?['heureDebut'] ?? '');
_fin = TextEditingController(text: o?['heureFin'] ?? '');
_photoPath = o?['photoPath'];
}

@override
void dispose() {
_titre.dispose();
_prixInitial.dispose();
_prixReduit.dispose();
_quantite.dispose();
_debut.dispose();
_fin.dispose();
super.dispose();
}

double? _num(String s) => double.tryParse(s.replaceAll(',', '.'));

Future<void> _pickPhoto() async {
final x = await ImagePicker().pickImage(source: ImageSource.gallery);
if (x != null) setState(() => _photoPath = x.path);
}

Future<void> _pickTime(TextEditingController c) async {
final t = await showTimePicker(context: context, initialTime: TimeOfDay.now());
if (t != null) {
c.text =
'${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
}
}

Future<void> _save() async {
if (!_formKey.currentState!.validate()) return;
setState(() => _saving = true);
final data = <String, dynamic>{
'titre': _titre.text.trim(),
'prixInitial': _num(_prixInitial.text)!,
'prixReduit': _num(_prixReduit.text)!,
'quantite': int.parse(_quantite.text.trim()),
'heureDebut': _debut.text,
'heureFin': _fin.text,
'photoPath': _photoPath,
};
if (_isEdit) {
await ApiService.modifierOffre(widget.offre!['id'], data);
} else {
await ApiService.ajouterOffre(data);
}
if (!mounted) return;
Navigator.pop(context, true);
}

String? _required(String? v) =>
(v == null || v.trim().isEmpty) ? 'Champ obligatoire' : null;

@override
Widget build(BuildContext context) {
return Scaffold(
appBar: AppBar(title: Text(_isEdit ? 'Modifier l\'offre' : 'Nouvelle offre')),
body: SingleChildScrollView(
padding: const EdgeInsets.all(16),
child: Form(
key: _formKey,
child: Column(
children: [
GestureDetector(
onTap: _pickPhoto,
child: Container(
height: 160,
width: double.infinity,
decoration: BoxDecoration(
color: const Color(0xFFE8F5E9),
borderRadius: BorderRadius.circular(16),
),
child: (_photoPath != null && File(_photoPath!).existsSync())
? ClipRRect(
borderRadius: BorderRadius.circular(16),
child: Image.file(File(_photoPath!), fit: BoxFit.cover),
)
: const Column(
mainAxisAlignment: MainAxisAlignment.center,
children: [
Icon(Icons.add_a_photo, size: 40),
SizedBox(height: 8),
Text('Ajouter une photo'),
],
),
),
),
const SizedBox(height: 16),
TextFormField(
controller: _titre,
decoration: const InputDecoration(labelText: 'Titre', border: OutlineInputBorder()),
validator: _required,
),
const SizedBox(height: 12),
TextFormField(
controller: _prixInitial,
keyboardType: const TextInputType.numberWithOptions(decimal: true),
decoration: const InputDecoration(labelText: 'Prix initial (DT)', border: OutlineInputBorder()),
validator: (v) {
final n = _num(v ?? '');
if (n == null || n <= 0) return 'Prix invalide';
return null;
},
),
const SizedBox(height: 12),
TextFormField(
controller: _prixReduit,
keyboardType: const TextInputType.numberWithOptions(decimal: true),
decoration: const InputDecoration(labelText: 'Prix réduit (DT)', border: OutlineInputBorder()),
validator: (v) {
final n = _num(v ?? '');
final init = _num(_prixInitial.text);
if (n == null || n <= 0) return 'Prix invalide';
if (init != null && n >= init) {
return 'Doit être inférieur au prix initial';
}
return null;
},
),
const SizedBox(height: 12),
TextFormField(
controller: _quantite,
keyboardType: TextInputType.number,
decoration: const InputDecoration(labelText: 'Quantité', border: OutlineInputBorder()),
validator: (v) {
final n = int.tryParse((v ?? '').trim());
if (n == null || n <= 0) return 'Quantité invalide';
return null;
},
),
const SizedBox(height: 12),
TextFormField(
controller: _debut,
readOnly: true,
onTap: () => _pickTime(_debut),
decoration: const InputDecoration(
labelText: 'Début de récupération',
border: OutlineInputBorder(),
suffixIcon: Icon(Icons.access_time),
),
validator: _required,
),
const SizedBox(height: 12),
TextFormField(
controller: _fin,
readOnly: true,
onTap: () => _pickTime(_fin),
decoration: const InputDecoration(
labelText: 'Fin de récupération',
border: OutlineInputBorder(),
suffixIcon: Icon(Icons.access_time),
),
validator: (v) {
if (v == null || v.isEmpty) return 'Champ obligatoire';
if (_debut.text.isNotEmpty && v.compareTo(_debut.text) <= 0) {
return 'Doit être après le début';
}
return null;
},
),
const SizedBox(height: 24),
SizedBox(
width: double.infinity,
height: 50,
child: FilledButton(
onPressed: _saving ? null : _save,
child: Text(_isEdit ? 'Enregistrer' : 'Publier l\'offre'),
),
),
],
),
),
),
);
}
}
