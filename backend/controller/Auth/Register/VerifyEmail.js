const User = require('../../../model/UserModel');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../../../services/emailServices');

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        const user = await User.findOne({
            where: {
                verificationToken: token,
                verified: false
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid token or account already verified'
            });
        }

        await user.update({
            verified: true,
            verificationToken: null,
            verificationExpires: null
        });

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during verification'
        });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({
            where: {
                email,
                verified: false
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found or already verified'
            });
        }

        // Change cooldown period to 30 seconds
        if (user.lastEmailSentAt && 
            (new Date() - new Date(user.lastEmailSentAt)) < 30 * 1000) {
            return res.status(429).json({
                success: false,
                message: 'Please wait 30 seconds before requesting another verification email'
            });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await user.update({
            verificationToken,
            verificationExpires,
            lastEmailSentAt: new Date()
        });

        const emailSent = await sendVerificationEmail(email, verificationToken);

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Verification email sent successfully'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
