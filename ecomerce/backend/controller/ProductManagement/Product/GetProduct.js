const Produkt = require('../../../model/ProduktModel');
const ProduktMedia = require('../../../model/ProduktMediaModel');
const ProduktAdditionalDetails = require('../../../model/ProduktAdditionalDetails');
const ProductCategory = require('../../../model/ProductCategoryModel');

const getAllProducts = async (req, res) => {
    try {
        const products = await Produkt.findAll();
        const enrichedProducts = await Promise.all(
            products.map(async (product) => {
                const media = await ProduktMedia.findAll({
                    where: { product_id: product.id }
                });
                const details = await ProduktAdditionalDetails.findOne({
                    where: { product_id: product.id }
                });
                const category = await ProductCategory.findByPk(product.product_category_id);

                return {
                    ...product.dataValues,
                    media,
                    additional_details: details,
                    category
                };
            })
        );
        res.status(200).json(enrichedProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Produkt.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const media = await ProduktMedia.findAll({
            where: { product_id: product.id }
        });
        const details = await ProduktAdditionalDetails.findOne({
            where: { product_id: product.id }
        });
        const category = await ProductCategory.findByPk(product.product_category_id);

        const enrichedProduct = {
            ...product.dataValues,
            media,
            additional_details: details,
            category
        };

        res.status(200).json(enrichedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllProducts, getProductById };
