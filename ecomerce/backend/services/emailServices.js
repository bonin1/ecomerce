const transporter = require('../config/EmailConfig');
const fs = require('fs').promises;
const path = require('path');

exports.sendVerificationEmail = async (email, verificationToken) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationUrl = `${frontendUrl}/verify-email/verify?token=${verificationToken}`;
        
        let template = await fs.readFile(
            path.join(__dirname, '../template/VerificationEmailTemplate.html'),
            'utf8'
        );

        template = template
            .replace('#{VERIFICATION_URL}#', verificationUrl)
            .replace('#{LOGO_URL}#', `${process.env.BASE_URL}/static/image/STRIKETECH-1.png`)
            .replace('#{FACEBOOK_ICON}#', `${process.env.BASE_URL}/static/image/facebook.png`)
            .replace('#{TWITTER_ICON}#', `${process.env.BASE_URL}/static/image/twitter.png`)
            .replace('#{INSTAGRAM_ICON}#', `${process.env.BASE_URL}/static/image/instagram.png`)
            .replace('#{FACEBOOK_URL}#', process.env.FACEBOOK_URL || '#')
            .replace('#{TWITTER_URL}#', process.env.TWITTER_URL || '#')
            .replace('#{INSTAGRAM_URL}#', process.env.INSTAGRAM_URL || '#');

        const mailOptions = {
            from: {
                name: 'StrikeTech',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Verify Your Email - StrikeTech',
            html: template
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
};

exports.sendPasswordResetEmail = async (email, resetToken) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
        
        let template = await fs.readFile(
            path.join(__dirname, '../template/PasswordResetTemplate.html'),
            'utf8'
        );

        template = template
            .replace('#{RESET_URL}#', resetUrl)
            .replace('#{LOGO_URL}#', `${process.env.BASE_URL}/static/image/STRIKETECH-1.png`);

        const mailOptions = {
            from: {
                name: 'StrikeTech',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Password Reset Request - StrikeTech',
            html: template
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
};

exports.sendNewDeviceLoginAlert = async (email, deviceInfo) => {
    try {
        let template = await fs.readFile(
            path.join(__dirname, '../template/NewDeviceLoginTemplate.html'),
            'utf8'
        );

        template = template
            .replace('#{DEVICE_INFO}#', `${deviceInfo.browser} on ${deviceInfo.os}`)
            .replace('#{IP_ADDRESS}#', deviceInfo.ip)
            .replace('#{LOGIN_TIME}#', new Date().toLocaleString());

        const mailOptions = {
            from: {
                name: 'StrikeTech',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'New Device Login Detected - StrikeTech',
            html: template
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
};

exports.sendOTPEmail = async (email, otp) => {
    try {
        let template = await fs.readFile(
            path.join(__dirname, '../template/OTPEmailTemplate.html'),
            'utf8'
        );

        template = template
            .replace('#{OTP_CODE}#', otp)
            .replace('#{LOGO_URL}#', `${process.env.BASE_URL}/static/image/STRIKETECH-1.png`);

        const mailOptions = {
            from: {
                name: 'StrikeTech',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Your Login OTP Code - StrikeTech',
            html: template
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('OTP Email sending error:', error);
        return false;
    }
};
