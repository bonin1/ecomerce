const bcrypt = require('bcrypt');
const User = require('../../../model/UserModel');
const { sendPasswordResetEmail, sendNewDeviceLoginAlert } = require('../../../services/emailServices');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { logUserActivity } = require('../../UserManagement/Profile/ActivityLogOperations');

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 8 characters long' 
            });
        }

        const user = await User.findByPk(userId);
        if (!await bcrypt.compare(currentPassword, user.password)) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.update({ password: hashedPassword }, { where: { id: userId } });

        await logUserActivity(
            userId,
            'PASSWORD_CHANGE',
            { message: 'Password changed successfully' },
            req.ip,
            req.headers['user-agent']
        );

        return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error updating password' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            return res.status(200).json({ 
                success: true, 
                message: 'If an account exists, a password reset link will be sent to this email' 
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        await User.update({
            passwordResetToken: hashedToken,
            passwordResetExpires: new Date(Date.now() + 600000) 
        }, { where: { id: user.id } });

        await sendPasswordResetEmail(user.email, resetToken);

        await logUserActivity(
            user.id,
            'PASSWORD_RESET_REQUEST',
            { message: 'Password reset requested' },
            req.ip,
            req.headers['user-agent']
        );

        return res.status(200).json({
            success: true,
            message: 'If an account exists, a password reset link will be sent to this email'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ success: false, message: 'Error processing request' });
    }
};

exports.verifyResetToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: 'Token is required' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        
        const user = await User.findOne({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        return res.status(200).json({ success: true, message: 'Token is valid' });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(500).json({ success: false, message: 'Error verifying token' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 8 characters long' 
            });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or expired reset link' 
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.update({
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null
        }, { where: { id: user.id } });

        await logUserActivity(
            user.id,
            'PASSWORD_RESET_COMPLETED',
            { message: 'Password reset successfully' },
            req.ip,
            req.headers['user-agent']
        );

        return res.status(200).json({ 
            success: true, 
            message: 'Password reset successful' 
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error resetting password' 
        });
    }
};
