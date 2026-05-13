const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
    getWishlistStatus,
    getMyWishlist,
    addWishlistItem,
    removeWishlistItem,
} = require('../controller/Wishlist/WishlistController');

router.get('/status/:productId', authenticate, getWishlistStatus);
router.get('/', authenticate, getMyWishlist);
router.post('/', authenticate, addWishlistItem);
router.delete('/:productId', authenticate, removeWishlistItem);

module.exports = router;
