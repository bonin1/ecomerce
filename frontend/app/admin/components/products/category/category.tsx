'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
            const response = (await apiClient('/product/categories')) as {
                success?: boolean;
                data?: Category[];
            };
            setCategories(Array.isArray(response.data) ? response.data : []);
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

    const filteredCategories = useMemo(
        () =>
            categories.filter((category) =>
                category.product_category.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [categories, searchTerm]
    );

    const overview = useMemo(() => {
        const total = categories.length;
        const listed = categories.reduce((s, c) => s + (c.productCount ?? 0), 0);
        const empty = categories.filter((c) => (c.productCount ?? 0) === 0).length;
        return { total, listed, empty };
    }, [categories]);

    return (
        <div className="category-management">
            <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</p>
                    <p className="text-2xl font-bold text-slate-900">{overview.total}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Products in categories</p>
                    <p className="text-2xl font-bold text-slate-900">{overview.listed}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Empty categories</p>
                    <p className="text-2xl font-bold text-slate-900">{overview.empty}</p>
                    <Link href="/admin/products" className="mt-1 inline-block text-xs font-semibold text-indigo-600 no-underline hover:underline">
                        Review products →
                    </Link>
                </div>
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
                ) : filteredCategories.length === 0 ? (
                    <div className="category-empty">
                        <p>No categories match your search.</p>
                    </div>
                ) : (
                    <div className="category-grid">
                        {filteredCategories.map((category) => (
                            <article
                                key={category.id}
                                className={`category-card ${editingCategory?.id === category.id ? 'category-card--editing' : ''}`}
                            >
                                <div className="category-card-top">
                                    <div className="category-card-title-block">
                                        {editingCategory?.id === category.id ? (
                                            <input
                                                type="text"
                                                className="category-card-input"
                                                value={editingCategory.product_category}
                                                onChange={(e) =>
                                                    setEditingCategory({
                                                        ...editingCategory,
                                                        product_category: e.target.value,
                                                    })
                                                }
                                                autoFocus
                                                aria-label="Category name"
                                            />
                                        ) : (
                                            <h3 className="category-card-title">{category.product_category}</h3>
                                        )}
                                        <span className="category-card-badge">{category.productCount ?? 0} products</span>
                                    </div>
                                </div>
                                <dl className="category-card-meta">
                                    <div>
                                        <dt>Created</dt>
                                        <dd>{formatDate(category.createdAt)}</dd>
                                    </div>
                                    <div>
                                        <dt>Updated</dt>
                                        <dd>{formatDate(category.updatedAt)}</dd>
                                    </div>
                                </dl>
                                <div className="category-card-actions">
                                    {editingCategory?.id === category.id ? (
                                        <>
                                            <button
                                                type="button"
                                                className="save-btn"
                                                onClick={() => handleUpdate(category.id)}
                                                disabled={loading}
                                            >
                                                Save changes
                                            </button>
                                            <button type="button" className="cancel-btn" onClick={() => setEditingCategory(null)}>
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button type="button" className="edit-btn" onClick={() => setEditingCategory(category)}>
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="delete-btn"
                                                onClick={() => handleDelete(category.id)}
                                                disabled={loading}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
