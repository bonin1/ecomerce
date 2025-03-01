const Produkt = require('../../../model/ProduktModel');
const ProduktMedia = require('../../../model/ProduktMediaModel');
const AuditLog = require('../../../model/AuditLogModel');
const db = require('../../../database');

const uploadProductMedia = async (req, res) => {
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
        
        if (!req.file) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        const mediaCount = await ProduktMedia.count({
            where: { product_id: productId }
        });
        
        if (mediaCount >= 10) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Maximum of 10 media items per product is allowed'
            });
        }

        const isPrimary = req.body.isPrimary === 'true';
        if (isPrimary) {
            await Produkt.update(
                { product_primary_image: true },
                { where: { id: productId }, transaction: t }
            );
        }
        
        const media = await ProduktMedia.create({
            product_id: productId,
            media: req.file.buffer,
            media_type: req.file.mimetype,
            is_primary: isPrimary
        }, { transaction: t });

        await AuditLog.create({
            user_id: req.user.id,
            action: 'UPLOAD_MEDIA',
            entity_type: 'PRODUCT_MEDIA',
            entity_id: media.id,
            new_values: { productId, mediaType: req.file.mimetype },
            status: 'approved'
        }, { transaction: t });

        await t.commit();
        
        return res.status(201).json({
            success: true,
            message: 'Media uploaded successfully',
            data: {
                id: media.id,
                product_id: productId,
                media_type: req.file.mimetype,
                is_primary: isPrimary
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('Media upload error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error uploading media',
            error: error.message
        });
    }
};

const getProductMedia = async (req, res) => {
    try {
        const productId = req.params.id;
        
        const product = await Produkt.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        const media = await ProduktMedia.findAll({
            where: { product_id: productId }
        });
        
        const mediaWithBase64 = media.map(item => {
            let base64 = '';
            if (item.media) {
                base64 = Buffer.from(item.media).toString('base64');
            }
            
            return {
                id: item.id,
                product_id: item.product_id,
                media_type: item.media_type,
                is_primary: item.is_primary,
                media_data: `data:${item.media_type};base64,${base64}`,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            };
        });
        
        return res.status(200).json({
            success: true,
            data: mediaWithBase64
        });
    } catch (error) {
        console.error('Error fetching product media:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching product media',
            error: error.message
        });
    }
};

const deleteProductMedia = async (req, res) => {
    const t = await db.transaction();
    try {
        const { id: productId, mediaId } = req.params;
        
        const media = await ProduktMedia.findOne({
            where: { 
                id: mediaId,
                product_id: productId
            }
        });
        
        if (!media) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Media not found or does not belong to this product'
            });
        }
        
        await ProduktMedia.destroy({
            where: { id: mediaId },
            transaction: t
        });
        
        await AuditLog.create({
            user_id: req.user.id,
            action: 'DELETE_MEDIA',
            entity_type: 'PRODUCT_MEDIA',
            entity_id: mediaId,
            old_values: { productId, mediaId },
            status: 'approved'
        }, { transaction: t });
        
        await t.commit();
        
        return res.status(200).json({
            success: true,
            message: 'Media deleted successfully'
        });
    } catch (error) {
        await t.rollback();
        console.error('Error deleting media:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting media',
            error: error.message
        });
    }
};

module.exports = { uploadProductMedia, getProductMedia, deleteProductMedia };
