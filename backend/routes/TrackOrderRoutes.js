const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getOrderTrackingByNumber, getOrderTrackingById } = require('../controller/UserManagement/order/UserTrackingController');

router.get('/track', getOrderTrackingByNumber);

router.get('/my-orders/:orderId/tracking', authenticate, getOrderTrackingById);

module.exports = router;