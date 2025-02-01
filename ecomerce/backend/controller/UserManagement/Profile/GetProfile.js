const User = require('../../../model/UserModel');

exports.GetProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByPk(userId, {
            attributes: { 
                exclude: ['password', 'two_factor_secret', 'passwordResetToken', 
                        'passwordResetExpires', 'verificationToken', 'otp', 'otpExpires']
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        const userData = user.toJSON();
        if (userData.profile_picture) {
            userData.profile_picture = `data:image/jpeg;base64,${userData.profile_picture.toString('base64')}`;
        }

        res.status(200).json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error('Profile retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};