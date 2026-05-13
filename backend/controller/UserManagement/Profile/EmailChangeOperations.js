const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const transporter = require('../../../config/EmailConfig');
const User = require('../../../model/UserModel');
const { validateEmail } = require('../../../utils/validation');
const { Op } = require('sequelize');

const getEmailTemplate = async () => {
    const templatePath = path.join(__dirname, '../../../template/EmailChangeTemplate.html');
    const template = await fs.readFile(templatePath, 'utf8');
    return template;
};

exports.initiateEmailChange = async (req, res) => {
    try {
        const userId = req.user.id;
        const { newEmail } = req.body;
        
        if (!validateEmail(newEmail)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email format'
            });
        }

        const user = await User.findByPk(userId);
        const token = crypto.randomBytes(32).toString('hex');
        
        await User.update({
            emailChangeToken: token,
            newEmail: newEmail,
            emailChangeExpires: new Date(Date.now() + 3600000) // 1 hour
        }, {
            where: { id: userId }
        });

        const template = await getEmailTemplate();
        const verificationLink = `${process.env.FRONTEND_URL}/profile/email/verify/${token}`;
        
        const emailContent = template
            .replace('#{LOGO_URL}#', process.env.LOGO_URL)
            .replace('#{NEW_EMAIL}#', newEmail)
            .replace('#{VERIFICATION_LINK}#', verificationLink);

        await transporter.sendMail({
            to: user.email,
            subject: 'Confirm Email Change',
            html: emailContent
        });

        res.status(200).json({
            status: 'success',
            message: 'Verification email sent'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error initiating email change',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.confirmEmailChange = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({
            where: {
                emailChangeToken: token,
                emailChangeExpires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid or expired token'
            });
        }

        await User.update({
            email: user.newEmail,
            emailChangeToken: null,
            newEmail: null,
            emailChangeExpires: null
        }, {
            where: { id: user.id }
        });

        res.status(200).json({
            status: 'success',
            message: 'Email updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error confirming email change',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
