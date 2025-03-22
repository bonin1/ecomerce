const CareerApplicationModel = require('../../model/CareerApplicationModel');
const CareersModel = require('../../model/CareersModel');
const emailService = require('../../services/emailServices');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;

exports.submitApplication = async (req, res) => {
    try {
        const { careerId } = req.params;
        
        console.log('Application submission received:');
        console.log('Request body:', req.body);
        console.log('Form fields:', Object.keys(req.body));
        console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
        
        const { name, email, phone } = req.body;
        
        let resumeData = null;
        let coverLetterData = null;
        
        const career = await CareersModel.findOne({
            where: {
                id: careerId,
                status: 'active'
            }
        });
        
        if (!career) {
            return res.status(404).json({
                success: false,
                message: 'Job position not found or inactive'
            });
        }
        
        if (req.files) {
            if (req.files.resume) {
                const resumeFile = req.files.resume;
                console.log('Resume file details:', {
                    name: resumeFile.name,
                    size: resumeFile.size,
                    mimetype: resumeFile.mimetype
                });
                
                const validTypes = ['.pdf', '.doc', '.docx'];
                const resumeExt = path.extname(resumeFile.name).toLowerCase();
                
                if (!validTypes.includes(resumeExt)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Resume must be a PDF or DOC/DOCX file',
                        errors: [{ param: 'resume', msg: 'Resume must be a PDF or DOC/DOCX file' }]
                    });
                }
                
                resumeData = resumeFile.data;
            }
            
            if (req.files.cover_letter) {
                const coverLetterFile = req.files.cover_letter;
                console.log('Cover letter file details:', {
                    name: coverLetterFile.name,
                    size: coverLetterFile.size,
                    mimetype: coverLetterFile.mimetype
                });
                
                const validTypes = ['.pdf', '.doc', '.docx'];
                const coverLetterExt = path.extname(coverLetterFile.name).toLowerCase();
                
                if (!validTypes.includes(coverLetterExt)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cover letter must be a PDF or DOC/DOCX file',
                        errors: [{ param: 'cover_letter', msg: 'Cover letter must be a PDF or DOC/DOCX file' }]
                    });
                }
                
                coverLetterData = coverLetterFile.data;
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Resume file is required',
                errors: [{ param: 'resume', msg: 'No files were uploaded' }]
            });
        }
        
        const application = await CareerApplicationModel.create({
            career_id: careerId,
            name,
            email,
            phone,
            resume: resumeData,
            cover_letter: coverLetterData,
            status: 'pending'
        });
        
        try {
            await emailService.sendJobApplicationConfirmationEmail(email, {
                name,
                jobTitle: career.title,
                jobLocation: career.location
            });
        } catch (emailError) {
            console.error('Error sending application confirmation email:', emailError);
        }
        
        return res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: {
                id: application.id,
                name: application.name,
                email: application.email,
                status: application.status,
                createdAt: application.createdAt
            }
        });
    } catch (error) {
        console.error('Error submitting application:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status, feedbackNote } = req.body;
        
        const application = await CareerApplicationModel.findByPk(applicationId, {
            include: [
                {
                    model: CareersModel,
                    attributes: ['title', 'location'],
                    as: 'career'
                }
            ]
        });
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        
        await application.update({ status });
        
        if (status === 'approved' || status === 'rejected') {
            await emailService.sendApplicationStatusUpdateEmail(application.email, {
                name: application.name,
                jobTitle: application.career.title,
                status,
                feedbackNote: feedbackNote || ''
            });
        }
        
        return res.status(200).json({
            success: true,
            message: `Application status updated to ${status}`,
            data: {
                id: application.id,
                status: application.status,
                updatedAt: application.updatedAt
            }
        });
    } catch (error) {
        console.error('Error updating application status:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.bulkUpdateApplicationStatus = async (req, res) => {
    try {
        const { applicationIds, status } = req.body;
        
        if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input: applicationIds must be a non-empty array'
            });
        }
        
        if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status: must be pending, approved, or rejected'
            });
        }
        
        const [updatedCount] = await CareerApplicationModel.update(
            { status },
            { where: { id: { [Op.in]: applicationIds } } }
        );
        
        if (status === 'approved' || status === 'rejected') {
            const applications = await CareerApplicationModel.findAll({
                where: { id: { [Op.in]: applicationIds } },
                include: [
                    {
                        model: CareersModel,
                        attributes: ['title'],
                        as: 'career'
                    }
                ]
            });
            
            const emailPromises = applications.map(application => 
                emailService.sendApplicationStatusUpdateEmail(application.email, {
                    name: application.name,
                    jobTitle: application.career.title,
                    status,
                    feedbackNote: 'Your application has been processed as part of a batch update.'
                })
            );
            
            await Promise.all(emailPromises);
        }
        
        return res.status(200).json({
            success: true,
            message: `${updatedCount} applications updated to ${status} status`
        });
    } catch (error) {
        console.error('Error bulk updating applications:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.downloadApplicationFile = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { fileType } = req.query;
        
        if (req.query.token && !req.headers.authorization) {
            req.headers.authorization = `Bearer ${req.query.token}`;
        }
        
        if (!fileType || !['resume', 'coverLetter'].includes(fileType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type specified'
            });
        }
        
        const application = await CareerApplicationModel.findByPk(applicationId);
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        
        let fileData;
        let fileName;
        let contentType = 'application/pdf';
        
        if (fileType === 'resume') {
            fileData = application.resume;
            fileName = `${application.name.replace(/\s+/g, '_')}_Resume`;
        } else {
            fileData = application.cover_letter;
            fileName = `${application.name.replace(/\s+/g, '_')}_CoverLetter`;
        }
        
        if (!fileData) {
            return res.status(404).json({
                success: false,
                message: `No ${fileType === 'resume' ? 'resume' : 'cover letter'} found for this application`
            });
        }
        
        // Set headers for proper download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.pdf"`);
        res.setHeader('Content-Length', fileData.length);
        
        return res.send(fileData);
    } catch (error) {
        console.error('Error downloading file:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
