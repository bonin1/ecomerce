const Affiliate = require('../../model/AffiliateModel');
const AffiliateClick = require('../../model/AffiliateClickModel');
const { Op } = require('sequelize');

// Track affiliate click
exports.trackClick = async (req, res) => {
    try {
        const { affiliateCode, productId, landingPage } = req.body;
        const visitorIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        const userAgent = req.get('User-Agent');
        const referrerUrl = req.get('Referer');

        // Verify affiliate exists and is approved
        const affiliate = await Affiliate.findOne({ 
            where: { 
                affiliateCode,
                status: 'approved'
            }
        });

        if (!affiliate) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or inactive affiliate code'
            });
        }

        // Generate session ID for tracking
        const sessionId = req.sessionID || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create click record
        const click = await AffiliateClick.create({
            affiliateId: affiliate.id,
            affiliateCode,
            productId: productId || null,
            visitorIp,
            userAgent,
            referrerUrl,
            landingPage,
            sessionId
        });

        // Update affiliate total clicks
        await affiliate.increment('totalClicks');

        // Set affiliate tracking cookie (90 days)
        const cookieOptions = {
            maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
            httpOnly: false, // Allow client-side access for tracking
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        };

        res.cookie('affiliate_tracking', JSON.stringify({
            affiliateId: affiliate.id,
            affiliateCode,
            clickId: click.id,
            timestamp: Date.now()
        }), cookieOptions);

        res.json({
            success: true,
            message: 'Click tracked successfully',
            data: {
                trackingId: click.id,
                affiliateId: affiliate.id
            }
        });
    } catch (error) {
        console.error('Error tracking affiliate click:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track click',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Process affiliate conversion (when order is placed)
exports.processConversion = async (req, res) => {
    try {
        const { orderId, orderTotal } = req.body;
        const affiliateTracking = req.cookies.affiliate_tracking;

        if (!affiliateTracking) {
            return res.json({
                success: true,
                message: 'No affiliate tracking found'
            });
        }

        let trackingData;
        try {
            trackingData = JSON.parse(affiliateTracking);
        } catch (error) {
            return res.json({
                success: true,
                message: 'Invalid tracking data'
            });
        }

        // Check if tracking is still valid (within 90 days)
        const trackingAge = Date.now() - trackingData.timestamp;
        const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days

        if (trackingAge > maxAge) {
            return res.json({
                success: true,
                message: 'Tracking expired'
            });
        }

        // Find the affiliate and click record
        const affiliate = await Affiliate.findOne({
            where: {
                id: trackingData.affiliateId,
                affiliateCode: trackingData.affiliateCode,
                status: 'approved'
            }
        });

        if (!affiliate) {
            return res.json({
                success: true,
                message: 'Affiliate not found or inactive'
            });
        }

        // Find recent click within 90 days
        const click = await AffiliateClick.findOne({
            where: {
                affiliateId: affiliate.id,
                isConverted: false,
                createdAt: {
                    [Op.gte]: new Date(Date.now() - maxAge)
                }
            },
            order: [['createdAt', 'DESC']]
        });

        if (!click) {
            return res.json({
                success: true,
                message: 'No valid click found for conversion'
            });
        }

        // Calculate commission
        const commissionRate = affiliate.commissionRate / 100;
        const commissionAmount = orderTotal * commissionRate;

        // Update click record
        await click.update({
            isConverted: true,
            orderId,
            commissionAmount,
            conversionDate: new Date()
        });

        // Update affiliate totals
        await affiliate.increment({
            totalConversions: 1,
            totalEarnings: commissionAmount
        });

        // Clear tracking cookie
        res.clearCookie('affiliate_tracking');

        res.json({
            success: true,
            message: 'Conversion processed successfully',
            data: {
                affiliateId: affiliate.id,
                commissionAmount,
                conversionId: click.id
            }
        });
    } catch (error) {
        console.error('Error processing affiliate conversion:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process conversion',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get affiliate performance data
exports.getAffiliatePerformance = async (req, res) => {
    try {
        const { affiliateCode } = req.params;
        const { startDate, endDate } = req.query;

        const affiliate = await Affiliate.findOne({
            where: { affiliateCode }
        });

        if (!affiliate) {
            return res.status(404).json({
                success: false,
                message: 'Affiliate not found'
            });
        }

        // Build date filter
        const dateFilter = {};
        if (startDate) {
            dateFilter[Op.gte] = new Date(startDate);
        }
        if (endDate) {
            dateFilter[Op.lte] = new Date(endDate);
        }

        const whereClause = {
            affiliateId: affiliate.id
        };

        if (Object.keys(dateFilter).length > 0) {
            whereClause.createdAt = dateFilter;
        }

        // Get click statistics
        const totalClicks = await AffiliateClick.count({
            where: whereClause
        });

        const totalConversions = await AffiliateClick.count({
            where: {
                ...whereClause,
                isConverted: true
            }
        });

        const totalCommissions = await AffiliateClick.sum('commissionAmount', {
            where: {
                ...whereClause,
                isConverted: true
            }
        }) || 0;

        // Get recent clicks
        const recentClicks = await AffiliateClick.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: 50,
            attributes: [
                'id', 'productId', 'landingPage', 'isConverted', 
                'commissionAmount', 'createdAt', 'conversionDate'
            ]
        });

        const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                affiliate: {
                    id: affiliate.id,
                    fullName: affiliate.fullName,
                    affiliateCode: affiliate.affiliateCode,
                    commissionRate: affiliate.commissionRate
                },
                performance: {
                    totalClicks,
                    totalConversions,
                    totalCommissions: parseFloat(totalCommissions),
                    conversionRate: parseFloat(conversionRate)
                },
                recentClicks
            }
        });
    } catch (error) {
        console.error('Error fetching affiliate performance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
