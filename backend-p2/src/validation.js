const categories = ['Sandwich', 'Plat chaud', 'Salade', 'Pâtisserie', 'Boisson', 'Autre'];
const shopTypes = ['Restaurant', 'Cafétéria', 'Boulangerie', 'Fast-food'];

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateShop(body) {
  const errors = [];
  if (!body.name || !String(body.name).trim()) errors.push('Shop name is required');
  if (!shopTypes.includes(body.type)) errors.push('Invalid shop type');
  if (!body.address || !String(body.address).trim()) errors.push('Address is required');
  if (!/^\d{8}$/.test(String(body.phone || ''))) errors.push('Phone must contain exactly 8 digits');
  if (!body.openingHours || !String(body.openingHours).trim()) errors.push('Opening hours are required');
  return errors;
}

function validateOffer(body, requirePhoto = false) {
  const errors = [];
  const originalPrice = Number(body.originalPrice);
  const discountPrice = Number(body.discountPrice);
  const quantity = Number(body.quantity);
  const start = parseDate(body.pickupStart);
  const end = parseDate(body.pickupEnd);

  if (!body.title || !String(body.title).trim()) errors.push('Title is required');
  if (!categories.includes(body.category)) errors.push('Invalid offer category');
  if (!Number.isFinite(originalPrice) || originalPrice <= 0) errors.push('Original price must be greater than 0');
  if (!Number.isFinite(discountPrice) || discountPrice < 0 || discountPrice >= originalPrice) errors.push('Discount price must be lower than original price');
  if (!Number.isInteger(quantity) || quantity < 1) errors.push('Quantity must be an integer greater than or equal to 1');
  if (!start || !end || end <= start) errors.push('Pickup end must be later than pickup start');
  if (requirePhoto && !body.photoUrl) errors.push('Offer photo is required');
  return errors;
}

module.exports = { categories, shopTypes, validateShop, validateOffer };
