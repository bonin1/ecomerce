const bcrypt = require('bcrypt');
const User = require('../../../model/UserModel');
const jwt = require('jsonwebtoken');
const UAParser = require('ua-parser-js');
const { sendNewDeviceLoginAlert, sendOTPEmail } = require('../../../services/emailServices');
const { Op } = require('sequelize');

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

const getDeviceFingerprint = (req) => {
    const parser = new UAParser(req.headers['user-agent']);
    const userAgent = parser.getResult();
    
    return {
        browser: userAgent.browser.name,
        os: userAgent.os.name,
        device: userAgent.device.type || 'desktop',
        ip: req.ip
    };
};

exports.login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        const user = await User.findOne({ 
            where: { email },
            attributes: { include: ['trustedDevices'] }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const deviceInfo = getDeviceFingerprint(req);
        const trustedDevices = user.trustedDevices || [];
        
        const isTrustedDevice = trustedDevices.some(device => 
            device.browser === deviceInfo.browser && 
            device.os === deviceInfo.os && 
            device.device === deviceInfo.device &&
            device.addedAt 
        );

        if (!isTrustedDevice) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

            await User.update({
                otp,
                otpExpires
            }, {
                where: { id: user.id }
            });

            await sendOTPEmail(user.email, otp);

            return res.status(200).json({
                success: true,
                requireOTP: true,
                message: 'OTP sent to email'
            });
        }

        const lastLoginDevice = user.last_login_device ? JSON.parse(user.last_login_device) : null;

        if (lastLoginDevice &&
            (lastLoginDevice.browser !== deviceInfo.browser ||
             lastLoginDevice.os !== deviceInfo.os ||
             lastLoginDevice.device !== deviceInfo.device)) {
            await sendNewDeviceLoginAlert(user.email, deviceInfo);
        }

        const accessToken = generateToken(user.id);

        await User.update({
            last_login_ip: deviceInfo.ip,
            last_login_device: JSON.stringify(deviceInfo)
        }, {
            where: { id: user.id }
        });

        if (rememberMe) {
            const rememberMeToken = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            res.cookie('rememberMeToken', rememberMeToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 30 * 24 * 3600000,
                path: '/'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                accessToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const deviceInfo = getDeviceFingerprint(req);

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        const user = await User.findOne({
            where: {
                email,
                otp,
                otpExpires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        const trustedDevices = user.trustedDevices || [];
        const deviceExists = trustedDevices.some(device => 
            device.browser === deviceInfo.browser && 
            device.os === deviceInfo.os && 
            device.device === deviceInfo.device
        );

        if (!deviceExists) {
            trustedDevices.push({
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                device: deviceInfo.device,
                ip: deviceInfo.ip,
                addedAt: new Date()
            });

            await User.update({
                trustedDevices,
                otp: null,
                otpExpires: null
            }, {
                where: { id: user.id }
            });
        }

        const accessToken = generateToken(user.id);

        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                accessToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.logout = async (req, res) => {
    res.clearCookie('rememberMeToken');
    return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};
