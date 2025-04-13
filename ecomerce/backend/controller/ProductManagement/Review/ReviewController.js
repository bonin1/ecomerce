const ProduktReview = require('../../../model/ProduktReview');
const ReviewMedia = require('../../../model/ReviewMediaModel');
const Produkt = require('../../../model/ProduktModel');
const User = require('../../../model/UserModel');
const UserActivityLog = require('../../../model/UserActivityLogModel');
const db = require('../../../database');
const { Op } = require('sequelize');

const createReview = async (req, res) => {
    const t = await db.transaction();
    try {
        const { productId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        const product = await Produkt.findByPk(productId);
        if (!product) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const existingReview = await ProduktReview.findOne({
            where: {
                user_id: userId,
                product_id: productId
            }
        });

        if (existingReview) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product'
            });
        }

        const review = await ProduktReview.create({
            user_id: userId,
            product_id: productId,
            rating,
            comment,
            verified_purchase: false
        }, { transaction: t });

        const imageFiles = req.files || [];
        if (imageFiles.length > 5) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Maximum 5 images allowed per review'
            });
        }

        for (const file of imageFiles) {
            await ReviewMedia.create({
                review_id: review.id,
                media: file.buffer,
                media_type: file.mimetype
            }, { transaction: t });
        }

        await UserActivityLog.create({
            user_id: userId,
            activity_type: 'CREATE_REVIEW',
            details: JSON.stringify({
                review_id: review.id,
                product_id: productId,
                rating
            }),
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        }, { transaction: t });

        await updateProductRating(productId, t);

        await t.commit();

        return res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: {
                id: review.id,
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt,
                images: imageFiles.length
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('Error creating review:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating review',
            error: error.message
        });
    }
};

const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, rating } = req.query;
        const offset = (page - 1) * limit;
        
        const whereClause = {
            product_id: productId,
            status: 'approved'
        };

        if (rating) {
            whereClause.rating = rating;
        }

        const { count, rows: reviews } = await ProduktReview.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'lastname', 'profile_picture']
                }
            ]
        });

        const reviewIds = reviews.map(review => review.id);
        const allMedia = reviewIds.length > 0 ? 
            await ReviewMedia.findAll({
                where: { review_id: { [Op.in]: reviewIds } }
            }) : [];

        const mediaMap = {};
        allMedia.forEach(media => {
            if (!mediaMap[media.review_id]) {
                mediaMap[media.review_id] = [];
            }
            
            const base64 = Buffer.from(media.media).toString('base64');
            mediaMap[media.review_id].push({
                id: media.id,
                media_type: media.media_type,
                media_data: `data:${media.media_type};base64,${base64}`
            });
        });

        const reviewsWithMedia = reviews.map(review => {
            const reviewData = review.toJSON();
            
            if (reviewData.User && reviewData.User.profile_picture) {
                const profilePic = Buffer.from(reviewData.User.profile_picture).toString('base64');
                reviewData.User.profile_picture = `data:image/jpeg;base64,${profilePic}`;
            }
            
            return {
                ...reviewData,
                media: mediaMap[review.id] || []
            };
        });

        const ratingSummary = await ProduktReview.findAll({
            where: { product_id: productId, status: 'approved' },
            attributes: [
                'rating',
                [db.fn('COUNT', db.col('rating')), 'count']
            ],
            group: ['rating'],
            raw: true
        });

        const summary = {
            average: 0,
            total: 0,
            distribution: {
                1: 0, 2: 0, 3: 0, 4: 0, 5: 0
            }
        };

        let totalRating = 0;
        let totalCount = 0;

        ratingSummary.forEach(item => {
            const ratingValue = item.rating;
            const ratingCount = parseInt(item.count);
            
            summary.distribution[ratingValue] = ratingCount;
            totalRating += ratingValue * ratingCount;
            totalCount += ratingCount;
        });

        if (totalCount > 0) {
            summary.average = (totalRating / totalCount).toFixed(1);
            summary.total = totalCount;
        }

        return res.status(200).json({
            success: true,
            data: {
                reviews: reviewsWithMedia,
                ratingSummary: summary
            },
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching reviews',
            error: error.message
        });
    }
};

const updateReview = async (req, res) => {
    const t = await db.transaction();
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        const review = await ProduktReview.findByPk(reviewId);
        
        if (!review) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        if (review.user_id !== userId) {
            await t.rollback();
            return res.status(403).json({
                success: false,
                message: 'You can only update your own reviews'
            });
        }

        await review.update({
            rating,
            comment,
            status: 'pending'  
        }, { transaction: t });

        await UserActivityLog.create({
            user_id: userId,
            activity_type: 'UPDATE_REVIEW',
            details: JSON.stringify({
                review_id: review.id,
                product_id: review.product_id,
                rating
            }),
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        }, { transaction: t });

        await updateProductRating(review.product_id, t);

        await t.commit();

        return res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            data: {
                id: review.id,
                rating: review.rating,
                comment: review.comment,
                updatedAt: review.updatedAt
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('Error updating review:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating review',
            error: error.message
        });
    }
};

const deleteReview = async (req, res) => {
    const t = await db.transaction();
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;
        const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

        const review = await ProduktReview.findByPk(reviewId);
        
        if (!review) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        if (review.user_id !== userId && !isAdmin) {
            await t.rollback();
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this review'
            });
        }

        const productId = review.product_id;

        await ReviewMedia.destroy({
            where: { review_id: reviewId },
            transaction: t
        });

        await review.destroy({ transaction: t });

        await UserActivityLog.create({
            user_id: userId,
            activity_type: 'DELETE_REVIEW',
            details: JSON.stringify({
                review_id: reviewId,
                product_id: productId
            }),
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        }, { transaction: t });

        await updateProductRating(productId, t);

        await t.commit();

        return res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        await t.rollback();
        console.error('Error deleting review:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting review',
            error: error.message
        });
    }
};

