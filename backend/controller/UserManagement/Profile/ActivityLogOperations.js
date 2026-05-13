const UserActivityLog = require('../../../model/UserActivityLogModel');

exports.logUserActivity = async (userId, activityType, details = {}, ipAddress = null, userAgent = null) => {
    try {
        await UserActivityLog.create({
            user_id: userId,
            activity_type: activityType,
            details: JSON.stringify(details),
            ip_address: ipAddress,
            user_agent: userAgent
        });
        return true;
    } catch (error) {
        console.error('Error logging activity:', error);
        return false;
    }
};

exports.getUserActivityLog = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const activities = await UserActivityLog.findAndCountAll({
            where: { user_id: userId },
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        
        const parsedActivities = activities.rows.map(activity => {
            const item = activity.toJSON();
            try {
                item.details = JSON.parse(item.details);
            } catch (e) {
                item.details = {};
            }
            return item;
        });
        
        res.status(200).json({
            status: 'success',
            data: {
                activities: parsedActivities,
                totalCount: activities.count,
                totalPages: Math.ceil(activities.count / limit),
                currentPage: page
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error retrieving activity log',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
