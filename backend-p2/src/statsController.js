const { pool } = require('../config/db');

async function getMerchantStats(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT
         COUNT(*) AS totalOrders,
         SUM(CASE WHEN status = 'picked_up' THEN 1 ELSE 0 END) AS completedOrders,
         COALESCE(SUM(CASE WHEN status IN ('paid','picked_up') THEN total ELSE 0 END), 0) AS revenue
       FROM orders WHERE shop_id = ?`,
      [req.shop.id]
    );
    const stats = rows[0];
    return res.json({
      totalOrders: Number(stats.totalOrders || 0),
      completedOrders: Number(stats.completedOrders || 0),
      revenue: Number(stats.revenue || 0)
    });
  } catch (error) { return next(error); }
}

module.exports = { getMerchantStats };