const moderateReview = async (req, res) => {
    const t = await db.transaction();
    try {
        const { reviewId } = req.params;
        const { status } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Invalid status, must be "approved" or "rejected"'
            });
        }

        const review = await ProduktReview.findByPk(reviewId);
        
        if (!review) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        await review.update({ status }, { transaction: t });

        await UserActivityLog.create({
            user_id: req.user.id,
            activity_type: 'MODERATE_REVIEW',
            details: JSON.stringify({
                review_id: reviewId,
                product_id: review.product_id,
                new_status: status
            }),
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        }, { transaction: t });

        if (status === 'approved') {
            await updateProductRating(review.product_id, t);
        }

        await t.commit();

        return res.status(200).json({
            success: true,
            message: `Review ${status} successfully`
        });
    } catch (error) {
        await t.rollback();
        console.error('Error moderating review:', error);
        return res.status(500).json({
            success: false,
            message: 'Error moderating review',
            error: error.message
        });
    }
};

const addReviewMedia = async (req, res) => {
    const t = await db.transaction();
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        const review = await ProduktReview.findByPk(reviewId);
        
        if (!review) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        if (review.user_id !== userId) {
            await t.rollback();
            return res.status(403).json({
                success: false,
                message: 'You can only add media to your own reviews'
            });
        }

        const existingMediaCount = await ReviewMedia.count({
            where: { review_id: reviewId }
        });

        const files = req.files || [];
        
        if (existingMediaCount + files.length > 5) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `Cannot add ${files.length} images. Maximum 5 images allowed per review (${existingMediaCount} already exist)`
            });
        }

        const savedMedia = [];
        for (const file of files) {
            const media = await ReviewMedia.create({
                review_id: reviewId,
                media: file.buffer,
                media_type: file.mimetype
            }, { transaction: t });
            
            savedMedia.push(media);
        }

        await t.commit();

        return res.status(201).json({
            success: true,
            message: 'Media added to review successfully',
            data: {
                count: savedMedia.length,
                mediaIds: savedMedia.map(m => m.id)
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('Error adding review media:', error);
        return res.status(500).json({
            success: false,
            message: 'Error adding media to review',
            error: error.message
        });
    }
};

const deleteReviewMedia = async (req, res) => {
    const t = await db.transaction();
    try {
        const { reviewId, mediaId } = req.params;
        const userId = req.user.id;
        const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

        const review = await ProduktReview.findByPk(reviewId);
        
        if (!review) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        if (review.user_id !== userId && !isAdmin) {
            await t.rollback();
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this media'
            });
        }

        const media = await ReviewMedia.findOne({
            where: {
                id: mediaId,
                review_id: reviewId
            }
        });

        if (!media) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Media not found or does not belong to this review'
            });
        }

        await media.destroy({ transaction: t });
        await t.commit();

        return res.status(200).json({
            success: true,
            message: 'Review media deleted successfully'
        });
    } catch (error) {
        await t.rollback();
        console.error('Error deleting review media:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting review media',
            error: error.message
        });
    }
};

async function updateProductRating(productId, transaction) {
    try {
        const result = await ProduktReview.findOne({
            where: {
                product_id: productId,
                status: 'approved'
            },
            attributes: [
                [db.fn('AVG', db.col('rating')), 'average'],
                [db.fn('COUNT', db.col('id')), 'count']
            ],
            raw: true,
            transaction
        });

        let averageRating = 0;
        if (result && result.average) {
            averageRating = parseFloat(result.average).toFixed(2);
        }

        await Produkt.update(
            { product_rating: averageRating },
            { 
                where: { id: productId },
                transaction
            }
        );

        return true;
    } catch (error) {
        console.error('Error updating product rating:', error);
        throw error;
    }
}

const getUserReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: reviews } = await ProduktReview.findAndCountAll({
            where: {
                user_id: userId
            },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: Produkt,
                    attributes: ['id', 'product_name', 'product_price']
                }
            ]
        });

        const reviewIds = reviews.map(review => review.id);
        const allMedia = reviewIds.length > 0 ? 
            await ReviewMedia.findAll({
                where: { review_id: { [Op.in]: reviewIds } }
            }) : [];

        const mediaMap = {};
        allMedia.forEach(media => {
            if (!mediaMap[media.review_id]) {
                mediaMap[media.review_id] = [];
            }
            
            const base64 = Buffer.from(media.media).toString('base64');
            mediaMap[media.review_id].push({
                id: media.id,
                media_type: media.media_type,
                media_data: `data:${media.media_type};base64,${base64}`
            });
        });

        const reviewsWithMedia = reviews.map(review => ({
            ...review.toJSON(),
            media: mediaMap[review.id] || []
        }));

        return res.status(200).json({
            success: true,
            data: reviewsWithMedia,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching user reviews',
            error: error.message
        });
    }
};

const getPendingReviews = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: reviews } = await ProduktReview.findAndCountAll({
            where: {
                status: 'pending'
            },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'ASC']],
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'lastname']
                },
                {
                    model: Produkt,
                    attributes: ['id', 'product_name']
                }
            ]
        });

        return res.status(200).json({
            success: true,
            data: reviews,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching pending reviews:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching pending reviews',
            error: error.message
        });
    }
};

module.exports = {
    createReview,
    getProductReviews,
    updateReview,
    deleteReview,
    moderateReview,
    addReviewMedia,
    deleteReviewMedia,
    getUserReviews,
    getPendingReviews
};
