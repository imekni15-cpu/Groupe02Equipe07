
import 'package:flutter/material.dart';

import '../../services/order_service.dart';
import '../orders/order_tracking_screen.dart';

class OfferDetailsScreen extends StatefulWidget {
  final String name;
  final String restaurant;
  final String description;
  final double oldPrice;
  final double newPrice;
  final String image;
  final int quantity;

  const OfferDetailsScreen({
    super.key,
    required this.name,
    required this.restaurant,
    required this.description,
    required this.oldPrice,
    required this.newPrice,
    required this.image,
    required this.quantity,
  });

  @override
  State<OfferDetailsScreen> createState() =>
      _OfferDetailsScreenState();
}

class _OfferDetailsScreenState extends State<OfferDetailsScreen> {
  final OrderService orderService = OrderService();

  int selectedQuantity = 1;
  bool isSaving = false;

  Future<void> reserveOffer() async {
    if (isSaving) return;

    setState(() {
      isSaving = true;
    });

    try {
      final double total =
          widget.newPrice * selectedQuantity;

      final String orderId = await orderService.createOrder(
        offerName: widget.name,
        quantity: selectedQuantity,
        totalPrice: total,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Commande enregistrée avec succès !'),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => OrderTrackingScreen(),
        ),
      );

      debugPrint('Commande créée : $orderId');
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur : $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final double total =
        widget.newPrice * selectedQuantity;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Détails de l’offre'),
        backgroundColor: const Color(0xFF239B62),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Image.network(
              widget.image,
              width: double.infinity,
              height: 230,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  height: 230,
                  color: Colors.grey.shade200,
                  child: const Center(
                    child: Icon(
                      Icons.restaurant,
                      size: 70,
                      color: Colors.grey,
                    ),
                  ),
                );
              },
            ),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.name,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 8),

                  Text(
                    widget.restaurant,
                    style: const TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),

                  const SizedBox(height: 18),

                  Row(
                    children: [
                      Text(
                        '${widget.newPrice.toStringAsFixed(2)} DT',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF239B62),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '${widget.oldPrice.toStringAsFixed(2)} DT',
                        style: const TextStyle(
                          decoration: TextDecoration.lineThrough,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  const Text(
                    'Description',
                    style: TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 8),

                  Text(
                    widget.description,
                    style: const TextStyle(fontSize: 15),
                  ),

                  const SizedBox(height: 20),

                  Text(
                    'Quantité disponible : ${widget.quantity}',
                    style: const TextStyle(fontSize: 15),
                  ),

                  const SizedBox(height: 15),

                  const Text(
                    'Choisir la quantité',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 10),

                  Row(
                    children: [
                      IconButton(
                        onPressed: selectedQuantity > 1
                            ? () {
                                setState(() {
                                  selectedQuantity--;
                                });
                              }
                            : null,
                        icon: const Icon(
                          Icons.remove_circle_outline,
                        ),
                      ),

                      Text(
                        '$selectedQuantity',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      IconButton(
                        onPressed:
                            selectedQuantity < widget.quantity
                                ? () {
                                    setState(() {
                                      selectedQuantity++;
                                    });
                                  }
                                : null,
                        icon: const Icon(
                          Icons.add_circle_outline,
                        ),
                      ),
                    ],
                  ),

                  const Divider(height: 30),

                  Row(
                    mainAxisAlignment:
                        MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total :',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '${total.toStringAsFixed(2)} DT',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF239B62),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 25),

                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: isSaving ||
                              widget.quantity < 1
                          ? null
                          : reserveOffer,
                      style: ElevatedButton.styleFrom(
                        backgroundColor:
                            const Color(0xFF239B62),
                        foregroundColor: Colors.white,
                      ),
                      child: isSaving
                          ? const CircularProgressIndicator(
                              color: Colors.white,
                            )
                          : const Text(
                              'Confirmer la commande',
                              style: TextStyle(fontSize: 16),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
