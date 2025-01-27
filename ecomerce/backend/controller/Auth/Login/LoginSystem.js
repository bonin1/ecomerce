const bcrypt = require('bcrypt');
const User = require('../../../model/UserModel');
const jwt = require('jsonwebtoken');
const UAParser = require('ua-parser-js');

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
        const user = await User.findOne({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const deviceInfo = getDeviceFingerprint(req);
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
                maxAge: 30 * 24 * 3600000, // 30 days
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

exports.logout = async (req, res) => {
    res.clearCookie('rememberMeToken');
    return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};
