const User = require('../../../model/UserModel');

exports.updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No file uploaded'
            });
        }

        const userId = req.user.id;
        
        await User.update({
            profile_picture: req.file.buffer
        }, {
            where: { id: userId }
        });

        res.status(200).json({
            status: 'success',
            message: 'Profile picture updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error updating profile picture',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.deleteProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;
        
        await User.update({
            profile_picture: null
        }, {
            where: { id: userId }
        });

        res.status(200).json({
            status: 'success',
            message: 'Profile picture deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error deleting profile picture',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
