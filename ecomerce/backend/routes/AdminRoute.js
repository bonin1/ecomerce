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
const {
    addTrackingUpdate,
    getOrderTrackingHistoryAdmin,
    getLatestTrackingStatusAdmin,
    resendTrackingNotification
} = require('../controller/UserManagement/order/TrackingController');

router.post('/login', adminLogin);
router.post('/verify-otp', verifyAdminOTP);
router.post('/logout', authenticateAdmin, adminLogout);

router.get('/change-requests', authenticateAdmin, getPendingRequests);
router.post('/change-requests/:requestId/approve', authenticateAdmin, approveRequest);
router.post('/change-requests/:requestId/reject', authenticateAdmin, rejectRequest);
router.get('/dashboard/stats', authenticateAdmin, getDashboardStats);

router.get('/orders/statistics/advanced', authenticateAdmin, getAdvancedOrderStats);
router.get('/orders/statistics/fulfillment', authenticateAdmin, getOrderFulfillmentStats);
router.get('/orders/statistics/customer-insights', authenticateAdmin, getCustomerOrderInsights);
router.get('/orders/statistics/basic', authenticateAdmin, getOrderStats);

router.get('/orders', authenticateAdmin, getAllOrders);
router.get('/orders/:orderId', authenticateAdmin, getOrderById);
router.put('/orders/:orderId/status', authenticateAdmin, updateOrderStatus);

router.post('/orders/:orderId/tracking', authenticateAdmin, addTrackingUpdate);
router.get('/orders/:orderId/tracking', authenticateAdmin, getOrderTrackingHistoryAdmin);
router.get('/orders/:orderId/tracking/latest', authenticateAdmin, getLatestTrackingStatusAdmin);
router.post('/tracking/:trackingId/notify', authenticateAdmin, resendTrackingNotification);

module.exports = router;
