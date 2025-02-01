const AuditLog = require('../../model/AuditLogModel');
const ProductCategory = require('../../model/ProductCategoryModel');

const getPendingRequests = async (req, res) => {
    try {
        const pendingRequests = await AuditLog.findAll({
            where: { status: 'pending' },
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: pendingRequests
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching pending requests',
            error: error.message
        });
    }
};

const approveRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { admin_comment } = req.body;

        const request = await AuditLog.findByPk(requestId);
        if (!request || request.status !== 'pending') {
            return res.status(404).json({
                success: false,
                message: 'Request not found or already processed'
            });
        }

        switch (request.action) {
            case 'CREATE':
                await ProductCategory.create(request.new_values);
                break;
            case 'UPDATE':
                await ProductCategory.update(request.new_values, {
                    where: { id: request.entity_id }
                });
                break;
            case 'DELETE':
                await ProductCategory.destroy({
                    where: { id: request.entity_id }
                });
                break;
        }

        await request.update({
            status: 'approved',
            admin_comment
        });

        return res.status(200).json({
            success: true,
            message: 'Request approved and processed successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error processing request',
            error: error.message
        });
    }
};

const rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { admin_comment } = req.body;

        const request = await AuditLog.findByPk(requestId);
        if (!request || request.status !== 'pending') {
            return res.status(404).json({
                success: false,
                message: 'Request not found or already processed'
            });
        }

        await request.update({
            status: 'rejected',
            admin_comment
        });

        return res.status(200).json({
            success: true,
            message: 'Request rejected successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error rejecting request',
            error: error.message
        });
    }
};

module.exports = {
    getPendingRequests,
    approveRequest,
    rejectRequest
};
