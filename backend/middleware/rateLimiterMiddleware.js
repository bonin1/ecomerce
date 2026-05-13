const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');

exports.loginLimiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'login_limit:'
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: {
        success: false,
        message: 'Too many login attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

exports.apiLimiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'api_limit:'
    }),
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests'
    }
});
