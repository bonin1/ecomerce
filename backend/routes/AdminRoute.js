const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');
const { requireFullAdmin } = require('../middleware/adminRoleMiddleware');
const staffReadOnlyBlock = require('../middleware/staffReadOnlyBlock');
const {
    adminLogin,
    verifyAdminOTP,
    adminLogout,
} = require('../controller/Admin/AdminLoginSystem');
const { getPendingRequests, approveRequest, rejectRequest } = require('../controller/Admin/ChangeRequestController');
const { getDashboardStats } = require('../controller/Admin/DashboardStats');
const {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStats,
} = require('../controller/Admin/OrderManagement');
const {
    getAdvancedOrderStats,
    getOrderFulfillmentStats,
    getCustomerOrderInsights,
} = require('../controller/Admin/OrderStatistics');
const {
    addTrackingUpdate,
    getOrderTrackingHistoryAdmin,
    getLatestTrackingStatusAdmin,
    resendTrackingNotification,
} = require('../controller/UserManagement/order/TrackingController');
const { listUsers, updateUser } = require('../controller/Admin/AdminUserController');
const { listCustomers, getCustomerSummary } = require('../controller/Admin/AdminCustomerController');
const { getAdminSettings } = require('../controller/Admin/AdminSettingsController');
const ops = require('../controller/Admin/AdminExtendedOpsController');

const auth = [authenticateAdmin, staffReadOnlyBlock];

router.post('/login', adminLogin);
router.post('/verify-otp', verifyAdminOTP);
router.post('/logout', ...auth, adminLogout);

router.get('/change-requests', ...auth, requireFullAdmin, getPendingRequests);
router.post('/change-requests/:requestId/approve', ...auth, requireFullAdmin, approveRequest);
router.post('/change-requests/:requestId/reject', ...auth, requireFullAdmin, rejectRequest);
router.get('/dashboard/stats', ...auth, getDashboardStats);

router.get('/settings', ...auth, requireFullAdmin, getAdminSettings);

router.get('/users', ...auth, requireFullAdmin, listUsers);
router.patch('/users/:id', ...auth, requireFullAdmin, updateUser);

router.get('/customers/summary', ...auth, getCustomerSummary);
router.get('/customers', ...auth, listCustomers);

router.get('/orders/statistics/advanced', ...auth, getAdvancedOrderStats);
router.get('/orders/statistics/fulfillment', ...auth, getOrderFulfillmentStats);
router.get('/orders/statistics/customer-insights', ...auth, getCustomerOrderInsights);
router.get('/orders/statistics/basic', ...auth, getOrderStats);

router.get('/orders', ...auth, getAllOrders);
router.get('/orders/:orderId', ...auth, getOrderById);
router.put('/orders/:orderId/status', ...auth, updateOrderStatus);

router.post('/orders/:orderId/tracking', ...auth, addTrackingUpdate);
router.get('/orders/:orderId/tracking', ...auth, getOrderTrackingHistoryAdmin);
router.get('/orders/:orderId/tracking/latest', ...auth, getLatestTrackingStatusAdmin);
router.post('/tracking/:trackingId/notify', ...auth, resendTrackingNotification);

/** Extended operations (audit, compliance, risk, coupons, etc.) */
router.get('/ops/activity-logs', ...auth, ops.listActivityLogs);
router.get('/ops/activity-logs/export.csv', ...auth, ops.exportActivityLogsCsv);
router.get('/ops/platform-settings', ...auth, ops.getPlatformSettings);
router.patch('/ops/platform-settings', ...auth, ops.patchPlatformSettings);
router.get('/ops/marketing-consents', ...auth, ops.listMarketingConsents);
router.post('/ops/marketing-consent', ...auth, ops.recordMarketingConsent);
router.get('/ops/users/:userId/export', ...auth, ops.exportUserData);
router.post('/ops/users/:userId/anonymize', ...auth, ops.anonymizeUser);
router.post('/ops/compliance/anonymize-old-orders', ...auth, ops.runAnonymizeOldOrders);
router.get('/ops/risk-flags', ...auth, ops.listRiskFlags);
router.patch('/ops/risk-flags/:id', ...auth, ops.patchRiskFlag);
router.post('/ops/orders/:orderId/risk-scan', ...auth, ops.scanOrderRisk);
router.get('/ops/orders/:orderId/shipments', ...auth, ops.listShipments);
router.post('/ops/orders/:orderId/shipments', ...auth, ops.createShipment);
router.patch('/ops/order-items/:lineId/shipped', ...auth, ops.partialShipLine);
router.get('/ops/returns', ...auth, ops.listReturns);
router.post('/ops/returns', ...auth, ops.createReturn);
router.patch('/ops/returns/:id', ...auth, ops.patchReturn);
router.get('/ops/coupons', ...auth, ops.listCoupons);
router.post('/ops/coupons', ...auth, ops.upsertCoupon);
router.delete('/ops/coupons/:id', ...auth, ops.deleteCoupon);
router.get('/ops/content-flags', ...auth, ops.listContentFlags);
router.post('/ops/content-flags', ...auth, ops.createContentFlag);
router.patch('/ops/content-flags/:id', ...auth, ops.patchContentFlag);
router.get('/ops/orders/:orderId/notes', ...auth, ops.listOrderNotes);
router.post('/ops/orders/:orderId/notes', ...auth, ops.addOrderNote);
router.get('/ops/users/:userId/notes', ...auth, ops.listUserNotes);
router.post('/ops/users/:userId/notes', ...auth, ops.addUserNote);
router.get('/ops/analytics/summary', ...auth, ops.analyticsSummary);
router.get('/ops/inventory/low-stock', ...auth, ops.lowStockReport);
router.post('/ops/inventory/low-stock/notify-stub', ...auth, ops.notifyLowStockStub);
router.get('/ops/products/:productId/cost-sheet', ...auth, ops.getCostSheet);
router.put('/ops/products/:productId/cost-sheet', ...auth, ops.putCostSheet);

module.exports = router;
