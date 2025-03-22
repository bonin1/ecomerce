const jwt = require('jsonwebtoken');
const User = require('../model/UserModel');
const { isTokenBlacklisted } = require('../controller/Auth/Login/LoginSystem');

exports.authenticate = async (req, res, next) => {
    try {
        let token;
        let isAdminRequest = false;
        let tokenSecret = process.env.JWT_SECRET;
        
        if (req.path.startsWith('/admin') || req.baseUrl.startsWith('/admin')) {
            isAdminRequest = true;
            tokenSecret = process.env.ADMIN_JWT_SECRET;
        }
        
        if (req.cookies.sessionToken) {
            token = req.cookies.sessionToken;
        } else if (req.cookies.rememberMeToken) {
            token = req.cookies.rememberMeToken;
        } else if (req.cookies.adminToken) {
            token = req.cookies.adminToken;
            isAdminRequest = true;
            tokenSecret = process.env.ADMIN_JWT_SECRET;
        } 
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
            try {
                const decoded = jwt.decode(token);
                if (decoded && decoded.isAdminToken) {
                    isAdminRequest = true;
                    tokenSecret = process.env.ADMIN_JWT_SECRET;
                }
            } catch (error) {
                console.error('Token decode error:', error);
            }
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

        let decoded;
        try {
            decoded = jwt.verify(token, tokenSecret);
        } catch (error) {
            try {
                const alternativeSecret = isAdminRequest ? process.env.JWT_SECRET : process.env.ADMIN_JWT_SECRET;
                decoded = jwt.verify(token, alternativeSecret);
                isAdminRequest = !isAdminRequest;
            } catch (fallbackError) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid or expired token' 
                });
            }
        }

        const userId = decoded.userId || decoded.id;
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const tokenExp = decoded.exp;
        const currentTime = Math.floor(Date.now() / 1000);
    
        if (tokenExp && (tokenExp - currentTime < 3600)) {
            const newToken = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                tokenSecret,
                { expiresIn: '24h' }
            );
            
            res.cookie(isAdminRequest ? 'adminToken' : 'sessionToken', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                path: '/',
                maxAge: 24 * 3600000 // 24 hours
            });
        }

        req.user = user;
        req.isAdminRequest = isAdminRequest;
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
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in.'
        });
    }
    
    if (!['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin rights required.'
        });
    }
    next();
};

exports.isAdminOrStaff = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in.'
        });
    }
    
    if (!['admin', 'staff','superadmin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin or Staff rights required.'
        });
    }
    next();
};
