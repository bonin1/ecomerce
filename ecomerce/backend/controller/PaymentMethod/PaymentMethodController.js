const PaymentMethod = require('../../model/PaymentMethodsModel');
const ProductPaymentMethod = require('../../model/ProductPaymentMethodsModel');
const AuditLog = require('../../model/AuditLogModel');
const db = require('../../database');

// Get all payment methods
const getAllPaymentMethods = async (req, res) => {
    try {
        const paymentMethods = await PaymentMethod.findAll({
            order: [['display_order', 'ASC'], ['name', 'ASC']]
        });
        
        return res.status(200).json({
            success: true,
            data: paymentMethods
        });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching payment methods',
            error: error.message
        });
    }
};

// Get a single payment method by ID
const getPaymentMethodById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const paymentMethod = await PaymentMethod.findByPk(id);
        
        if (!paymentMethod) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: paymentMethod
        });
    } catch (error) {
        console.error('Error fetching payment method:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching payment method',
            error: error.message
        });
    }
};

// Create a new payment method
const createPaymentMethod = async (req, res) => {
    const t = await db.transaction();
    try {
        const {
            name, description, icon, is_active, 
            processing_time, fee_percentage, fee_fixed,
            min_amount, max_amount, display_order
        } = req.body;
        
        // Validate required fields
        if (!name) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Payment method name is required'
            });
        }
        
        // Create payment method
        const newPaymentMethod = await PaymentMethod.create({
            name,
            description,
            icon,
            is_active: is_active !== undefined ? is_active : true,
            processing_time,
            fee_percentage: fee_percentage ? parseFloat(fee_percentage) : null,
            fee_fixed: fee_fixed ? parseFloat(fee_fixed) : null,
            min_amount: min_amount ? parseFloat(min_amount) : null,
            max_amount: max_amount ? parseFloat(max_amount) : null,
            display_order: display_order || 999
        }, { transaction: t });
        
        // Log audit
        await AuditLog.create({
            user_id: req.user.id,
            action: 'CREATE',
            entity_type: 'PAYMENT_METHOD',
            entity_id: newPaymentMethod.id,
            new_values: req.body,
            status: 'approved'
        }, { transaction: t });
        
        await t.commit();
        
        return res.status(201).json({
            success: true,
            message: 'Payment method created successfully',
            data: newPaymentMethod
        });
    } catch (error) {
        await t.rollback();
        console.error('Error creating payment method:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating payment method',
            error: error.message
        });
    }
};

// Update a payment method
const updatePaymentMethod = async (req, res) => {
    const t = await db.transaction();
    try {
        const { id } = req.params;
        
        const paymentMethod = await PaymentMethod.findByPk(id);
        
        if (!paymentMethod) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }
        
        const oldValues = { ...paymentMethod.dataValues };
        
        const {
            name, description, icon, is_active, 
            processing_time, fee_percentage, fee_fixed,
            min_amount, max_amount, display_order
        } = req.body;
        
        await paymentMethod.update({
            name: name !== undefined ? name : paymentMethod.name,
            description: description !== undefined ? description : paymentMethod.description,
            icon: icon !== undefined ? icon : paymentMethod.icon,
            is_active: is_active !== undefined ? is_active : paymentMethod.is_active,
            processing_time: processing_time !== undefined ? processing_time : paymentMethod.processing_time,
            fee_percentage: fee_percentage !== undefined ? parseFloat(fee_percentage) : paymentMethod.fee_percentage,
            fee_fixed: fee_fixed !== undefined ? parseFloat(fee_fixed) : paymentMethod.fee_fixed,
            min_amount: min_amount !== undefined ? parseFloat(min_amount) : paymentMethod.min_amount,
            max_amount: max_amount !== undefined ? parseFloat(max_amount) : paymentMethod.max_amount,
            display_order: display_order !== undefined ? display_order : paymentMethod.display_order
        }, { transaction: t });
        
        // Log audit
        await AuditLog.create({
            user_id: req.user.id,
            action: 'UPDATE',
            entity_type: 'PAYMENT_METHOD',
            entity_id: id,
            old_values: oldValues,
            new_values: req.body,
            status: 'approved'
        }, { transaction: t });
        
        await t.commit();
        
        return res.status(200).json({
            success: true,
            message: 'Payment method updated successfully',
            data: paymentMethod
        });
    } catch (error) {
        await t.rollback();
        console.error('Error updating payment method:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating payment method',
            error: error.message
        });
    }
};

// Delete a payment method
const deletePaymentMethod = async (req, res) => {
    const t = await db.transaction();
    try {
        const { id } = req.params;
        
        const paymentMethod = await PaymentMethod.findByPk(id);
        
        if (!paymentMethod) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }
        
        // First remove any product associations
        await ProductPaymentMethod.destroy({
            where: { payment_method_id: id },
            transaction: t
        });
        
        // Log audit before deletion
        await AuditLog.create({
            user_id: req.user.id,
            action: 'DELETE',
            entity_type: 'PAYMENT_METHOD',
            entity_id: id,
            old_values: paymentMethod.dataValues,
            status: 'approved'
        }, { transaction: t });
        
        // Delete the payment method
        await paymentMethod.destroy({ transaction: t });
        
        await t.commit();
        
        return res.status(200).json({
            success: true,
            message: 'Payment method deleted successfully'
        });
    } catch (error) {
        await t.rollback();
        console.error('Error deleting payment method:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting payment method',
            error: error.message
        });
    }
};

// Get payment methods for a product
const getProductPaymentMethods = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const productPaymentMethods = await ProductPaymentMethod.findAll({
            where: { product_id: productId },
            include: [{ model: PaymentMethod }]
        });
        
        // Extract payment methods from junction
        const paymentMethods = productPaymentMethods.map(ppm => ppm.PaymentMethod);
        
        return res.status(200).json({
            success: true,
            data: paymentMethods
        });
    } catch (error) {
        console.error('Error fetching product payment methods:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching product payment methods',
            error: error.message
        });
    }
};

// Set payment methods for a product
const setProductPaymentMethods = async (req, res) => {
    const t = await db.transaction();
    try {
        const { productId } = req.params;
        const { paymentMethodIds } = req.body;
        
        if (!Array.isArray(paymentMethodIds)) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'paymentMethodIds must be an array'
            });
        }
        
        // Remove existing associations
        await ProductPaymentMethod.destroy({
            where: { product_id: productId },
            transaction: t
        });
        
        // Create new associations
        const associations = paymentMethodIds.map(methodId => ({
            product_id: productId,
            payment_method_id: methodId
        }));
        
        if (associations.length > 0) {
            await ProductPaymentMethod.bulkCreate(associations, { transaction: t });
        }
        
        // Log audit
        await AuditLog.create({
            user_id: req.user.id,
            action: 'UPDATE',
            entity_type: 'PRODUCT_PAYMENT_METHODS',
            entity_id: productId,
            new_values: { paymentMethodIds },
            status: 'approved'
        }, { transaction: t });
        
        await t.commit();
        
        return res.status(200).json({
            success: true,
            message: 'Product payment methods updated successfully',
            data: { productId, paymentMethodIds }
        });
    } catch (error) {
        await t.rollback();
        console.error('Error setting product payment methods:', error);
        return res.status(500).json({
            success: false,
            message: 'Error setting product payment methods',
            error: error.message
        });
    }
};

module.exports = {
    getAllPaymentMethods,
    getPaymentMethodById,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getProductPaymentMethods,
    setProductPaymentMethods
};
