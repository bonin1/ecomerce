const express = require('express');
const router = express.Router();
const fileUpload = require('express-fileupload');
const { authenticate } = require('../middleware/authMiddleware');

const getCareer = require('../controller/career/getCareer');
const careerCRUD = require('../controller/career/CRUDoperationsCareer');
const applicationManagement = require('../controller/career/CareerApplicationManagement');

const careerValidator = require('../middleware/validations/CareerValidator');

const fileUploadMiddleware = fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 },
    abortOnLimit: true,
    responseOnLimit: 'File size is too large (max 10MB)',
    createParentPath: true,
    useTempFiles: false, 
    safeFileNames: true,
    preserveExtension: true
});

// Public routes for viewing careers
router.get('/listings', getCareer.getAllCareers);
router.get('/listings/:id', careerValidator.validateId, getCareer.getCareerById);

// Job application submission
router.post(
    '/apply/:careerId', 
    fileUploadMiddleware, 
    careerValidator.validateCareerApplication,
    applicationManagement.submitApplication
);

// Admin routes protected by auth and admin middleware
router.post(
    '/create', 
    authenticate,
    careerValidator.validateCareerData,
    careerCRUD.createCareer
);

router.put(
    '/update/:id', 
    authenticate,
    careerValidator.validateId,
    careerValidator.validateCareerData,
    careerCRUD.updateCareer
);

router.delete(
    '/delete/:id', 
    authenticate,
    careerValidator.validateId,
    careerCRUD.deleteCareer
);

router.post(
    '/bulk-create', 
    authenticate,
    careerCRUD.bulkCreateCareers
);

router.put(
    '/bulk-update-status', 
    authenticate,
    careerCRUD.bulkUpdateCareerStatus
);

router.get(
    '/applications', 
    authenticate,
    getCareer.getAllApplications
);

router.get(
    '/applications/:id', 
    authenticate,
    careerValidator.validateId,
    getCareer.getApplicationById
);

router.put(
    '/applications/:applicationId/status', 
    authenticate,
    careerValidator.validateApplicationStatusUpdate,
    applicationManagement.updateApplicationStatus
);

router.put(
    '/applications/bulk-update-status', 
    authenticate,
    applicationManagement.bulkUpdateApplicationStatus
);

router.get(
    '/applications/:applicationId/download', 
    authenticate,
    applicationManagement.downloadApplicationFile
);

router.get(
    '/stats', 
    authenticate,
    getCareer.getCareerStats
);

module.exports = router;
