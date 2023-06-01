const express = require('express')
const router = express.Router();


const Product = require('../Models/ProtectedModel');


router.get('/protected', (req, res) => {
    if (!req.session.isLogged) {
        return res.redirect('/admin');
    }
    
    Product.findAll()
        .then(results => {
            res.render('protected', { data: results });
        })
        .catch(err => {
            console.error(err);
        });
});



module.exports = router