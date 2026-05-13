const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');
const {
    getAllPaymentMethods,
    getPaymentMethodById,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getProductPaymentMethods,
    setProductPaymentMethods
} = require('../controller/PaymentMethod/PaymentMethodController');

// Admin routes - protected with admin authentication
router.get('/', getAllPaymentMethods);
router.get('/:id', getPaymentMethodById);
router.post('/', authenticateAdmin, createPaymentMethod);
router.put('/:id', authenticateAdmin, updatePaymentMethod);
router.delete('/:id', authenticateAdmin, deletePaymentMethod);

// Product payment method routes
router.get('/product/:productId', getProductPaymentMethods);
router.post('/product/:productId', authenticateAdmin, setProductPaymentMethods);

module.exports = router;
