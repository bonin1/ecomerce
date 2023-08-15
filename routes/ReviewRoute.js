const express = require('express');
const app = express();
const router = express.Router();
const Review = require('../Models/ReviewsModel')



router.get('/reviews/:productId', async (req, res) => {
    try {
        const reviews = await Review.findAll({ where: { product_id: req.params.productId } });
        res.json(reviews);
    } catch (err) {
        console.log(err);
        res.status(500).send('An error occurred while retrieving reviews');
    }
});



module.exports = router;