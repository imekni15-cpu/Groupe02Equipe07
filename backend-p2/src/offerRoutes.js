const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireMerchant } = require('../middleware/merchantMiddleware');
const upload = require('../middleware/upload');
const controller = require('../controllers/offerController');

router.use(verifyToken, requireMerchant);
router.get('/mine', controller.getMyOffers);
router.get('/:id', controller.getOfferById);
router.post('/', upload.single('photo'), controller.createOffer);
router.put('/:id', upload.single('photo'), controller.updateOffer);
router.delete('/:id', controller.deleteOffer);

module.exports = router;
