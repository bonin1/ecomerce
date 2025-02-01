const ProductCategory = require('../../../model/ProductCategoryModel');
const AuditLog = require('../../../model/AuditLogModel');

const createCategory = async (req, res) => {
    try {
        const { product_category } = req.body;
        
        if (!product_category) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        if (req.user.role === 'admin') {
            const newCategory = await ProductCategory.create({ product_category });
            
            await AuditLog.create({
                user_id: req.user.id,
                action: 'CREATE',
                entity_type: 'CATEGORY',
                entity_id: newCategory.id,
                new_values: { product_category },
                status: 'approved'
            });

            return res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: newCategory
            });
        } else {
            const auditLog = await AuditLog.create({
                user_id: req.user.id,
                action: 'CREATE',
                entity_type: 'CATEGORY',
                entity_id: 0,
                new_values: { product_category },
                status: 'pending'
            });

            return res.status(201).json({
                success: true,
                message: 'Category creation request submitted for approval',
                data: auditLog
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error processing category operation',
            error: error.message
        });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { product_category } = req.body;

        const category = await ProductCategory.findByPk(id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        if (req.user.role === 'admin') {
            await category.update({ product_category });

            await AuditLog.create({
                user_id: req.user.id,
                action: 'UPDATE',
                entity_type: 'CATEGORY',
                entity_id: id,
                old_values: { product_category: category.product_category },
                new_values: { product_category },
                status: 'approved'
            });

            return res.status(200).json({
                success: true,
                message: 'Category updated successfully',
                data: category
            });
        } else {
            const auditLog = await AuditLog.create({
                user_id: req.user.id,
                action: 'UPDATE',
                entity_type: 'CATEGORY',
                entity_id: id,
                old_values: { product_category: category.product_category },
                new_values: { product_category },
                status: 'pending'
            });

            return res.status(200).json({
                success: true,
                message: 'Category update request submitted for approval',
                data: auditLog
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error processing category operation',
            error: error.message
        });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await ProductCategory.findByPk(id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        if (req.user.role === 'admin') {
            await category.destroy();

            await AuditLog.create({
                user_id: req.user.id,
                action: 'DELETE',
                entity_type: 'CATEGORY',
                entity_id: id,
                old_values: { product_category: category.product_category },
                status: 'approved'
            });

            return res.status(200).json({
                success: true,
                message: 'Category deleted successfully'
            });
        } else {
            const auditLog = await AuditLog.create({
                user_id: req.user.id,
                action: 'DELETE',
                entity_type: 'CATEGORY',
                entity_id: id,
                old_values: { product_category: category.product_category },
                status: 'pending'
            });

            return res.status(200).json({
                success: true,
                message: 'Category deletion request submitted for approval',
                data: auditLog
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error processing category operation',
            error: error.message
        });
    }
};

module.exports = {
    createCategory,
    updateCategory,
    deleteCategory
};
