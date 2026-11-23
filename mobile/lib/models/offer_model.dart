
class OfferModel {
  final int id;
  final int shopId;
  final String title;
  final String category;
  final String description;
  final double originalPrice;
  final double discountPrice;
  final int quantity;
  final String pickupStart;
  final String pickupEnd;
  final String? photoUrl;
  final String status;
  final String? shopName;

  OfferModel({
    required this.id,
    required this.shopId,
    required this.title,
    required this.category,
    required this.description,
    required this.originalPrice,
    required this.discountPrice,
    required this.quantity,
    required this.pickupStart,
    required this.pickupEnd,
    this.photoUrl,
    required this.status,
    this.shopName,
  });

  factory OfferModel.fromJson(Map<String, dynamic> json) {
    return OfferModel(
      id: int.parse(json['id'].toString()),
      shopId: int.tryParse((json['shop_id'] ?? json['shopId'] ?? 0).toString()) ?? 0,
      title: json['title']?.toString() ?? '',
      category: json['category']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      originalPrice: double.tryParse(json['originalPrice'].toString()) ?? 0,
      discountPrice: double.tryParse(json['discountPrice'].toString()) ?? 0,
      quantity: int.tryParse(json['quantity'].toString()) ?? 0,
      pickupStart: json['pickupStart']?.toString() ?? '',
      pickupEnd: json['pickupEnd']?.toString() ?? '',
      photoUrl: json['photoUrl']?.toString(),
      status: json['status']?.toString() ?? 'active',
      shopName: json['shopName']?.toString(),
    );
  }
}
