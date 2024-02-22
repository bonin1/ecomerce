const express = require('express');
const router = express.Router();
const Footer = require('../Footer');
const Produkti = require('../Models/ProductIdModel');
const Cart = require('../Models/CartModel');

router.get('/', async (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    const userId = req.session.userId;

    try {
        const cartItems = await Cart.findAll({
            include: [
                {
                    model: Produkti,
                    attributes: ['id', 'emri_produktit', 'company_name', 'pershkrimi_produktit', 'cmimi_produktit', 'origjina_produktit', 'sasia_produktit', 'kategoria', 'garancioni', 'serialcode'],
                    required: true,
                }
            ],
            where: { user_id: userId }
        });
        res.render('cart', { items: cartItems, isLoggedIn: req.session.isLoggedIn, footer: Footer() });
        
    } catch (err) {
        console.error('Error fetching cart items:', err); 
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

    db2.query(
        'INSERT INTO cart (user_id, produkt_id, quantity) VALUES (?, ?, ?)',
        [userId, itemId, quantity],
        (err, results) => {
            if (err) {
                console.error(err);
                res.sendStatus(500);
                return;
            }   
            res.render('cart',{isLoggedIn:req.session.isLoggedIn});
        }
    );
});







router.delete('/:itemId', (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    
    const userId = req.session.userId;
    const itemId = req.params.itemId;

    db2.query('DELETE FROM cart WHERE produkt_id = ? AND user_id = ?', [itemId, userId], (err, results) => {
        if (err) {
            console.error(err);
            return;
        }
        db2.query(
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