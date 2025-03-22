const CareersModel = require('../../model/CareersModel');
const CareerApplicationModel = require('../../model/CareerApplicationModel');
const { Op } = require('sequelize');
const db = require('../../database');

exports.createCareer = async (req, res) => {
    try {
        const { title, description, location, salary, status = 'active' } = req.body;
        
        const newCareer = await CareersModel.create({
            title,
            description,
            location,
            salary,
            status
        });
        
        return res.status(201).json({
            success: true,
            message: 'Career created successfully',
            data: newCareer
        });
    } catch (error) {
        console.error('Error creating career:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.updateCareer = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, location, salary, status } = req.body;
        
        const career = await CareersModel.findByPk(id);
        
        if (!career) {
            return res.status(404).json({
                success: false,
                message: 'Career not found'
            });
        }
        
        await career.update({
            title,
            description,
            location,
            salary,
            status
        });
        
        return res.status(200).json({
            success: true,
            message: 'Career updated successfully',
            data: career
        });
    } catch (error) {
        console.error('Error updating career:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.deleteCareer = async (req, res) => {
    const transaction = await db.transaction();
    
    try {
        const { id } = req.params;
        
        const career = await CareersModel.findByPk(id);
        
        if (!career) {
            return res.status(404).json({
                success: false,
                message: 'Career not found'
            });
        }
        
        const applicationCount = await CareerApplicationModel.count({
            where: { career_id: id }
        });
        
        if (applicationCount > 0) {
            await CareerApplicationModel.destroy({
                where: { career_id: id },
                transaction
            });
        }
        
        await career.destroy({ transaction });
        
        await transaction.commit();
        
        return res.status(200).json({
            success: true,
            message: 'Career and related applications deleted successfully'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting career:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.bulkCreateCareers = async (req, res) => {
    try {
        const { careers } = req.body;
        
        if (!Array.isArray(careers) || careers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input: careers must be a non-empty array'
            });
        }
        
        for (const career of careers) {
            if (!career.title || !career.description || !career.location) {
                return res.status(400).json({
                    success: false,
                    message: 'Each career must have title, description, and location'
                });
            }
        }
        
        const createdCareers = await CareersModel.bulkCreate(careers);
        
        return res.status(201).json({
            success: true,
            message: `${createdCareers.length} careers created successfully`,
            data: createdCareers
        });
    } catch (error) {
        console.error('Error bulk creating careers:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.bulkUpdateCareerStatus = async (req, res) => {
    try {
        const { careerIds, status } = req.body;
        
        if (!Array.isArray(careerIds) || careerIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input: careerIds must be a non-empty array'
            });
        }
        
        if (!status || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status: must be either active or inactive'
            });
        }
        
        const [updatedCount] = await CareersModel.update(
            { status },
            { where: { id: { [Op.in]: careerIds } } }
        );
        
        return res.status(200).json({
            success: true,
            message: `${updatedCount} careers updated to ${status} status`
        });
    } catch (error) {
        console.error('Error bulk updating careers:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
