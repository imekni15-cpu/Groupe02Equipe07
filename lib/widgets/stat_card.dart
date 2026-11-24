import 'package:flutter/material.dart';

class StatCard extends StatelessWidget {
final String title;
final String value;
final IconData icon;
final Color color;

const StatCard({
super.key,
required this.title,
required this.value,
required this.icon,
this.color = Colors.blue,
});

@override
Widget build(BuildContext context) {
return Card(
child: Padding(
padding: const EdgeInsets.all(16),
child: Column(
children: [
Icon(icon, color: color, size: 30),
const SizedBox(height: 10),
Text(
value,
style: const TextStyle(
fontSize: 22,
fontWeight: FontWeight.bold,
),
),
Text(title),
],
),
),
);
}
}
