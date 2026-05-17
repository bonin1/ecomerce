const AuditLog = require('../../model/AuditLogModel');
const ProductCategory = require('../../model/ProductCategoryModel');
const Produkt = require('../../model/ProduktModel');
const ProduktAdditionalDetails = require('../../model/ProduktAdditionalDetails');
const ProduktMedia = require('../../model/ProduktMediaModel');
const db = require('../../database');

function stripProductPayload(src) {
    const safe = { ...(src || {}) };
    delete safe.id;
    delete safe.media;
    delete safe.category;
    delete safe.additional_details;
    delete safe.createdAt;
    delete safe.updatedAt;
    return safe;
}

const getPendingRequests = async (req, res) => {
    try {
        const pendingRequests = await AuditLog.findAll({
            where: { status: 'pending' },
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json({
            success: true,
            data: pendingRequests,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching pending requests',
            error: error.message,
        });
    }
};

const approveRequest = async (req, res) => {
    const t = await db.transaction();
    try {
        const { requestId } = req.params;
        const { admin_comment } = req.body;

        const request = await AuditLog.findByPk(requestId, {
            transaction: t,
            lock: t.LOCK.UPDATE,
        });
        if (!request || request.status !== 'pending') {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Request not found or already processed',
            });
        }

        const entityType = request.entity_type;
        let patchEntityId = request.entity_id;

        if (entityType === 'CATEGORY') {
            switch (request.action) {
                case 'CREATE': {
                    const created = await ProductCategory.create(request.new_values, { transaction: t });
                    patchEntityId = created.id;
                    break;
                }
                case 'UPDATE':
                    await ProductCategory.update(request.new_values, {
                        where: { id: request.entity_id },
                        transaction: t,
                    });
                    break;
                case 'DELETE':
                    await ProductCategory.destroy({
                        where: { id: request.entity_id },
                        transaction: t,
                    });
                    break;
                default:
                    await t.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Unsupported action for category: ${request.action}`,
                    });
            }
        } else if (entityType === 'PRODUCT') {
            switch (request.action) {
                case 'CREATE': {
                    const nv = request.new_values || {};
                    const safeProduct = stripProductPayload(nv.product);
                    if (
                        !safeProduct.product_name ||
                        !safeProduct.product_description ||
                        safeProduct.product_price === undefined ||
                        !safeProduct.product_brand ||
                        !safeProduct.product_category_id
                    ) {
                        await t.rollback();
                        return res.status(400).json({
                            success: false,
                            message: 'Product request is missing required fields',
                        });
                    }
                    const category = await ProductCategory.findByPk(safeProduct.product_category_id, {
                        transaction: t,
                    });
                    if (!category) {
                        await t.rollback();
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid category on pending product request',
                        });
                    }
                    const newProduct = await Produkt.create(
                        {
                            ...safeProduct,
                            listing_status:
                                safeProduct.listing_status === 'draft' ||
                                safeProduct.listing_status === 'published'
                                    ? safeProduct.listing_status
                                    : 'published',
                            product_price: Number(safeProduct.product_price),
                            product_stock: Number(safeProduct.product_stock),
                            product_category_id: Number(safeProduct.product_category_id),
                            product_discount_price: safeProduct.product_discount_price
                                ? Number(safeProduct.product_discount_price)
                                : null,
                            product_discount_percentage: safeProduct.product_discount_percentage
                                ? Number(safeProduct.product_discount_percentage)
                                : null,
                        },
                        { transaction: t }
                    );
                    if (nv.additionalDetails) {
                        await ProduktAdditionalDetails.create(
                            {
                                ...nv.additionalDetails,
                                product_id: newProduct.id,
                                product_weight: nv.additionalDetails.product_weight
                                    ? Number(nv.additionalDetails.product_weight)
                                    : null,
                            },
                            { transaction: t }
                        );
                    }
                    patchEntityId = newProduct.id;
                    break;
                }
                case 'UPDATE': {
                    const nv = request.new_values || {};
                    const safeProduct = stripProductPayload(nv.product);
                    const productId = request.entity_id;
                    const existingProduct = await Produkt.findByPk(productId, { transaction: t });
                    if (!existingProduct) {
                        await t.rollback();
                        return res.status(404).json({
                            success: false,
                            message: 'Product no longer exists',
                        });
                    }
                    await Produkt.update(
                        {
                            ...safeProduct,
                            ...(safeProduct.listing_status === 'draft' ||
                            safeProduct.listing_status === 'published'
                                ? { listing_status: safeProduct.listing_status }
                                : {}),
                            product_price: safeProduct.product_price
                                ? Number(safeProduct.product_price)
                                : existingProduct.product_price,
                            product_stock:
                                safeProduct.product_stock !== undefined
                                    ? Number(safeProduct.product_stock)
                                    : existingProduct.product_stock,
                            product_discount_price: safeProduct.product_discount_price
                                ? Number(safeProduct.product_discount_price)
                                : null,
                            product_discount_percentage: safeProduct.product_discount_percentage
                                ? Number(safeProduct.product_discount_percentage)
                                : null,
                        },
                        {
                            where: { id: productId },
                            transaction: t,
                        }
                    );
                    if (nv.additionalDetails) {
                        const existingDetails = await ProduktAdditionalDetails.findOne({
                            where: { product_id: productId },
                            transaction: t,
                        });
                        if (existingDetails) {
                            await ProduktAdditionalDetails.update(
                                {
                                    ...nv.additionalDetails,
                                    product_weight: nv.additionalDetails.product_weight
                                        ? Number(nv.additionalDetails.product_weight)
                                        : null,
                                },
                                {
                                    where: { product_id: productId },
                                    transaction: t,
                                }
                            );
                        } else {
                            await ProduktAdditionalDetails.create(
                                {
                                    ...nv.additionalDetails,
                                    product_id: productId,
                                    product_weight: nv.additionalDetails.product_weight
                                        ? Number(nv.additionalDetails.product_weight)
                                        : null,
                                },
                                { transaction: t }
                            );
                        }
                    }
                    break;
                }
                case 'DELETE': {
                    const productId = request.entity_id;
                    await ProduktAdditionalDetails.destroy({
                        where: { product_id: productId },
                        transaction: t,
                    });
                    await ProduktMedia.destroy({
                        where: { product_id: productId },
                        transaction: t,
                    });
                    await Produkt.destroy({
                        where: { id: productId },
                        transaction: t,
                    });
                    break;
                }
                default:
                    await t.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Unsupported action for product: ${request.action}`,
                    });
            }
        } else {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `Unsupported entity type for approval: ${entityType}`,
            });
        }

        await request.update(
            {
                status: 'approved',
                admin_comment,
                entity_id: patchEntityId,
            },
            { transaction: t }
        );

        await t.commit();
        return res.status(200).json({
            success: true,
            message: 'Request approved and processed successfully',
        });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({
            success: false,
            message: 'Error processing request',
            error: error.message,
        });
    }
};

const rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { admin_comment } = req.body;

        const request = await AuditLog.findByPk(requestId);
        if (!request || request.status !== 'pending') {
            return res.status(404).json({
                success: false,
                message: 'Request not found or already processed',
            });
        }

        await request.update({
            status: 'rejected',
            admin_comment,
        });

        return res.status(200).json({
            success: true,
            message: 'Request rejected successfully',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error rejecting request',
            error: error.message,
        });
    }
};

module.exports = {
    getPendingRequests,
    approveRequest,
    rejectRequest,
};
