const User = require('../../../model/UserModel');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { logUserActivity } = require('./ActivityLogOperations');

exports.setupTwoFactor = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const secret = speakeasy.generateSecret({
            name: `StrikeTech:${req.user.email}`
        });
        
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        
        await User.update({
            two_factor_secret: secret.base32, 
            two_factor_enabled: false
        }, {
            where: { id: userId }
        });
        
        res.status(200).json({
            status: 'success',
            message: '2FA setup initiated',
            data: {
                qrCodeUrl: qrCodeUrl,
                secret: secret.base32 
            }
        });
    } catch (error) {
        console.error('2FA Setup Error:', error);
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
        
        const user = await User.findByPk(userId);
        
        if (!user.two_factor_secret) {
            return res.status(400).json({
                status: 'error',
                message: '2FA setup not initiated'
            });
        }
        
        // Verify the token
        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: token
        });
        
        if (!verified) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid verification code'
            });
        }
        
        await User.update({
            two_factor_enabled: true
        }, {
            where: { id: userId }
        });
        
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
        res.status(500).json({
            status: 'error',
            message: 'Error enabling two-factor authentication',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.disableTwoFactor = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password, token } = req.body;
        
        if (!password) {
            return res.status(400).json({
                status: 'error',
                message: 'Password is required to disable 2FA'
            });
        }
        
        const user = await User.findByPk(userId);
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid password'
            });
        }
        
        if (user.two_factor_enabled) {
            if (!token) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Verification code is required to disable 2FA'
                });
            }
            
            const verified = speakeasy.totp.verify({
                secret: user.two_factor_secret,
                encoding: 'base32',
                token: token
            });
            
            if (!verified) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid verification code'
                });
            }
        }
        
        await User.update({
            two_factor_enabled: false,
            two_factor_secret: null
        }, {
            where: { id: userId }
        });
        
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
        const user = await User.findByPk(userId);
        
        res.status(200).json({
            status: 'success',
            data: {
                enabled: user.two_factor_enabled
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error retrieving two-factor authentication status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
