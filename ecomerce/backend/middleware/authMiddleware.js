const jwt = require('jsonwebtoken');
const User = require('../model/UserModel');
const { isTokenBlacklisted } = require('../controller/Auth/Login/LoginSystem');

exports.authenticate = async (req, res, next) => {
    try {
        let token;
        
        if (req.cookies.sessionToken) {
            token = req.cookies.sessionToken;
        } else if (req.cookies.rememberMeToken) {
            token = req.cookies.rememberMeToken;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No authorization token provided' 
            });
        }

        if (isTokenBlacklisted(token)) {
            return res.status(401).json({
                success: false,
                message: 'Token is no longer valid'
            });
        }

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid or expired token' 
            });
        }

        const user = await User.findByPk(decoded.userId || decoded.id);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication failed',
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access'
            });
        }
        next();
    };
};

exports.isAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin rights required.'
        });
    }
    next();
};

exports.isAdminOrStaff = async (req, res, next) => {
    if (!['admin', 'staff','superadmin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin or Staff rights required.'
        });
    }
    next();
};
