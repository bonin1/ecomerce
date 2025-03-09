const jwt = require('jsonwebtoken');
const User = require('../model/UserModel');

exports.authenticateAdmin = async (req, res, next) => {
    try {
        let token;
        
        if (req.cookies.adminToken) {
            token = req.cookies.adminToken;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No admin authorization token provided' 
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
            
            if (!decoded.isAdminToken) {
                throw new Error('Not an admin token');
            }
        } catch (error) {
            console.error('Admin token verification failed:', error.message);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid or expired admin token' 
            });
        }

        const user = await User.findByPk(decoded.userId);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Admin user not found' 
            });
        }

        if (!['admin', 'superadmin', 'staff'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient privileges.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Admin auth middleware error:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Admin authentication failed',
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
