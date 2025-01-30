const express = require('express');
const router = express.Router();
const LoginSystem = require('../controller/Auth/Login/LoginSystem');
const { register } = require('../controller/Auth/Register/Register');
const { verifyEmail, resendVerification } = require('../controller/Auth/Register/VerifyEmail');
const { changePassword, forgotPassword, resetPassword } = require('../controller/Auth/Password/Password');
const {authenticate} = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', LoginSystem.login);
router.post('/logout', LoginSystem.logout);

router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

router.post('/verify-otp', LoginSystem.verifyOTP);

router.post('/change-password', authenticate, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;