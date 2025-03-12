const express = require('express');
const router = express.Router();
const { GetProfile } = require('../controller/UserManagement/Profile/GetProfile');
const { updateProfile, deleteProfile, reactivateProfile } = require('../controller/UserManagement/Profile/CRUDoperations');
const { updateProfilePicture, deleteProfilePicture } = require('../controller/UserManagement/Profile/ProfilePictureOperations');
const { initiateEmailChange, confirmEmailChange } = require('../controller/UserManagement/Profile/EmailChangeOperations');
const { changeProfilePassword } = require('../controller/UserManagement/Profile/PasswordChangeOperation');
const { getUserActivityLog } = require('../controller/UserManagement/Profile/ActivityLogOperations');
const { setupTwoFactor, verifyAndEnableTwoFactor, disableTwoFactor, getTwoFactorStatus } = require('../controller/UserManagement/Profile/TwoFactorAuth');
const { exportUserData } = require('../controller/UserManagement/Profile/ExportDataController');
const upload = require('../config/UploadConfig');
const {authenticate} = require('../middleware/authMiddleware');

// Profile routes
router.get('/profile', authenticate, GetProfile);
router.put('/profile/update', authenticate, updateProfile);
router.delete('/profile/delete', authenticate, deleteProfile);
router.post('/profile/reactivate', authenticate, reactivateProfile);

// Profile picture routes
router.put('/profile/picture', authenticate, upload.single('profile_picture'), updateProfilePicture);
router.delete('/profile/picture', authenticate, deleteProfilePicture);

// Email change routes
router.post('/profile/email/verify', authenticate, initiateEmailChange);
router.post('/profile/email/confirm/:token', confirmEmailChange);

// Password management
router.post('/profile/password/change', authenticate, changeProfilePassword);

// Activity log
router.get('/profile/activity', authenticate, getUserActivityLog);

// Two-factor authentication
router.post('/profile/2fa/setup', authenticate, setupTwoFactor);
router.post('/profile/2fa/verify', authenticate, verifyAndEnableTwoFactor);
router.post('/profile/2fa/disable', authenticate, disableTwoFactor);
router.get('/profile/2fa/status', authenticate, getTwoFactorStatus);

// Data export
router.post('/profile/export', authenticate, exportUserData);

module.exports = router;
