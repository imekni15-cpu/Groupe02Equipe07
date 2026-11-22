const { pool } = require('../config/db');
const { validateShop } = require('../utils/validation');

async function getMyShop(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, type, address, phone, openingHours, status
       FROM shops WHERE merchant_id = ? LIMIT 1`,
      [req.user.uid]
    );
    if (!rows.length) return res.status(404).json({ message: 'Shop not found' });
    return res.json(rows[0]);
  } catch (error) { return next(error); }
}

async function updateMyShop(req, res, next) {
  try {
    const errors = validateShop(req.body);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    const [result] = await pool.execute(
      `UPDATE shops
       SET name = ?, type = ?, address = ?, phone = ?, openingHours = ?
       WHERE merchant_id = ?`,
      [
        req.body.name.trim(), req.body.type, req.body.address.trim(),
        String(req.body.phone), req.body.openingHours.trim(), req.user.uid
      ]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Shop not found' });
    return getMyShop(req, res, next);
  } catch (error) { return next(error); }
}

module.exports = { getMyShop, updateMyShop };
