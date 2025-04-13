const express = require('express');
const router = express.Router();
const { authenticate, isAdminOrStaff } = require('../middleware/authMiddleware');
const { reviewValidation } = require('../middleware/validationMiddleware');
const upload = require('../config/UploadConfig');
const {
    createReview,
    getProductReviews,
    updateReview,
    deleteReview,
    moderateReview,
    addReviewMedia,
    deleteReviewMedia,
    getUserReviews,
    getPendingReviews
} = require('../controller/ProductManagement/Review/ReviewController');

// Public routes
router.get('/products/:productId/reviews', getProductReviews);

// User routes (require authentication)
router.post('/products/:productId/reviews', authenticate, reviewValidation, upload.array('images', 5), createReview);
router.put('/reviews/:reviewId', authenticate, reviewValidation, updateReview);
router.delete('/reviews/:reviewId', authenticate, deleteReview);
router.post('/reviews/:reviewId/media', authenticate, upload.array('images', 5), addReviewMedia);
router.delete('/reviews/:reviewId/media/:mediaId', authenticate, deleteReviewMedia);
router.get('/user/reviews', authenticate, getUserReviews);

// Admin routes
router.get('/admin/reviews/pending', authenticate, isAdminOrStaff, getPendingReviews);
router.patch('/admin/reviews/:reviewId/moderate', authenticate, isAdminOrStaff, moderateReview);

module.exports = router;
