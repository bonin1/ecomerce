const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const orderController = require('../controller/UserManagement/order/OrderController');
const { getOrderTrackingById } = require('../controller/UserManagement/order/UserTrackingController');

// Create a new order
router.post('/', authenticate, orderController.createOrder);

// Get all orders for the logged-in user
router.get('/', authenticate, orderController.getUserOrders);

// Get a specific order by ID
router.get('/:orderId', authenticate, orderController.getOrderById);

// Cancel an order
router.post('/:orderId/cancel', authenticate, orderController.cancelOrder);

// Get tracking information for a specific order
router.get('/:orderId/tracking', authenticate, getOrderTrackingById);

module.exports = router;
