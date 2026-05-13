const ProductCategory = require('../../../model/ProductCategoryModel');

const getAllCategories = async (req, res) => {
    try {
        const categories = await ProductCategory.findAll();
        return res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
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
