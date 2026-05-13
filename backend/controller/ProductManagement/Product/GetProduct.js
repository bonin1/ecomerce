const Produkt = require('../../../model/ProduktModel');
const ProduktAdditionalDetails = require('../../../model/ProduktAdditionalDetails');
const ProduktMedia = require('../../../model/ProduktMediaModel');
const ProductCategory = require('../../../model/ProductCategoryModel');
const { Op } = require('sequelize');

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
            brand
        } = req.query;

        const whereConditions = {};
        
        if (search) {
            whereConditions[Op.or] = [
                { product_name: { [Op.like]: `%${search}%` } },
                { product_description: { [Op.like]: `%${search}%` } }
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

        const offset = (page - 1) * limit;
        
        const { count, rows: products } = await Produkt.findAndCountAll({
            where: whereConditions,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sort, order]]
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
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
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
