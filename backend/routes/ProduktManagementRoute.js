const express = require('express');
const router = express.Router();
const { getAllCategories, getCategoryById } = require('../controller/ProductManagement/Category/GetCategory');
const { createCategory, updateCategory, deleteCategory } = require('../controller/ProductManagement/Category/CRUDoperations');
const { createProduct, updateProduct, deleteProduct } = require('../controller/ProductManagement/Product/CRUDoperations');
const { getAllProducts, getProductById } = require('../controller/ProductManagement/Product/GetProduct');
const { bulkInventory } = require('../controller/ProductManagement/Product/BulkProductOps');
const { authenticate, isAdminOrStaff } = require('../middleware/authMiddleware');
const forbidModeratorCatalogWrite = require('../middleware/forbidModeratorCatalogWrite');
const { uploadProductMedia, getProductMedia, deleteProductMedia, cloneProductMedia } = require('../controller/ProductManagement/Product/MediaOperations');

const upload = require('../config/UploadConfig');

// Category routes
router.get('/categories', getAllCategories);
router.get('/categories/:id', getCategoryById);
router.post('/categories', authenticate, isAdminOrStaff, forbidModeratorCatalogWrite, createCategory);
router.put('/categories/:id', authenticate, isAdminOrStaff, forbidModeratorCatalogWrite, updateCategory);
router.delete('/categories/:id', authenticate, isAdminOrStaff, forbidModeratorCatalogWrite, deleteCategory);

// Product routes - Public
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);

// Product routes - Protected
router.post('/products', authenticate, isAdminOrStaff, forbidModeratorCatalogWrite, createProduct);
router.put('/products/:id', authenticate, isAdminOrStaff, forbidModeratorCatalogWrite, updateProduct);
router.post('/products/bulk-inventory', authenticate, isAdminOrStaff, forbidModeratorCatalogWrite, bulkInventory);
router.delete('/products/:id', authenticate, isAdminOrStaff, forbidModeratorCatalogWrite, deleteProduct);

// Product Media routes
router.post('/products/:id/clone-media', authenticate, isAdminOrStaff, forbidModeratorCatalogWrite, cloneProductMedia);
router.post('/products/:id/media', authenticate, isAdminOrStaff, forbidModeratorCatalogWrite, upload.single('image'), uploadProductMedia);
router.get('/products/:id/media', getProductMedia);
router.delete('/products/:id/media/:mediaId', authenticate, isAdminOrStaff, forbidModeratorCatalogWrite, deleteProductMedia);

module.exports = router;
