const { logUserActivity } = require('../controller/UserManagement/Profile/ActivityLogOperations');

const logActivity = (activityType, detailsProvider = null) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(body) {
            try {
                const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
                
                if (req.user && req.user.id && (res.statusCode >= 200 && res.statusCode < 300) && parsedBody.status === 'success') {
                    const details = detailsProvider ? detailsProvider(req, parsedBody) : { message: 'Activity performed successfully' };
                    
                    logUserActivity(
                        req.user.id,
                        activityType,
                        details,
                        req.ip,
                        req.headers['user-agent']
                    ).catch(err => console.error('Error logging activity:', err));
                }
            } catch (error) {
                console.error('Error in activity logging middleware:', error);
            }
            
            return originalSend.call(this, body);
        };
        
        next();
    };
};

module.exports = { logActivity };
