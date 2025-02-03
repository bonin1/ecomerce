const Produkt = require('../../../model/ProduktModel');
const ProduktMedia = require('../../../model/ProduktMediaModel');
const ProduktAdditionalDetails = require('../../../model/ProduktAdditionalDetails');
const db = require('../../../database');
const ProductCategory = require('../../../model/ProductCategoryModel');

const createProduct = async (req, res) => {
    const t = await db.transaction();
    try {
        const { product, additionalDetails } = req.body;
        
        if (!product.product_name || !product.product_description || 
            !product.product_price || !product.product_brand || 
            !product.product_category_id) {
            return res.status(400).json({ 
                message: 'Missing required fields' 
            });
        }

        const category = await ProductCategory.findByPk(product.product_category_id);
        if (!category) {
            return res.status(400).json({
                message: 'Invalid category ID. Category does not exist.'
            });
        }

        const newProduct = await Produkt.create({
            ...product,
            product_price: Number(product.product_price),
            product_stock: Number(product.product_stock),
            product_category_id: Number(product.product_category_id)
        }, { transaction: t });

        if (additionalDetails) {
            await ProduktAdditionalDetails.create({
                ...additionalDetails,
                product_id: newProduct.id
            }, { transaction: t });
        }

        await t.commit();

        const completeProduct = await getCompleteProductData(newProduct.id);
        res.status(201).json(completeProduct);
    } catch (error) {
        await t.rollback();
        console.error('Product creation error:', error);
        res.status(500).json({ 
            message: 'Error creating product',
            error: error.message 
        });
    }
};

const updateProduct = async (req, res) => {
    const t = await db.transaction();
    try {
        const { product, media, additionalDetails } = req.body;
        const productId = req.params.id;

        const existingProduct = await Produkt.findByPk(productId);
        if (!existingProduct) {
            await t.rollback();
            return res.status(404).json({ message: 'Product not found' });
        }

        await Produkt.update(product, { 
            where: { id: productId },
            transaction: t 
        });

        if (media && Array.isArray(media)) {
            await ProduktMedia.destroy({
                where: { product_id: productId },
                transaction: t
            });
            
            for (const mediaItem of media) {
                await ProduktMedia.create({
                    ...mediaItem,
                    product_id: productId
                }, { transaction: t });
            }
        }

        if (additionalDetails) {
            await ProduktAdditionalDetails.update(
                additionalDetails,
                {
                    where: { product_id: productId },
                    transaction: t
                }
            );
        }

        await t.commit();

        const updatedProduct = await getCompleteProductData(productId);
        res.status(200).json(updatedProduct);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    const t = await db.transaction();
    try {
        const productId = req.params.id;
        const product = await Produkt.findByPk(productId);
        
        if (!product) {
            await t.rollback();
            return res.status(404).json({ message: 'Product not found' });
        }

        await ProduktMedia.destroy({
            where: { product_id: productId },
            transaction: t
        });

        await ProduktAdditionalDetails.destroy({
            where: { product_id: productId },
            transaction: t
        });

        await Produkt.destroy({
            where: { id: productId },
            transaction: t
        });

        await t.commit();
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

async function getCompleteProductData(productId) {
    const product = await Produkt.findByPk(productId);
    const media = await ProduktMedia.findAll({
        where: { product_id: productId }
    });
    const details = await ProduktAdditionalDetails.findOne({
        where: { product_id: productId }
    });
    const category = await ProductCategory.findByPk(product.product_category_id);

    return {
        ...product.dataValues,
        media,
        additional_details: details,
        category
    };
}

module.exports = { createProduct, updateProduct, deleteProduct };
