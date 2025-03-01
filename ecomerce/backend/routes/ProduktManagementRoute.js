const express = require('express');
const router = express.Router();
const { getAllCategories, getCategoryById } = require('../controller/ProductManagement/Category/GetCategory');
const { createCategory, updateCategory, deleteCategory } = require('../controller/ProductManagement/Category/CRUDoperations');
const { createProduct, updateProduct, deleteProduct } = require('../controller/ProductManagement/Product/CRUDoperations');
const { getAllProducts, getProductById } = require('../controller/ProductManagement/Product/GetProduct');
const { authenticate, isAdminOrStaff } = require('../middleware/authMiddleware');
const { uploadProductMedia, getProductMedia, deleteProductMedia } = require('../controller/ProductManagement/Product/MediaOperations');

const upload = require('../config/UploadConfig');

// Category routes
router.get('/categories', getAllCategories);
router.get('/categories/:id', getCategoryById);
router.post('/categories', authenticate, isAdminOrStaff, createCategory);
router.put('/categories/:id', authenticate, isAdminOrStaff, updateCategory);
router.delete('/categories/:id', authenticate, isAdminOrStaff, deleteCategory);

// Product routes - Public
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);

// Product routes - Protected
router.post('/products', authenticate, isAdminOrStaff, createProduct);
router.put('/products/:id', authenticate, isAdminOrStaff, updateProduct);
router.delete('/products/:id', authenticate, isAdminOrStaff, deleteProduct);

// Product Media routes
router.post('/products/:id/media', authenticate, isAdminOrStaff, upload.single('image'), uploadProductMedia);
router.get('/products/:id/media', getProductMedia);
router.delete('/products/:id/media/:mediaId', authenticate, isAdminOrStaff, deleteProductMedia);

module.exports = router;
