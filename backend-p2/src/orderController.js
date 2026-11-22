const { pool } = require('../config/db');

async function getMyOrders(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT o.id, o.code, o.total, o.status, o.createdAt,
              u.student_name AS studentName,
              oi.offer_title AS title, oi.quantity AS qty
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN students u ON u.student_id = o.student_id
       WHERE o.shop_id = ? AND o.status = 'paid'
       ORDER BY o.createdAt DESC`,
      [req.shop.id]
    );

    const grouped = new Map();
    for (const row of rows) {
      if (!grouped.has(row.id)) {
        grouped.set(row.id, {
          id: String(row.id),
          code: row.code,
          studentName: row.studentName || 'Student',
          items: [],
          total: Number(row.total),
          status: row.status,
          createdAt: row.createdAt
        });
      }
      if (row.title) grouped.get(row.id).items.push({ title: row.title, qty: Number(row.qty) });
    }
    return res.json([...grouped.values()]);
  } catch (error) { return next(error); }
}

async function validateOrder(req, res, next) {
  const code = String(req.body.code || '').replace(/\s+/g, '').toUpperCase();
  if (!code) return res.status(400).json({ message: 'Order code is required' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      'SELECT id, shop_id, status FROM orders WHERE UPPER(REPLACE(code, \" \", \"\")) = ? FOR UPDATE',
      [code]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Code de réservation invalide' });
    }
    const order = rows[0];
    if (Number(order.shop_id) !== Number(req.shop.id)) {
      await connection.rollback();
      return res.status(403).json({ message: 'Cette réservation ne concerne pas votre boutique' });
    }
    if (order.status === 'picked_up') {
      await connection.rollback();
      return res.status(409).json({ message: 'Cette réservation a déjà été récupérée' });
    }
    if (order.status !== 'paid') {
      await connection.rollback();
      return res.status(409).json({ message: 'Cette réservation n’est pas payée' });
    }

    await connection.execute('UPDATE orders SET status = \"picked_up\" WHERE id = ?', [order.id]);
    await connection.commit();
    return res.json({ message: 'Réservation validée avec succès', status: 'picked_up' });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

module.exports = { getMyOrders, validateOrder };
