const crypto = require('crypto');
const transporter = require('../../../config/EmailConfig');
const User = require('../../../model/UserModel');
const { validateEmail, validatePhone } = require('../../../utils/validation');

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updateData = req.body;

        delete updateData.password;
        delete updateData.role;
        delete updateData.verified;
        delete updateData.two_factor_secret;

        if (updateData.email && !validateEmail(updateData.email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email format'
            });
        }

        if (updateData.phone_number && !validatePhone(updateData.phone_number)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid phone number format'
            });
        }

        const updatedUser = await User.update(updateData, {
            where: { id: userId },
            returning: true
        });

        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error updating profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.deleteProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        await User.update({
            marked_for_deletion: true,
            deletion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }, {
            where: { id: userId }
        });

        res.status(200).json({
            status: 'success',
            message: 'Profile marked for deletion. Will be permanently deleted in 30 days.'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error deleting profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.reactivateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        await User.update({
            marked_for_deletion: false,
            deletion_date: null
        }, {
            where: { id: userId }
        });

        res.status(200).json({
            status: 'success',
            message: 'Profile reactivated successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error reactivating profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};