const express = require('express');
const router = express.Router();
const Produkti = require('../Models/ProductIdModel');
const Cart = require('../Models/CartModel');
const db = require('../databaze')
const ProduktImages = require('../Models/ProduktImagesModel')

router.get('/', async (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }

    try {
        const cartItems = await Cart.findAll({
            where: { user_Id: req.session.userId }
        });

        const items = [];
        for (const cartItem of cartItems) {
            const product = await Produkti.findOne({
                where: { id: cartItem.produkt_id }
            });
            const cart = await Cart.findOne({
                where: { id: cartItem.id }
            });
            const image = await ProduktImages.findOne({
                where: { produkt_id: cartItem.produkt_id },
                order: [['id', 'ASC']]
            });
            items.push({ product, image, cart });
        }

        res.render('cart', { items,isLoggedIn:req.session.isLoggedIn });
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/',(req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }

    const userId = req.session.userId;
    const itemId = req.body.id;
    const quantity = req.body.quantity;

    db.query(
        'INSERT INTO cart (user_id, produkt_id, quantity) VALUES (?, ?, ?)',
        [userId, itemId, quantity],
        (err, results) => {
            if (err) {
                console.error(err);
                res.sendStatus(500);
                return;
            }   
            res.render('cart',{isLoggedIn:req.session.isLoggedIn,items: results});
        }
    );
});







router.delete('/:itemId', (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    
    const userId = req.session.userId;
    const itemId = req.params.itemId;

    db.query('DELETE FROM cart WHERE produkt_id = ? AND user_id = ?', [itemId, userId], (err, results) => {
        if (err) {
            console.error(err);
            return;
        }
        db.query(
            'SELECT produktet.*, cart.produkt_id, cart.quantity FROM produktet INNER JOIN cart ON produktet.id = cart.produkt_id WHERE cart.user_id = ?',
            [userId],
            (err, results) => {
                if (err) {
                    console.error(err);
                    return;
                }
                res.send({ items: results});
            }
        );
    });
});

module.exports = router