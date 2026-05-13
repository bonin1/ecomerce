const updateTrustedDevices = async (user, deviceInfo) => {
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
    }

    const updates = {
        last_login_ip: deviceInfo.ip,
        last_login_device: JSON.stringify(deviceInfo),
        trustedDevices: JSON.stringify(trustedDevices)
    };

    return { updates, deviceExists };
};

module.exports = { updateTrustedDevices };
