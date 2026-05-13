const { body, param, validationResult } = require('express-validator');

exports.validateCareerData = [
    body('title')
        .notEmpty().withMessage('Job title is required')
        .isLength({ min: 3, max: 255 }).withMessage('Job title must be between 3 and 255 characters'),
    
    body('description')
        .notEmpty().withMessage('Job description is required')
        .isLength({ min: 50 }).withMessage('Job description must be at least 50 characters'),
    
    body('location')
        .notEmpty().withMessage('Job location is required')
        .isLength({ min: 2, max: 255 }).withMessage('Location must be between 2 and 255 characters'),
    
    body('salary')
        .optional()
        .isLength({ max: 255 }).withMessage('Salary information must be less than 255 characters'),
    
    body('status')
        .isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

exports.validateCareerApplication = [
    (req, res, next) => {
        
        const { name, email, phone } = req.body || {};
        
        const errors = [];
        
        if (!name || name.trim() === '') {
            errors.push({ 
                param: 'name', 
                msg: 'Name is required',
                location: 'body' 
            });
        } else if (name.length < 2 || name.length > 255) {
            errors.push({ 
                param: 'name', 
                msg: 'Name must be between 2 and 255 characters',
                location: 'body' 
            });
        }
        
        if (!email || email.trim() === '') {
            errors.push({ 
                param: 'email', 
                msg: 'Email is required',
                location: 'body' 
            });
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errors.push({ 
                    param: 'email', 
                    msg: 'Must provide a valid email address',
                    location: 'body' 
                });
            }
        }
        
        if (!phone || phone.trim() === '') {
            errors.push({ 
                param: 'phone', 
                msg: 'Phone number is required',
                location: 'body'
            });
        } else {
            const phoneRegex = /^\+?[0-9\s\-()]{8,20}$/;
            if (!phoneRegex.test(phone)) {
                errors.push({ 
                    param: 'phone', 
                    msg: 'Please provide a valid phone number',
                    location: 'body'
                });
            }
        }
        
        if (errors.length > 0) {
            console.log('Text field validation errors:', errors);
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
        
        if (!req.files || !req.files.resume) {
                        return res.status(400).json({
                success: false,
                message: 'Resume is required',
                errors: [{ param: 'resume', msg: 'Resume file is required' }]
            });
        }
        
        next();
    }
];

exports.validateApplicationStatusUpdate = [
    body('status')
        .isIn(['pending', 'approved', 'rejected']).withMessage('Status must be pending, approved, or rejected'),
    
    param('applicationId')
        .isInt().withMessage('Invalid application ID'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

exports.validateId = [
    param('id')
        .isInt().withMessage('Invalid ID parameter'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
