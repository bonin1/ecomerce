const User = require('../../../model/UserModel');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../../../services/emailServices');

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.render('verifyEmail', { 
                error: 'Verification token is required',
                email: req.query.email
            });
        }

        const user = await User.findOne({
            where: {
                verificationToken: token,
                verified: false
            }
        });

        if (!user) {
            return res.render('verifyEmail', { 
                error: 'Invalid verification token or account already verified',
                email: req.query.email
            });
        }

        await user.update({
            verified: true,
            verificationToken: null,
            verificationExpires: null
        });

        req.session.verificationSuccess = true;
        req.session.verifiedEmail = user.email;

        return res.redirect('/verification-success');

    } catch (error) {
        console.error('Email verification error:', error);
        return res.render('verifyEmail', { 
            error: 'An error occurred during verification',
            email: req.query.email
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

        if (user.lastEmailSentAt && 
            (new Date() - new Date(user.lastEmailSentAt)) < 5 * 60 * 1000) {
            return res.status(429).json({
                success: false,
                message: 'Please wait 5 minutes before requesting another verification email'
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
