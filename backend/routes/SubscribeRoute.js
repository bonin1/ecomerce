const express = require('express');
const router = express.Router();
const subscribeManagement = require('../controller/Subscribe/SubscribeManagement');
const statistics = require('../controller/Subscribe/Statistics');
const { getAllSubscriptions } = require('../controller/Subscribe/CRUDoperations');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes
router.post('/subscribe', subscribeManagement.handleSubscribe);
router.post('/unsubscribe', subscribeManagement.handleUnsubscribe);
router.get('/unsubscribe', subscribeManagement.handleOneClickUnsubscribe); // For unsubscribe links in emails
router.get('/verify/:email', subscribeManagement.verifySubscription);

// Admin routes (protected)
router.get('/statistics', authenticate, statistics.getOverallStats);
router.get('/statistics/trends', authenticate, statistics.getMonthlyTrends);
router.get('/list', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const activeOnly = req.query.activeOnly === 'true';
        
        const result = await getAllSubscriptions(page, limit, activeOnly);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error getting subscriptions list:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
    }
});

module.exports = router;
