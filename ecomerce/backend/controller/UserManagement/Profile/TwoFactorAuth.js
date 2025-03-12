const User = require('../../../model/UserModel');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { logUserActivity } = require('./ActivityLogOperations');

exports.setupTwoFactor = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        
        // Generate a new secret
        const secret = speakeasy.generateSecret({
            name: `${process.env.APP_NAME || 'EcommerceApp'}:${user.email}`
        });
        
        // Save the secret to the user
        await User.update({
            two_factor_secret: secret.base32
        }, {
            where: { id: userId }
        });
        
        // Generate QR code
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
        
        res.status(200).json({
            status: 'success',
            data: {
                secret: secret.base32,
                qrCode: qrCodeUrl
            }
        });
    } catch (error) {
        console.error('Error setting up 2FA:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error setting up two-factor authentication',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.verifyAndEnableTwoFactor = async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                status: 'error',
                message: 'Verification token is required'
            });
        }
        
        const user = await User.findByPk(userId);
        
        if (!user || !user.two_factor_secret) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found or two-factor authentication not set up'
            });
        }
        
        // Verify the token
        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: token,
            window: 1 // Allow 1 time step window (30 seconds)
        });
        
        if (!verified) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid verification code'
            });
        }
        
        // Enable 2FA
        await User.update({
            two_factor_enabled: true
        }, {
            where: { id: userId }
        });
        
        // Log activity
        await logUserActivity(
            userId, 
            'SECURITY_CHANGE', 
            { message: 'Two-factor authentication enabled' },
            req.ip,
            req.headers['user-agent']
        );
        
        res.status(200).json({
            status: 'success',
            message: 'Two-factor authentication enabled successfully'
        });
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error verifying two-factor authentication',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.disableTwoFactor = async (req, res) => {
    try {
        const userId = req.user.id;
        
        await User.update({
            two_factor_enabled: false,
            two_factor_secret: null
        }, {
            where: { id: userId }
        });
        
        // Log activity
        await logUserActivity(
            userId, 
            'SECURITY_CHANGE', 
            { message: 'Two-factor authentication disabled' },
            req.ip,
            req.headers['user-agent']
        );
        
        res.status(200).json({
            status: 'success',
            message: 'Two-factor authentication disabled successfully'
        });
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error disabling two-factor authentication',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getTwoFactorStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findByPk(userId, {
            attributes: ['two_factor_enabled']
        });
        
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: {
                enabled: user.two_factor_enabled
            }
        });
    } catch (error) {
        console.error('Error getting 2FA status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error retrieving two-factor authentication status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
