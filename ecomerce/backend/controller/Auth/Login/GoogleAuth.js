const User = require('../../../model/UserModel');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const UAParser = require('ua-parser-js');
const { updateTrustedDevices } = require('../utils/deviceUtils');

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
            where: { email }
        });

        if (!user) {
            const initialTrustedDevice = [{
                ...deviceInfo,
                addedAt: new Date().toISOString()
            }];

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
                trustedDevices: JSON.stringify(initialTrustedDevice)
            });
        } else {
            await user.reload();
            
            const { updates } = await updateTrustedDevices(user, deviceInfo);
            
            if (!user.profile_picture && profilePictureBlob) {
                updates.profile_picture = profilePictureBlob;
            }

            await User.update(updates, {
                where: { id: user.id }
            });

            await user.reload();
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
            message: 'Google authentication failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
