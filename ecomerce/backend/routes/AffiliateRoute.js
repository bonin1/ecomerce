const express = require('express');
const router = express.Router();
const affiliateController = require('../controller/Affiliate/AffiliateManagement');
const affiliateTracking = require('../controller/Affiliate/AffiliateTracking');
const { authenticate, isAdmin, isAdminOrStaff } = require('../middleware/authMiddleware');
const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');

// Public routes (for affiliate applications and tracking)
router.post('/apply', affiliateController.createAffiliate);
router.post('/track-click', affiliateTracking.trackClick);
router.post('/track-conversion', affiliateTracking.processConversion);
router.get('/performance/:affiliateCode', affiliateTracking.getAffiliatePerformance);

// Admin routes (protected)
router.get('/admin/all', authenticateAdmin, affiliateController.getAllAffiliates);
router.get('/admin/stats', authenticateAdmin, affiliateController.getAffiliateStats);
router.get('/admin/:id', authenticateAdmin, affiliateController.getAffiliateById);
router.put('/admin/:id', authenticateAdmin, affiliateController.updateAffiliate);
router.delete('/admin/:id', authenticateAdmin, affiliateController.deleteAffiliate);
router.put('/admin/bulk/status', authenticateAdmin, affiliateController.bulkUpdateStatus);

module.exports = router;
