const { pool } = require('../config/db');

async function requireMerchant(req, res, next) {
  try {
    const uid = req.user && req.user.uid;
    if (!uid) return res.status(401).json({ message: 'Authentication required' });

    const [rows] = await pool.execute(
      'SELECT id, status FROM shops WHERE merchant_id = ? LIMIT 1',
      [uid]
    );

    if (!rows.length) {
      return res.status(403).json({ message: 'Merchant account required' });
    }

    req.shop = rows[0];
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireMerchant };
