const bcrypt = require('bcrypt');
const User = require('../../../model/UserModel');
const { sendPasswordResetEmail, sendNewDeviceLoginAlert } = require('../../../services/emailServices');
const crypto = require('crypto');

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Add password validation
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
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        await User.update({
            passwordResetToken: hashedToken,
            passwordResetExpires: new Date(Date.now() + 3600000) // 1 hour
        }, { where: { id: user.id } });

        await sendPasswordResetEmail(user.email, resetToken);

        return res.status(200).json({
            success: true,
            message: 'Password reset link sent to email'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error processing request' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
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

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.update({
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null
        }, { where: { id: user.id } });

        return res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error resetting password' });
    }
};
