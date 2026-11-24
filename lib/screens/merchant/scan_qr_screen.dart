import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../services/api_service.dart';

class ScanQrScreen extends StatefulWidget {
const ScanQrScreen({super.key});

@override
State<ScanQrScreen> createState() => _ScanQrScreenState();
}

class _ScanQrScreenState extends State<ScanQrScreen> {
final MobileScannerController _controller = MobileScannerController();
bool _processing = false;

Future<void> _validate(String code) async {
if (_processing) return;
setState(() => _processing = true);
await _controller.stop();

String title = '❌ Échec';
String message = 'QR invalide';
try {
final result = await ApiService.validerCommande(code);
final ok = result['success'] == true;
title = ok ? '✅ Commande validée' : '❌ Échec';
message = result['message'] ?? (ok ? 'Récupération confirmée' : 'QR invalide');
} catch (e) {
message = 'Erreur: $e';
}

if (!mounted) return;
await showDialog(
context: context,
builder: (_) => AlertDialog(
title: Text(title),
content: Text(message),
actions: [
TextButton(
onPressed: () => Navigator.pop(context),
child: const Text('OK'),
),
],
),
);

if (!mounted) return;
setState(() => _processing = false);
await _controller.start();
}

Future<void> _onDetect(BarcodeCapture capture) async {
if (capture.barcodes.isEmpty) return;
final code = capture.barcodes.first.rawValue;
if (code == null || code.isEmpty) return;
await _validate(code);
}

Future<void> _manualEntry() async {
final ctrl = TextEditingController();
final code = await showDialog<String>(
context: context,
builder: (_) => AlertDialog(
title: const Text('Saisir le code'),
content: TextField(
controller: ctrl,
decoration: const InputDecoration(hintText: 'Ex: CMD123'),
),
actions: [
TextButton(
onPressed: () => Navigator.pop(context),
child: const Text('Annuler'),
),
FilledButton(
onPressed: () => Navigator.pop(context, ctrl.text.trim()),
child: const Text('Valider'),
),
],
),
);
if (code != null && code.isNotEmpty) {
await _validate(code);
}
}

@override
void dispose() {
_controller.dispose();
super.dispose();
}

@override
Widget build(BuildContext context) {
return Scaffold(
appBar: AppBar(title: const Text('Scanner un QR Code')),
body: Stack(
children: [
MobileScanner(controller: _controller, onDetect: _onDetect),
Center(
child: Container(
width: 250,
height: 250,
decoration: BoxDecoration(
border: Border.all(color: Colors.green, width: 3),
borderRadius: BorderRadius.circular(16),
),
),
),
],
),
floatingActionButton: FloatingActionButton.extended(
onPressed: _manualEntry,
icon: const Icon(Icons.keyboard),
label: const Text('Saisir le code'),
),
);
}
}