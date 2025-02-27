const express = require('express');
const router = express.Router();
const { GetProfile } = require('../controller/UserManagement/Profile/GetProfile');
const { updateProfile, deleteProfile, reactivateProfile } = require('../controller/UserManagement/Profile/CRUDoperations');
const { updateProfilePicture, deleteProfilePicture } = require('../controller/UserManagement/Profile/ProfilePictureOperations');
const { initiateEmailChange, confirmEmailChange } = require('../controller/UserManagement/Profile/EmailChangeOperations');
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
router.post('/profile/email/confirm/:token', authenticate, confirmEmailChange);

module.exports = router;
