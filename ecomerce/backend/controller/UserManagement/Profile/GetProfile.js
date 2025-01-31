const User = require('../../../model/UserModel');

exports.GetProfile = async (req, res) => {
    try {
        const username = req.params.username;

        const user = await User.findByPk(username, {
            attributes: { 
                exclude: ['password', 'two_factor_secret', 'passwordResetToken', 'passwordResetExpires', 'verificationToken', 'otp']
            }
        });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User profile not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error retrieving profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};