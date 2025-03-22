const CareersModel = require('../../model/CareersModel');
const CareerApplicationModel = require('../../model/CareerApplicationModel');
const { Op } = require('sequelize');

exports.getAllCareers = async (req, res) => {
    try {
        const { status, location, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        const whereClause = {};
        
        if (status) {
            whereClause.status = status;
        }
        
        if (location) {
            whereClause.location = { [Op.like]: `%${location}%` };
        }
        
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }
        
        const { count, rows: careers } = await CareersModel.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']]
        });
        
        return res.status(200).json({
            success: true,
            data: careers,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Error fetching careers:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.getCareerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const career = await CareersModel.findByPk(id);
        
        if (!career) {
            return res.status(404).json({
                success: false,
                message: 'Career not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: career
        });
    } catch (error) {
        console.error('Error fetching career:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.getAllApplications = async (req, res) => {
    try {
        const { status, careerId, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        const whereClause = {};
        
        if (status) {
            whereClause.status = status;
        }
        
        if (careerId) {
            whereClause.career_id = careerId;
        }
        
        const { count, rows: applications } = await CareerApplicationModel.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['resume', 'cover_letter'] },
            include: [
                {
                    model: CareersModel,
                    attributes: ['title', 'location', 'description'],
                    as: 'career'
                }
            ]
        });
        
        return res.status(200).json({
            success: true,
            data: applications,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const application = await CareerApplicationModel.findByPk(id, {
            include: [
                {
                    model: CareersModel,
                    attributes: ['title', 'location', 'description'],
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
        
        let responseData = application.toJSON();
        if (responseData.resume) {
            responseData.resume = responseData.resume.toString('base64');
        }
        
        if (responseData.cover_letter) {
            responseData.cover_letter = responseData.cover_letter.toString('base64');
        }
        
        return res.status(200).json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('Error fetching application:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.getCareerStats = async (req, res) => {
    try {
        const totalCareers = await CareersModel.count();
        const activeCareers = await CareersModel.count({ where: { status: 'active' } });
        
        const totalApplications = await CareerApplicationModel.count();
        const pendingApplications = await CareerApplicationModel.count({ where: { status: 'pending' } });
        const approvedApplications = await CareerApplicationModel.count({ where: { status: 'approved' } });
        const rejectedApplications = await CareerApplicationModel.count({ where: { status: 'rejected' } });
        
        return res.status(200).json({
            success: true,
            data: {
                careers: {
                    total: totalCareers,
                    active: activeCareers,
                    inactive: totalCareers - activeCareers
                },
                applications: {
                    total: totalApplications,
                    pending: pendingApplications,
                    approved: approvedApplications,
                    rejected: rejectedApplications
                }
            }
        });
    } catch (error) {
        console.error('Error fetching career stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
