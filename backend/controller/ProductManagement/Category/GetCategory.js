const ProductCategory = require('../../../model/ProductCategoryModel');
const { Sequelize } = require('sequelize');

const getAllCategories = async (req, res) => {
    try {
        const categories = await ProductCategory.findAll({
            attributes: {
                include: [
                    [
                        Sequelize.literal(
                            '(SELECT COUNT(*) FROM produkt WHERE produkt.product_category_id = `product_category`.`id`)'
                        ),
                        'productCount',
                    ],
                ],
            },
            order: [['id', 'ASC']],
        });

        const data = categories.map((row) => {
            const plain = row.get({ plain: true });
            return {
                ...plain,
                productCount: parseInt(String(plain.productCount ?? 0), 10) || 0,
            };
        });

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message,
        });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await ProductCategory.findByPk(id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching category',
            error: error.message
        });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById
};
