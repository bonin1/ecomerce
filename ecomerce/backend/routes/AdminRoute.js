const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');
const { 
    adminLogin,
    verifyAdminOTP,
    adminLogout 
} = require('../controller/Admin/AdminLoginSystem');
const { 
    getPendingRequests, 
    approveRequest, 
    rejectRequest 
} = require('../controller/Admin/ChangeRequestController');
const { getDashboardStats } = require('../controller/Admin/DashboardStats');
const {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStats
} = require('../controller/Admin/OrderManagement');
const {
    getAdvancedOrderStats,
    getOrderFulfillmentStats,
    getCustomerOrderInsights
} = require('../controller/Admin/OrderStatistics');

router.post('/login', adminLogin);
router.post('/verify-otp', verifyAdminOTP);
router.post('/logout', authenticateAdmin, adminLogout);

router.get('/change-requests', authenticateAdmin, getPendingRequests);
router.post('/change-requests/:requestId/approve', authenticateAdmin, approveRequest);
router.post('/change-requests/:requestId/reject', authenticateAdmin, rejectRequest);
router.get('/dashboard/stats', authenticateAdmin, getDashboardStats);

// Order management routes
router.get('/orders', authenticateAdmin, getAllOrders);
router.get('/orders/:orderId', authenticateAdmin, getOrderById);
router.put('/orders/:orderId', authenticateAdmin, updateOrderStatus);
router.get('/order-stats', authenticateAdmin, getOrderStats);

// Advanced order statistics routes
router.get('/orders/statistics/advanced', authenticateAdmin, getAdvancedOrderStats);
router.get('/orders/statistics/fulfillment', authenticateAdmin, getOrderFulfillmentStats);
router.get('/orders/statistics/customer-insights', authenticateAdmin, getCustomerOrderInsights);

module.exports = router;
