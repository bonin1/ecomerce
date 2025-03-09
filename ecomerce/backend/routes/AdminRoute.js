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

router.post('/login', adminLogin);
router.post('/verify-otp', verifyAdminOTP);
router.post('/logout', authenticateAdmin, adminLogout);

router.get('/change-requests', authenticateAdmin, getPendingRequests);
router.post('/change-requests/:requestId/approve', authenticateAdmin, approveRequest);
router.post('/change-requests/:requestId/reject', authenticateAdmin, rejectRequest);
router.get('/dashboard/stats', authenticateAdmin, getDashboardStats);

module.exports = router;
