const Affiliate = require('../../model/AffiliateModel');
const { Op } = require('sequelize');
const crypto = require('crypto');

// Helper function to generate unique affiliate code
const generateAffiliateCode = async () => {
    let code;
    let isUnique = false;
    
    while (!isUnique) {
        code = 'AFF' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const existing = await Affiliate.findOne({ where: { affiliateCode: code } });
        if (!existing) {
            isUnique = true;
        }
    }
    
    return code;
};

// Create new affiliate application
exports.createAffiliate = async (req, res) => {
    try {
        const { fullName, email, website, socialMedia, message } = req.body;

        // Validate required fields
        if (!fullName || !email) {
            return res.status(400).json({
                success: false,
                message: 'Full name and email are required'
            });
        }

        // Check if email already exists
        const existingAffiliate = await Affiliate.findOne({ where: { email } });
        if (existingAffiliate) {
            return res.status(409).json({
                success: false,
                message: 'An affiliate application with this email already exists'
            });
        }

        // Create new affiliate
        const affiliate = await Affiliate.create({
            fullName,
            email,
            website,
            socialMedia,
            message,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Affiliate application submitted successfully. We will review your application and get back to you soon.',
            data: {
                id: affiliate.id,
                fullName: affiliate.fullName,
                email: affiliate.email,
                status: affiliate.status
            }
        });
    } catch (error) {
        console.error('Error creating affiliate:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all affiliates (Admin only)
exports.getAllAffiliates = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status || '';
        const search = req.query.search || '';

        // Build where clause
        const whereClause = {};
        
        if (status && status !== 'all') {
            whereClause.status = status;
        }

        if (search) {
            whereClause[Op.or] = [
                { fullName: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { affiliateCode: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Affiliate.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            attributes: {
                exclude: ['paymentDetails'] // Sensitive data
            }
        });

        res.json({
            success: true,
            data: {
                affiliates: rows,
                totalCount: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                hasNextPage: page < Math.ceil(count / limit),
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching affiliates:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get affiliate by ID
exports.getAffiliateById = async (req, res) => {
    try {
        const { id } = req.params;

        const affiliate = await Affiliate.findByPk(id, {
            attributes: {
                exclude: ['paymentDetails'] // Sensitive data for general access
            }
        });

        if (!affiliate) {
            return res.status(404).json({
                success: false,
                message: 'Affiliate not found'
            });
        }

        res.json({
            success: true,
            data: affiliate
        });
    } catch (error) {
        console.error('Error fetching affiliate:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update affiliate
exports.updateAffiliate = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const affiliate = await Affiliate.findByPk(id);
        if (!affiliate) {
            return res.status(404).json({
                success: false,
                message: 'Affiliate not found'
            });
        }

        const previousStatus = affiliate.status;

        // If approving affiliate, generate affiliate code
        if (updateData.status === 'approved' && !affiliate.affiliateCode) {
            updateData.affiliateCode = await generateAffiliateCode();
            updateData.approvedAt = new Date();
            updateData.approvedBy = req.user ? req.user.id : null;
        }

        // Update affiliate
        await affiliate.update(updateData);

        // Send email notifications for status changes
        if (previousStatus !== updateData.status) {
            try {
                if (updateData.status === 'approved') {
                    await AffiliateEmailService.sendAffiliateApprovalEmail({
                        name: affiliate.fullName,
                        email: affiliate.email,
                        affiliateCode: affiliate.affiliateCode,
                        commissionRate: affiliate.commissionRate || 5
                    });
                } else if (updateData.status === 'rejected') {
                    await AffiliateEmailService.sendAffiliateRejectionEmail({
                        name: affiliate.fullName,
                        email: affiliate.email
                    }, updateData.rejectionReason);
                }
            } catch (emailError) {
                console.error('Error sending status change email:', emailError);
                // Don't fail the update if email fails
            }
        }

        res.json({
            success: true,
            message: 'Affiliate updated successfully',
            data: affiliate
        });
    } catch (error) {
        console.error('Error updating affiliate:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete affiliate
exports.deleteAffiliate = async (req, res) => {
    try {
        const { id } = req.params;

        const affiliate = await Affiliate.findByPk(id);
        if (!affiliate) {
            return res.status(404).json({
                success: false,
                message: 'Affiliate not found'
            });
        }

        await affiliate.destroy();

        res.json({
            success: true,
            message: 'Affiliate deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting affiliate:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get affiliate statistics
exports.getAffiliateStats = async (req, res) => {
    try {
        const [
            totalAffiliates,
            pendingAffiliates,
            approvedAffiliates,
            rejectedAffiliates,
            suspendedAffiliates,
            totalEarningsResult,
            totalClicks,
            totalConversions,
        ] = await Promise.all([
            Affiliate.count(),
            Affiliate.count({ where: { status: 'pending' } }),
            Affiliate.count({ where: { status: 'approved' } }),
            Affiliate.count({ where: { status: 'rejected' } }),
            Affiliate.count({ where: { status: 'suspended' } }),
            Affiliate.sum('totalEarnings'),
            Affiliate.sum('totalClicks'),
            Affiliate.sum('totalConversions'),
        ]);

        res.json({
            success: true,
            data: {
                totalAffiliates,
                pendingAffiliates,
                approvedAffiliates,
                rejectedAffiliates,
                suspendedAffiliates,
                totalEarnings: parseFloat(totalEarningsResult || 0),
                totalClicks: totalClicks || 0,
                totalConversions: totalConversions || 0,
                conversionRate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        console.error('Error fetching affiliate stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Bulk update affiliate status
exports.bulkUpdateStatus = async (req, res) => {
    try {
        const { affiliateIds, status } = req.body;

        if (!affiliateIds || !Array.isArray(affiliateIds) || affiliateIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Affiliate IDs array is required'
            });
        }

        if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const updateData = { status };
        
        // If approving, handle affiliate codes
        if (status === 'approved') {
            const affiliates = await Affiliate.findAll({
                where: { 
                    id: { [Op.in]: affiliateIds },
                    affiliateCode: { [Op.is]: null }
                }
            });

            // Generate codes for affiliates without them
            for (const affiliate of affiliates) {
                const code = await generateAffiliateCode();
                await affiliate.update({
                    status: 'approved',
                    affiliateCode: code,
                    approvedAt: new Date(),
                    approvedBy: req.user ? req.user.id : null
                });
            }

            // Update others normally
            await Affiliate.update(updateData, {
                where: { 
                    id: { [Op.in]: affiliateIds },
                    affiliateCode: { [Op.not]: null }
                }
            });
        } else {
            await Affiliate.update(updateData, {
                where: { id: { [Op.in]: affiliateIds } }
            });
        }

        res.json({
            success: true,
            message: `Successfully updated ${affiliateIds.length} affiliates to ${status} status`
        });
    } catch (error) {
        console.error('Error in bulk update:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
