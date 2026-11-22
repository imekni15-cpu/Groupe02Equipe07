const admin = require('../config/firebase');

async function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authentication token is required' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token' });
  }
}

module.exports = { verifyToken };
