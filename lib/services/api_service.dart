import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
// true = fausses données (démo sans backend)
// false = vrai backend de P2 (changer baseUrl et token)
static const bool useMock = true;
static const String baseUrl = 'http://10.0.2.2:3000/api';
static String token = 'TOKEN_A_REMPLACER';

static Map<String, String> get _headers => {
'Content-Type': 'application/json',
'Authorization': 'Bearer $token',
};

static final List<Map<String, dynamic>> _offres = [
{
'id': '1',
'titre': 'Panier Pâtisserie',
'prixInitial': 12.0,
'prixReduit': 5.0,
'quantite': 4,
'heureDebut': '17:00',
'heureFin': '19:00',
'photoPath': null,
},
{
'id': '2',
'titre': 'Sandwich Thon',
'prixInitial': 6.0,
'prixReduit': 3.0,
'quantite': 10,
'heureDebut': '18:00',
'heureFin': '20:00',
'photoPath': null,
},
];

static final Set<String> _codesUtilises = {};

static Future<Map<String, dynamic>> validerCommande(String qrCode) async {
if (useMock) {
await Future.delayed(const Duration(milliseconds: 500));
if (_codesUtilises.contains(qrCode)) {
return {'success': false, 'message': 'Ce QR code a déjà été utilisé'};
}
_codesUtilises.add(qrCode);
return {'success': true, 'message': 'Commande $qrCode validée. Récupération confirmée.'};
}
final res = await http.post(
Uri.parse('$baseUrl/commandes/valider'),
headers: _headers,
body: jsonEncode({'qrCode': qrCode}),
);
return Map<String, dynamic>.from(jsonDecode(res.body));
}

static Future<Map<String, dynamic>> getStatsCommercant() async {
if (useMock) {
await Future.delayed(const Duration(milliseconds: 500));
return {
'totalVentes': 245,
'totalCommandes': 38,
'invendusSauves': 52,
'offresActives': _offres.length,
};
}
final res = await http.get(Uri.parse('$baseUrl/stats/commercant'), headers: _headers);
return Map<String, dynamic>.from(jsonDecode(res.body));
}

static Future<Map<String, dynamic>> getStatsEtudiant() async {
if (useMock) {
await Future.delayed(const Duration(milliseconds: 500));
return {
'totalCommandes': 12,
'economies': 48,
'repasSauves': 15,
'commandesEnCours': 2,
};
}
final res = await http.get(Uri.parse('$baseUrl/stats/etudiant'), headers: _headers);
return Map<String, dynamic>.from(jsonDecode(res.body));
}

static Future<List<Map<String, dynamic>>> getMesOffres() async {
if (useMock) {
await Future.delayed(const Duration(milliseconds: 300));
return List<Map<String, dynamic>>.from(_offres);
}
final res = await http.get(Uri.parse('$baseUrl/offres/mes-offres'), headers: _headers);
return List<Map<String, dynamic>>.from(jsonDecode(res.body));
}

static Future<void> ajouterOffre(Map<String, dynamic> offre) async {
if (useMock) {
offre['id'] = DateTime.now().millisecondsSinceEpoch.toString();
_offres.add(offre);
return;
}
await http.post(Uri.parse('$baseUrl/offres'),
headers: _headers, body: jsonEncode(offre));
}

static Future<void> modifierOffre(String id, Map<String, dynamic> offre) async {
if (useMock) {
final i = _offres.indexWhere((o) => o['id'] == id);
if (i != -1) {
offre['id'] = id;
_offres[i] = offre;
}
return;
}
await http.put(Uri.parse('$baseUrl/offres/$id'),
headers: _headers, body: jsonEncode(offre));
}

static Future<void> supprimerOffre(String id) async {
if (useMock) {
_offres.removeWhere((o) => o['id'] == id);
return;
}
await http.delete(Uri.parse('$baseUrl/offres/$id'), headers: _headers);
}
}