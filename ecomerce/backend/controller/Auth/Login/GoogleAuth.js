const User = require('../../../model/UserModel');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const UAParser = require('ua-parser-js');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

exports.googleAuth = async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, given_name, family_name, picture } = payload;
        const deviceInfo = getDeviceFingerprint(req);

        let profilePictureBlob = null;
        if (picture) {
            try {
                const response = await axios.get(picture, { responseType: 'arraybuffer' });
                profilePictureBlob = Buffer.from(response.data);
            } catch (error) {
                console.error('Error fetching profile picture:', error);
            }
        }

        let user = await User.findOne({ 
            where: { email },
            attributes: { include: ['trustedDevices'] }
        });

        if (!user) {
            user = await User.create({
                email,
                name: given_name || 'User',
                lastname: family_name || '',
                verified: true,
                password: null,
                role: 'user',
                profile_picture: profilePictureBlob,
                last_login_ip: deviceInfo.ip,
                last_login_device: JSON.stringify(deviceInfo),
                trustedDevices: JSON.stringify([{
                    ...deviceInfo,
                    addedAt: new Date()
                }])
            });
        } else {
            const updates = {
                last_login_ip: deviceInfo.ip,
                last_login_device: JSON.stringify(deviceInfo)
            };

            if (!user.profile_picture && profilePictureBlob) {
                updates.profile_picture = profilePictureBlob;
            }

            let trustedDevices = [];
            try {
                trustedDevices = JSON.parse(user.trustedDevices || '[]');
            } catch (e) {
                console.error('Error parsing trustedDevices:', e);
                trustedDevices = [];
            }

            if (!Array.isArray(trustedDevices)) {
                trustedDevices = [];
            }

            const deviceExists = trustedDevices.some(device => 
                device.browser === deviceInfo.browser && 
                device.os === deviceInfo.os && 
                device.device === deviceInfo.device
            );

            if (!deviceExists) {
                trustedDevices.push({
                    ...deviceInfo,
                    addedAt: new Date()
                });
                updates.trustedDevices = JSON.stringify(trustedDevices);
            }

            await user.update(updates);
        }

        const accessToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            success: true,
            message: 'Google authentication successful',
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
        console.error('Google auth error:', error);
        return res.status(500).json({
            success: false,
            message: 'Google authentication failed'
        });
    }
};
