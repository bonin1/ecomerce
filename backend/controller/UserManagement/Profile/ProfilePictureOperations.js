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

        const profilePictureBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        res.status(200).json({
            status: 'success',
            message: 'Profile picture updated successfully',
            data: { profile_picture: profilePictureBase64 }
        });
    } catch (error) {
        console.error('Profile picture update error:', error);
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
