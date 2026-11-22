const { pool } = require('../config/db');
const { validateOffer } = require('../utils/validation');

function photoUrl(req) {
  return req.file ? `/uploads/${req.file.filename}` : null;
}

async function getMyOffers(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, title, category, description, originalPrice, discountPrice,
              quantity, pickupStart, pickupEnd, photoUrl, status, createdAt
       FROM offers WHERE shop_id = ? ORDER BY createdAt DESC`,
      [req.shop.id]
    );
    return res.json(rows);
  } catch (error) { return next(error); }
}

async function getOfferById(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT o.id, o.title, o.category, o.description, o.originalPrice,
              o.discountPrice, o.quantity, o.pickupStart, o.pickupEnd,
              o.photoUrl, o.status, o.createdAt
       FROM offers o WHERE o.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Offer not found' });

    const [owner] = await pool.execute(
      'SELECT id FROM shops WHERE id = ? AND merchant_id = ?',
      [rows[0].shop_id || -1, req.user.uid]
    );
    // Ownership is checked with a direct query to avoid exposing another merchant's offer.
    const [owned] = await pool.execute(
      'SELECT id FROM offers WHERE id = ? AND shop_id = ?',
      [req.params.id, req.shop.id]
    );
    if (!owned.length) return res.status(403).json({ message: 'You cannot access this offer' });
    return res.json(rows[0]);
  } catch (error) { return next(error); }
}

async function createOffer(req, res, next) {
  try {
    const image = photoUrl(req);
    const body = { ...req.body, photoUrl: image };
    const errors = validateOffer(body, true);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    const [result] = await pool.execute(
      `INSERT INTO offers
       (shop_id, title, category, description, originalPrice, discountPrice,
        quantity, pickupStart, pickupEnd, photoUrl, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        req.shop.id, req.body.title.trim(), req.body.category,
        req.body.description || '', Number(req.body.originalPrice),
        Number(req.body.discountPrice), Number(req.body.quantity),
        req.body.pickupStart, req.body.pickupEnd, image
      ]
    );
    const [rows] = await pool.execute('SELECT * FROM offers WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    if (req.file) require('fs').unlink(req.file.path, () => {});
    return next(error);
  }
}

async function updateOffer(req, res, next) {
  try {
    const [existingRows] = await pool.execute(
      'SELECT * FROM offers WHERE id = ? AND shop_id = ?',
      [req.params.id, req.shop.id]
    );
    if (!existingRows.length) {
      if (req.file) require('fs').unlink(req.file.path, () => {});
      const [any] = await pool.execute('SELECT id FROM offers WHERE id = ?', [req.params.id]);
      return res.status(any.length ? 403 : 404).json({ message: any.length ? 'You cannot update this offer' : 'Offer not found' });
    }

    const old = existingRows[0];
    const body = {
      title: req.body.title ?? old.title,
      category: req.body.category ?? old.category,
      originalPrice: req.body.originalPrice ?? old.originalPrice,
      discountPrice: req.body.discountPrice ?? old.discountPrice,
      quantity: req.body.quantity ?? old.quantity,
      pickupStart: req.body.pickupStart ?? old.pickupStart,
      pickupEnd: req.body.pickupEnd ?? old.pickupEnd,
      photoUrl: photoUrl(req) || old.photoUrl
    };
    const errors = validateOffer(body, true);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    const description = req.body.description ?? old.description;
    await pool.execute(
      `UPDATE offers SET title=?, category=?, description=?, originalPrice=?,
       discountPrice=?, quantity=?, pickupStart=?, pickupEnd=?, photoUrl=?
       WHERE id=? AND shop_id=?`,
      [
        String(body.title).trim(), body.category, description || '',
        Number(body.originalPrice), Number(body.discountPrice), Number(body.quantity),
        body.pickupStart, body.pickupEnd, body.photoUrl, req.params.id, req.shop.id
      ]
    );
    const [rows] = await pool.execute('SELECT * FROM offers WHERE id = ?', [req.params.id]);
    return res.json(rows[0]);
  } catch (error) {
    if (req.file) require('fs').unlink(req.file.path, () => {});
    return next(error);
  }
}

async function deleteOffer(req, res, next) {
  try {
    const [result] = await pool.execute(
      'DELETE FROM offers WHERE id = ? AND shop_id = ?',
      [req.params.id, req.shop.id]
    );
    if (!result.affectedRows) {
      const [any] = await pool.execute('SELECT id FROM offers WHERE id = ?', [req.params.id]);
      return res.status(any.length ? 403 : 404).json({ message: any.length ? 'You cannot delete this offer' : 'Offer not found' });
    }
    return res.json({ message: 'Offer deleted successfully' });
  } catch (error) { return next(error); }
}

module.exports = { getMyOffers, getOfferById, createOffer, updateOffer, deleteOffer };
