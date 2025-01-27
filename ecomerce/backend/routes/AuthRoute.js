const express = require('express');
const router = express.Router();
const LoginSystem = require('../../../controller/Auth/Login/LoginSystem');
const { register } = require('../../../controller/Auth/Register/Register');
const { verifyEmail, resendVerification } = require('../../../controller/Auth/Register/VerifyEmail');

router.post('/register', register);
router.post('/login', LoginSystem.login);
router.post('/logout', LoginSystem.logout);

router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

module.exports = router;