const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById } = require('../controller/ProductManagement/Product/GetProduct');

// Get all products with filtering and pagination
router.get('/products', getAllProducts);

// Get a single product by ID
router.get('/products/:id', getProductById);

module.exports = router;
