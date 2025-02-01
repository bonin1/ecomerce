const bcrypt = require('bcrypt');
const User = require('../../model/UserModel');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../../services/emailServices');
const { Op } = require('sequelize');

const generateAdminToken = (userId, role) => {
    return jwt.sign(
        { userId, role, isAdminToken: true },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: '4h' }
    );
};

exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ 
            where: { 
                email,
                role: { [Op.or]: ['admin', 'superadmin','staff'] }
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials or insufficient privileges'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); 

        await User.update({
            otp,
            otpExpires
        }, {
            where: { id: user.id }
        });

        await sendOTPEmail(user.email, otp);

        return res.status(200).json({
            success: true,
            message: 'OTP sent for verification',
            requireOTP: true,
            userId: user.id
        });

    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.verifyAdminOTP = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const user = await User.findOne({
            where: {
                id: userId,
                otp,
                otpExpires: { [Op.gt]: new Date() },
                role: { [Op.or]: ['admin', 'superadmin', 'staff'] }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        await User.update({
            otp: null,
            otpExpires: null
        }, {
            where: { id: user.id }
        });

        const adminToken = generateAdminToken(user.id, user.role);

        res.cookie('adminToken', adminToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 4 * 60 * 60 * 1000 
        });

        return res.status(200).json({
            success: true,
            message: 'Admin authentication successful',
            data: {
                token: adminToken, 
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.name
                }
            }
        });
    } catch (error) {
        console.error('Admin OTP verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.adminLogout = async (req, res) => {
    try {
        res.clearCookie('adminToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });
        
        return res.status(200).json({
            success: true,
            message: 'Admin logged out successfully'
        });
    } catch (error) {
        console.error('Admin logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during logout'
        });
    }
};
