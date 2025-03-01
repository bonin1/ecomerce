const Produkt = require('../../../model/ProduktModel');
const ProduktMedia = require('../../../model/ProduktMediaModel');
const ProduktAdditionalDetails = require('../../../model/ProduktAdditionalDetails');
const AuditLog = require('../../../model/AuditLogModel');
const db = require('../../../database');
const ProductCategory = require('../../../model/ProductCategoryModel');

const createProduct = async (req, res) => {
    const t = await db.transaction();
    try {
        const { product, additionalDetails } = req.body;
        
        // Validate required fields
        if (!product.product_name || !product.product_description || 
            !product.product_price || !product.product_brand || 
            !product.product_category_id) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields' 
            });
        }

        // Check if category exists
        const category = await ProductCategory.findByPk(product.product_category_id);
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID. Category does not exist.'
            });
        }

        // Handle different roles - admin creates directly, staff requests approval
        if (req.user.role === 'admin' || req.user.role === 'superadmin') {
            // Direct creation for admin
            const newProduct = await Produkt.create({
                ...product,
                product_price: Number(product.product_price),
                product_stock: Number(product.product_stock),
                product_category_id: Number(product.product_category_id),
                // Parse discount fields if they exist
                product_discount_price: product.product_discount_price ? Number(product.product_discount_price) : null,
                product_discount_percentage: product.product_discount_percentage ? Number(product.product_discount_percentage) : null
            }, { transaction: t });

            // Create additional details if provided
            if (additionalDetails) {
                await ProduktAdditionalDetails.create({
                    ...additionalDetails,
                    product_id: newProduct.id,
                    product_weight: additionalDetails.product_weight ? Number(additionalDetails.product_weight) : null
                }, { transaction: t });
            }

            // Log the action
            await AuditLog.create({
                user_id: req.user.id,
                action: 'CREATE',
                entity_type: 'PRODUCT',
                entity_id: newProduct.id,
                new_values: { product, additionalDetails },
                status: 'approved'
            }, { transaction: t });

            await t.commit();

            const completeProduct = await getCompleteProductData(newProduct.id);
            return res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: completeProduct
            });
        } else {
            // Create audit log for approval for non-admin users
            const auditLog = await AuditLog.create({
                user_id: req.user.id,
                action: 'CREATE',
                entity_type: 'PRODUCT',
                entity_id: 0,
                new_values: { product, additionalDetails },
                status: 'pending'
            }, { transaction: t });

            await t.commit();
            
            return res.status(201).json({
                success: true,
                message: 'Product creation request submitted for approval',
                data: auditLog
            });
        }
    } catch (error) {
        await t.rollback();
        console.error('Product creation error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Error creating product',
            error: error.message 
        });
    }
};

const updateProduct = async (req, res) => {
    const t = await db.transaction();
    try {
        const { product, additionalDetails } = req.body;
        const productId = req.params.id;

        // Verify product exists
        const existingProduct = await Produkt.findByPk(productId);
        if (!existingProduct) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Handle different roles
        if (req.user.role === 'admin' || req.user.role === 'superadmin') {
            // Direct update for admin
            await Produkt.update({
                ...product,
                product_price: product.product_price ? Number(product.product_price) : existingProduct.product_price,
                product_stock: product.product_stock !== undefined ? Number(product.product_stock) : existingProduct.product_stock,
                product_discount_price: product.product_discount_price ? Number(product.product_discount_price) : null,
                product_discount_percentage: product.product_discount_percentage ? Number(product.product_discount_percentage) : null
            }, { 
                where: { id: productId },
                transaction: t 
            });

            // Update additional details if provided
            if (additionalDetails) {
                const existingDetails = await ProduktAdditionalDetails.findOne({
                    where: { product_id: productId }
                });

                if (existingDetails) {
                    await ProduktAdditionalDetails.update({
                        ...additionalDetails,
                        product_weight: additionalDetails.product_weight ? Number(additionalDetails.product_weight) : null
                    }, {
                        where: { product_id: productId },
                        transaction: t
                    });
                } else {
                    await ProduktAdditionalDetails.create({
                        ...additionalDetails,
                        product_id: productId,
                        product_weight: additionalDetails.product_weight ? Number(additionalDetails.product_weight) : null
                    }, { transaction: t });
                }
            }

            // Log the action
            await AuditLog.create({
                user_id: req.user.id,
                action: 'UPDATE',
                entity_type: 'PRODUCT',
                entity_id: productId,
                old_values: existingProduct.dataValues,
                new_values: { product, additionalDetails },
                status: 'approved'
            }, { transaction: t });

            await t.commit();

            const updatedProduct = await getCompleteProductData(productId);
            return res.status(200).json({
                success: true,
                message: 'Product updated successfully',
                data: updatedProduct
            });
        } else {
            // Create audit log for approval for non-admin users
            const auditLog = await AuditLog.create({
                user_id: req.user.id,
                action: 'UPDATE',
                entity_type: 'PRODUCT',
                entity_id: productId,
                old_values: existingProduct.dataValues,
                new_values: { product, additionalDetails },
                status: 'pending'
            }, { transaction: t });

            await t.commit();
            
            return res.status(200).json({
                success: true,
                message: 'Product update request submitted for approval',
                data: auditLog
            });
        }
    } catch (error) {
        await t.rollback();
        console.error('Product update error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
};

const deleteProduct = async (req, res) => {
    const t = await db.transaction();
    try {
        const productId = req.params.id;
        const product = await Produkt.findByPk(productId);
        
        if (!product) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (req.user.role === 'admin' || req.user.role === 'superadmin') {
            // First delete related records
            await ProduktAdditionalDetails.destroy({
                where: { product_id: productId },
                transaction: t
            });

            await ProduktMedia.destroy({
                where: { product_id: productId },
                transaction: t
            });

            // Then delete the product
            await Produkt.destroy({
                where: { id: productId },
                transaction: t
            });

            // Log the action
            await AuditLog.create({
                user_id: req.user.id,
                action: 'DELETE',
                entity_type: 'PRODUCT',
                entity_id: productId,
                old_values: product.dataValues,
                status: 'approved'
            }, { transaction: t });

            await t.commit();
            
            return res.status(200).json({
                success: true,
                message: 'Product deleted successfully'
            });
        } else {
            // Create audit log for approval
            const auditLog = await AuditLog.create({
                user_id: req.user.id,
                action: 'DELETE',
                entity_type: 'PRODUCT',
                entity_id: productId,
                old_values: product.dataValues,
                status: 'pending'
            }, { transaction: t });

            await t.commit();
            
            return res.status(200).json({
                success: true,
                message: 'Product deletion request submitted for approval',
                data: auditLog
            });
        }
    } catch (error) {
        await t.rollback();
        console.error('Product deletion error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
};

// Helper function to get complete product data
async function getCompleteProductData(productId) {
    try {
        const product = await Produkt.findByPk(productId);
        if (!product) return null;

        const details = await ProduktAdditionalDetails.findOne({
            where: { product_id: productId }
        });
        
        const media = await ProduktMedia.findAll({
            where: { product_id: productId }
        });
        
        const category = await ProductCategory.findByPk(product.product_category_id);

        return {
            ...product.dataValues,
            additional_details: details ? details.dataValues : null,
            media: media.length > 0 ? media.map(m => m.dataValues) : [],
            category: category ? category.dataValues : null
        };
    } catch (error) {
        console.error('Error fetching complete product data:', error);
        return null;
    }
}

module.exports = { createProduct, updateProduct, deleteProduct };
