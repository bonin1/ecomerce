'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/app/utils/apiClient';
import './category.scss';

interface Category {
    id: number;
    product_category: string;
}

export default function CategoryManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await apiClient('/product/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await apiClient('/product/categories', {
                method: 'POST',
                body: JSON.stringify({ product_category: newCategory }),
            });
            setNewCategory('');
            fetchCategories();
        } catch (error) {
            console.error('Error creating category:', error);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editingCategory) return;
        try {
            await apiClient(`/product/categories/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ product_category: editingCategory.product_category }),
            });
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            console.error('Error updating category:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        try {
            await apiClient(`/product/categories/${id}`, { method: 'DELETE' });
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    const filteredCategories = categories.filter(category =>
        category.product_category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="category-management">
            <h2>Category Management</h2>
            <div className="category-controls">
                <div className="search-box">
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
                    <button onClick={handleCreate}>Add Category</button>
                </div>
            </div>
            
            <div className="categories-list">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.map(category => (
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
                                            />
                                        ) : (
                                            category.product_category
                                        )}
                                    </td>
                                    <td>
                                        {editingCategory?.id === category.id ? (
                                            <>
                                                <button onClick={() => handleUpdate(category.id)}>Save</button>
                                                <button onClick={() => setEditingCategory(null)}>Cancel</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => setEditingCategory(category)}>Edit</button>
                                                <button onClick={() => handleDelete(category.id)}>Delete</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
