const transporter = require('../ecomerce/backend/config/EmailConfig');
const fs = require('fs').promises;
const path = require('path');

exports.sendVerificationEmail = async (email, verificationToken) => {
    try {
        const verificationUrl = `${process.env.BASE_URL}/auth/verify-email?token=${verificationToken}`;
        
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
