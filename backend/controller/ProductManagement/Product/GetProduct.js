const Produkt = require('../../../model/ProduktModel');
const ProduktAdditionalDetails = require('../../../model/ProduktAdditionalDetails');
const ProduktMedia = require('../../../model/ProduktMediaModel');
const ProductCategory = require('../../../model/ProductCategoryModel');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

function adminPanelRoleFromRequest(req) {
    const h = req.headers?.authorization;
    if (!h || !h.startsWith('Bearer ')) return null;
    try {
        const t = h.slice(7);
        const d = jwt.verify(t, process.env.ADMIN_JWT_SECRET);
        if (!d?.isAdminToken) return null;
        return String(d.role || '').toLowerCase();
    } catch {
        return null;
    }
}

const ALLOWED_SORT_FIELDS = [
    'createdAt',
    'updatedAt',
    'product_price',
    'product_name',
    'product_stock',
    'product_brand',
];

const getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = 'createdAt',
            order = 'DESC',
            category,
            search,
            min_price,
            max_price,
            brand,
            stock,
            low_stock,
            discount_only,
            created_after,
            ending_soon,
        } = req.query;

        const whereConditions = {};
        
        if (search) {
            const term = `%${search}%`;
            whereConditions[Op.or] = [
                { product_name: { [Op.like]: term } },
                { product_description: { [Op.like]: term } },
                { product_brand: { [Op.like]: term } },
            ];
        }
        
        if (category) {
            whereConditions.product_category_id = category;
        }
        
        if (min_price || max_price) {
            whereConditions.product_price = {};
            if (min_price) whereConditions.product_price[Op.gte] = min_price;
            if (max_price) whereConditions.product_price[Op.lte] = max_price;
        }
        
        if (brand) {
            whereConditions.product_brand = { [Op.like]: `%${brand}%` };
        }

        if (stock === 'in') {
            whereConditions.product_stock = { ...(whereConditions.product_stock || {}), [Op.gt]: 0 };
        } else if (stock === 'out') {
            whereConditions.product_stock = { ...(whereConditions.product_stock || {}), [Op.lte]: 0 };
        }

        if (low_stock !== undefined && low_stock !== '' && String(stock) !== 'out') {
            const n = parseInt(low_stock, 10);
            if (!Number.isNaN(n) && n >= 0) {
                whereConditions.product_stock = { [Op.gt]: 0, [Op.lte]: n };
            }
        }

        if (String(discount_only) === '1' || String(discount_only).toLowerCase() === 'true') {
            whereConditions.product_discount_active = true;
        }

        if (String(ending_soon) === '1' || String(ending_soon).toLowerCase() === 'true') {
            const now = new Date();
            const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            whereConditions.product_discount_active = true;
            whereConditions.product_discount_end = {
                [Op.and]: [{ [Op.ne]: null }, { [Op.gte]: now }, { [Op.lte]: horizon }],
            };
        }

        if (created_after) {
            const d = new Date(`${created_after}T00:00:00.000Z`);
            if (!Number.isNaN(d.getTime())) {
                whereConditions.createdAt = { ...(whereConditions.createdAt || {}), [Op.gte]: d };
            }
        }

        const adminRole = adminPanelRoleFromRequest(req);
        if (!adminRole || !['admin', 'superadmin', 'staff', 'moderator'].includes(adminRole)) {
            whereConditions.listing_status = 'published';
        }

        const sortField = ALLOWED_SORT_FIELDS.includes(String(sort)) ? String(sort) : 'createdAt';
        const orderDir = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;
        
        const { count, rows: products } = await Produkt.findAndCountAll({
            where: whereConditions,
            limit: limitNum,
            offset,
            order: [[sortField, orderDir]]
        });

        const categoryIds = [...new Set(products.map(product => product.product_category_id))];
        
        const categories = categoryIds.length > 0 
            ? await ProductCategory.findAll({
                where: { id: categoryIds }
              }) 
            : [];
            
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.id] = cat;
        });

        const productsWithDetails = await Promise.all(products.map(async (product) => {
            const additionalDetails = await ProduktAdditionalDetails.findOne({
                where: { product_id: product.id }
            });
            
            const category = categoryMap[product.product_category_id] || null;
            
            const media = await ProduktMedia.findAll({
                where: { product_id: product.id }
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
                    media_data: `data:${item.media_type};base64,${base64}`
                };
            });
            
            return {
                ...product.dataValues,
                additional_details: additionalDetails ? additionalDetails.dataValues : null,
                category: category ? category.dataValues : null,
                media: mediaWithBase64
            };
        }));

        return res.status(200).json({
            success: true,
            data: productsWithDetails,
            pagination: {
                total: count,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(count / limitNum) || 1
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
};

// Get a single product by ID with all details
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get the product
        const product = await Produkt.findByPk(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const adminRole = adminPanelRoleFromRequest(req);
        if (
            product.listing_status === 'draft' &&
            (!adminRole || !['admin', 'superadmin', 'staff', 'moderator'].includes(adminRole))
        ) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Get additional details
        const additionalDetails = await ProduktAdditionalDetails.findOne({
            where: { product_id: id }
        });
        
        // Get media files
        const mediaItems = await ProduktMedia.findAll({
            where: { product_id: id }
        });
        
        const media = mediaItems
            .filter(item => item.media && Buffer.isBuffer(item.media) && item.media.length > 0)
            .map(item => {
                try {
                    const base64 = Buffer.from(item.media).toString('base64');
                    if (!base64 || base64.length === 0) {
                        return null;
                    }
                    
                    return {
                        id: item.id,
                        product_id: item.product_id,
                        media_type: item.media_type || 'image/png',
                        is_primary: Boolean(item.is_primary),
                        media_data: `data:${item.media_type || 'image/png'};base64,${base64}`,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt
                    };
                } catch (err) {
                    console.error(`Error processing media ${item.id}:`, err);
                    return null;
                }
            })
            .filter(item => item !== null);
        
        const category = await ProductCategory.findByPk(product.product_category_id);
        
        const completeProduct = {
            ...product.dataValues,
            additional_details: additionalDetails ? additionalDetails.dataValues : null,
            media: media,
            category: category ? category.dataValues : null
        };
        
        return res.status(200).json({
            success: true,
            data: completeProduct
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching product details',
            error: error.message
        });
    }
};

module.exports = { getAllProducts, getProductById };
