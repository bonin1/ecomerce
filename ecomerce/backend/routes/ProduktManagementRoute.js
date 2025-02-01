const express = require('express');
const router = express.Router();
const { getAllCategories, getCategoryById } = require('../controller/ProductManagement/Category/GetCategory');
const { createCategory, updateCategory, deleteCategory } = require('../controller/ProductManagement/Category/CRUDoperations');
const { authenticate, isAdminOrStaff } = require('../middleware/authMiddleware');

// Public routes
router.get('/categories', getAllCategories);
router.get('/categories/:id', getCategoryById);

// Protected routes
router.post('/categories', authenticate, isAdminOrStaff, createCategory);
router.put('/categories/:id', authenticate, isAdminOrStaff, updateCategory);
router.delete('/categories/:id', authenticate, isAdminOrStaff, deleteCategory);

module.exports = router;
