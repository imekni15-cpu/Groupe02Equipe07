const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireMerchant } = require('../middleware/merchantMiddleware');
const controller = require('../controllers/statsController');

router.use(verifyToken, requireMerchant);
router.get('/merchant', controller.getMerchantStats);

module.exports = router;
