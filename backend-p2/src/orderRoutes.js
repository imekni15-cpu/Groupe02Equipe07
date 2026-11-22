const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireMerchant } = require('../middleware/merchantMiddleware');
const controller = require('../controllers/orderController');

router.use(verifyToken, requireMerchant);
router.get('/mine', controller.getMyOrders);
router.post('/validate', controller.validateOrder);

module.exports = router;
