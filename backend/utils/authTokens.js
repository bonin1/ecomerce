const jwt = require('jsonwebtoken');

function getRefreshSecret() {
    return process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET || 'dev'}.refresh`;
}

function generateAccessToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '24h' });
}

function generateRefreshToken(userId) {
    return jwt.sign({ userId, typ: 'refresh' }, getRefreshSecret(), {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    });
}

function cookieBaseOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        path: '/',
    };
}

/**
 * Sets httpOnly session + refresh cookies (and optional remember-me cookie).
 */
function setAuthCookies(res, user, accessToken, rememberMe) {
    const opts = cookieBaseOptions();
    res.cookie('refreshToken', generateRefreshToken(user.id), {
        ...opts,
        maxAge: 30 * 24 * 3600000,
    });
    res.cookie('sessionToken', accessToken, {
        ...opts,
        maxAge: 24 * 3600000,
    });
    if (rememberMe) {
        const rememberMeToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        res.cookie('rememberMeToken', rememberMeToken, {
            ...opts,
            maxAge: 30 * 24 * 3600000,
        });
    }
}

function clearAuthCookies(res) {
    const opts = cookieBaseOptions();
    for (const name of ['rememberMeToken', 'sessionToken', 'refreshToken']) {
        res.clearCookie(name, opts);
    }
}

module.exports = {
    getRefreshSecret,
    generateAccessToken,
    generateRefreshToken,
    cookieBaseOptions,
    setAuthCookies,
    clearAuthCookies,
};
