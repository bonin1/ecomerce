const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/authMiddleware');
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
router.post('/logout', authenticate, isAdmin, adminLogout);

router.get('/change-requests', authenticate, isAdmin, getPendingRequests);
router.post('/change-requests/:requestId/approve', authenticate, isAdmin, approveRequest);
router.post('/change-requests/:requestId/reject', authenticate, isAdmin, rejectRequest);
router.get('/dashboard/stats', authenticate, isAdmin, getDashboardStats);

module.exports = router;
