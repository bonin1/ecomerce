const WishlistItem = require('../../model/WishlistModel');
const Produkt = require('../../model/ProduktModel');
const ProduktMedia = require('../../model/ProduktMediaModel');

const getWishlistStatus = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        if (Number.isNaN(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product id' });
        }
        const row = await WishlistItem.findOne({
            where: { user_id: req.user.id, product_id: productId },
        });
        return res.status(200).json({ success: true, inWishlist: !!row });
    } catch (error) {
        console.error('getWishlistStatus:', error);
        return res.status(500).json({ success: false, message: 'Could not read wishlist status' });
    }
};

const getMyWishlist = async (req, res) => {
    try {
        const rows = await WishlistItem.findAll({
            where: { user_id: req.user.id },
            include: [{ model: Produkt, as: 'product' }],
            order: [['createdAt', 'DESC']],
        });

        const data = (
            await Promise.all(
                rows.map(async (row) => {
                    const p = row.product;
                    if (!p) return null;

                    let preview_image_data = null;
                    try {
                        const mediaRow = await ProduktMedia.findOne({
                            where: { product_id: p.id },
                            order: [
                                ['is_primary', 'DESC'],
                                ['id', 'ASC'],
                            ],
                        });
                        if (
                            mediaRow &&
                            mediaRow.media &&
                            Buffer.isBuffer(mediaRow.media) &&
                            mediaRow.media.length > 0
                        ) {
                            const b64 = Buffer.from(mediaRow.media).toString('base64');
                            preview_image_data = `data:${mediaRow.media_type || 'image/png'};base64,${b64}`;
                        }
                    } catch (e) {
                        console.error('Wishlist preview media:', p.id, e.message);
                    }

                    return {
                        wishlistId: row.id,
                        addedAt: row.createdAt,
                        id: p.id,
                        product_name: p.product_name,
                        product_price: p.product_price,
                        product_brand: p.product_brand,
                        product_stock: p.product_stock,
                        product_primary_image: p.product_primary_image,
                        preview_image_data,
                        product_discount_active: p.product_discount_active,
                        product_discount_price: p.product_discount_price,
                    };
                })
            )
        ).filter(Boolean);

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('getMyWishlist:', error);
        return res.status(500).json({ success: false, message: 'Could not load wishlist' });
    }
};

const addWishlistItem = async (req, res) => {
    try {
        const productId = parseInt(req.body.productId ?? req.body.product_id, 10);
        if (Number.isNaN(productId)) {
            return res.status(400).json({ success: false, message: 'productId is required' });
        }

        const product = await Produkt.findByPk(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const [item, created] = await WishlistItem.findOrCreate({
            where: { user_id: req.user.id, product_id: productId },
            defaults: { user_id: req.user.id, product_id: productId },
        });

        return res.status(created ? 201 : 200).json({
            success: true,
            message: created ? 'Added to wishlist' : 'Already in wishlist',
            data: { id: item.id, product_id: productId },
        });
    } catch (error) {
        console.error('addWishlistItem:', error);
        return res.status(500).json({ success: false, message: 'Could not add to wishlist' });
    }
};

const removeWishlistItem = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        if (Number.isNaN(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product id' });
        }

        const deleted = await WishlistItem.destroy({
            where: { user_id: req.user.id, product_id: productId },
        });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Item not in wishlist' });
        }

        return res.status(200).json({ success: true, message: 'Removed from wishlist' });
    } catch (error) {
        console.error('removeWishlistItem:', error);
        return res.status(500).json({ success: false, message: 'Could not remove from wishlist' });
    }
};

module.exports = {
    getWishlistStatus,
    getMyWishlist,
    addWishlistItem,
    removeWishlistItem,
};
