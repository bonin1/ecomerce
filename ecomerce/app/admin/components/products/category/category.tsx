'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/app/utils/apiClient';
import './category.scss';

interface Category {
    id: number;
    product_category: string;
    createdAt?: string;
    updatedAt?: string;
    productCount?: number;
}

export default function CategoryManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient('/product/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setError('Failed to load categories. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCategory.trim()) {
            return;
        }
        
        try {
            setLoading(true);
            await apiClient('/product/categories', {
                method: 'POST',
                body: JSON.stringify({ product_category: newCategory }),
            });
            setNewCategory('');
            fetchCategories();
        } catch (error) {
            console.error('Error creating category:', error);
            setError('Failed to create category. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editingCategory) return;
        
        if (!editingCategory.product_category.trim()) {
            setError('Category name cannot be empty');
            return;
        }
        
        try {
            setLoading(true);
            await apiClient(`/product/categories/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ product_category: editingCategory.product_category }),
            });
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            console.error('Error updating category:', error);
            setError('Failed to update category. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;
        try {
            setLoading(true);
            await apiClient(`/product/categories/${id}`, { method: 'DELETE' });
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            setError('Failed to delete category. It might be in use by products.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredCategories = categories.filter(category =>
        category.product_category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="category-management">
            <div className="category-header">
                <h2>Category Management</h2>
            </div>
            
            <div className="category-controls">
                <div className="search-add-container">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="add-category">
                        <input
                            type="text"
                            placeholder="New category name"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <button 
                            onClick={handleCreate} 
                            disabled={loading || !newCategory.trim()}
                        >
                            Add Category
                        </button>
                    </div>
                </div>
                
                {error && <div className="error-message">{error}</div>}
            </div>
            
            <div className="categories-list">
                {loading && !editingCategory ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Loading categories...</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Category Name</th>
                                    <th>Created</th>
                                    <th>Updated</th>
                                    <th>Products</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map(category => (
                                        <tr key={category.id}>
                                            <td>
                                                {editingCategory?.id === category.id ? (
                                                    <input
                                                        type="text"
                                                        value={editingCategory.product_category}
                                                        onChange={(e) => setEditingCategory({
                                                            ...editingCategory,
                                                            product_category: e.target.value
                                                        })}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className="category-name">{category.product_category}</span>
                                                )}
                                            </td>
                                            <td>{formatDate(category.createdAt)}</td>
                                            <td>{formatDate(category.updatedAt)}</td>
                                            <td>
                                                <span className="product-count">
                                                    {category.productCount || 0}
                                                </span>
                                            </td>
                                            <td>
                                                {editingCategory?.id === category.id ? (
                                                    <div className="action-buttons">
                                                        <button 
                                                            className="save-btn" 
                                                            onClick={() => handleUpdate(category.id)}
                                                            disabled={loading}
                                                        >
                                                            Save
                                                        </button>
                                                        <button 
                                                            className="cancel-btn" 
                                                            onClick={() => setEditingCategory(null)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="action-buttons">
                                                        <button 
                                                            className="edit-btn" 
                                                            onClick={() => setEditingCategory(category)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            className="delete-btn" 
                                                            onClick={() => handleDelete(category.id)}
                                                            disabled={loading}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="no-categories">
                                            No categories found. Try adjusting your search or create a new category.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
