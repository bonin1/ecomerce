const Produkt = require('../../../model/ProduktModel');
const ProduktAdditionalDetails = require('../../../model/ProduktAdditionalDetails');
const ProduktMedia = require('../../../model/ProduktMediaModel');
const ProductCategory = require('../../../model/ProductCategoryModel');
const { Op } = require('sequelize');

// Get all products with pagination and filtering
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

        // Build filter conditions
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

        // Calculate pagination
        const offset = (page - 1) * limit;
        
        // Get products with count (without eager loading)
        const { count, rows: products } = await Produkt.findAndCountAll({
            where: whereConditions,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sort, order]]
        });

        // Get all category IDs from the products
        const categoryIds = [...new Set(products.map(product => product.product_category_id))];
        
        // Fetch all relevant categories in one query
        const categories = categoryIds.length > 0 
            ? await ProductCategory.findAll({
                where: { id: categoryIds }
              }) 
            : [];
            
        // Create a map for quick access to categories
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.id] = cat;
        });

        // Get additional details for each product
        const productsWithDetails = await Promise.all(products.map(async (product) => {
            const additionalDetails = await ProduktAdditionalDetails.findOne({
                where: { product_id: product.id }
            });
            
            const category = categoryMap[product.product_category_id] || null;
            
            return {
                ...product.dataValues,
                additional_details: additionalDetails ? additionalDetails.dataValues : null,
                category: category ? category.dataValues : null
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
        const media = await ProduktMedia.findAll({
            where: { product_id: id }
        });
        
        // Get category
        const category = await ProductCategory.findByPk(product.product_category_id);
        
        // Combine all data
        const completeProduct = {
            ...product.dataValues,
            additional_details: additionalDetails ? additionalDetails.dataValues : null,
            media: media.length > 0 ? media.map(item => item.dataValues) : [],
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
