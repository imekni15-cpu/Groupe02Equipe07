const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireMerchant } = require('../middleware/merchantMiddleware');
const controller = require('../controllers/shopController');

router.use(verifyToken, requireMerchant);
router.get('/mine', controller.getMyShop);
router.put('/mine', controller.updateMyShop);

module.exports = router;
