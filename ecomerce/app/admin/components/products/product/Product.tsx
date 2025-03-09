'use client';
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/app/utils/apiClient';
import './Product.scss';

interface Category {
    id: number;
    product_category: string;
}

interface AdditionalDetails {
    product_color?: string;
    product_size?: string;
    product_weight?: number;
    product_dimensions?: string;
    product_material?: string;
    product_manufacturer?: string;
    product_origin?: string;
}

interface Product {
    id?: number;
    product_name: string;
    product_description: string;
    product_price: number;
    product_brand: string;
    product_stock: number;
    product_category_id: number;
    product_primary_image?: string;
    product_rating?: number;
    product_discount?: boolean;
    product_discount_price?: number;
    product_discount_start?: string;
    product_discount_end?: string;
    product_discount_active?: boolean;
    product_discount_percentage?: number;
    product_discount_code?: string;
    warranty?: string;
    additional_details?: AdditionalDetails;
    category?: Category;
    createdAt?: string;
    updatedAt?: string;
}

interface ProductMedia {
    id: number;
    product_id: number;
    media_type: string;
    is_primary?: boolean;
    media_data: string; 
    createdAt: string;
    updatedAt: string;
}

interface FilterOptions {
    category: number | '';
    minPrice: number | '';
    maxPrice: number | '';
    stockStatus: 'all' | 'in-stock' | 'out-of-stock';
    dateAdded: string | '';
}

export default function ProductManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productMedia, setProductMedia] = useState<ProductMedia[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({
        category: '',
        minPrice: '',
        maxPrice: '',
        stockStatus: 'all',
        dateAdded: ''
    });

    const [formData, setFormData] = useState<Product>({
        product_name: '',
        product_description: '',
        product_price: 0,
        product_brand: '',
        product_stock: 0,
        product_category_id: 0,
        product_discount: false,
        additional_details: {
            product_color: '',
            product_size: '',
            product_weight: 0,
            product_dimensions: '',
            product_material: '',
            product_manufacturer: '',
            product_origin: ''
        }
    });

    const [additionalDetails, setAdditionalDetails] = useState<AdditionalDetails>({
        product_color: '',
        product_size: '',
        product_weight: 0,
        product_dimensions: '',
        product_material: '',
        product_manufacturer: '',
        product_origin: ''
    });

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        if (adminToken) {
            fetchProducts();
            fetchCategories();
        }
    }, []);

    useEffect(() => {
        if (selectedProduct?.id) {
            fetchProductMedia(selectedProduct.id);
        }
    }, [selectedProduct]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await apiClient('/product/products');
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await apiClient('/product/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProductMedia = async (productId: number) => {
        try {
            const response = await apiClient(`/product/products/${productId}/media`);
            setProductMedia(response.data || []);
        } catch (error) {
            console.error('Error fetching product media:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        
        if (name.startsWith('additional_')) {
            const detailName = name.replace('additional_', '') as keyof AdditionalDetails;
            setAdditionalDetails(prev => ({
                ...prev,
                [detailName]: type === 'number' ? parseFloat(value) : value
            }));
        } else {
            const newValue = type === 'checkbox' 
                ? (e.target as HTMLInputElement).checked 
                : type === 'number' 
                    ? parseFloat(value) 
                    : value;
            
            if (name === 'product_discount_price' && formData.product_price > 0) {
                const originalPrice = formData.product_price;
                const discountPrice = parseFloat(value);
                
                if (!isNaN(discountPrice) && discountPrice > 0 && discountPrice < originalPrice) {
                    const percentage = ((originalPrice - discountPrice) / originalPrice) * 100;
                    
                    setFormData(prev => ({
                        ...prev,
                        [name]: discountPrice,
                        product_discount_percentage: Math.round(percentage)
                    }));
                    return;
                }
            } 
            else if (name === 'product_discount_percentage' && formData.product_price > 0) {
                const originalPrice = formData.product_price;
                const discountPercentage = parseFloat(value);
                
                if (!isNaN(discountPercentage) && discountPercentage > 0 && discountPercentage < 100) {
                    const discountPrice = originalPrice - (originalPrice * (discountPercentage / 100));
                    
                    setFormData(prev => ({
                        ...prev,
                        [name]: discountPercentage,
                        product_discount_price: Math.round(discountPrice * 100) / 100
                    }));
                    return;
                }
            }
            else if (name === 'product_price' && formData.product_discount) {
                const newPrice = parseFloat(value);
                
                if (!isNaN(newPrice) && newPrice > 0) {
                    if (formData.product_discount_percentage && formData.product_discount_percentage > 0) {
                        const discountPercentage = formData.product_discount_percentage;
                        const discountPrice = newPrice - (newPrice * (discountPercentage / 100));
                        
                        setFormData(prev => ({
                            ...prev,
                            [name]: newPrice,
                            product_discount_price: Math.round(discountPrice * 100) / 100
                        }));
                        return;
                    }
                    else if (formData.product_discount_price && formData.product_discount_price > 0) {
                        const discountPrice = formData.product_discount_price;
                        if (discountPrice < newPrice) {
                            const percentage = ((newPrice - discountPrice) / newPrice) * 100;
                            
                            setFormData(prev => ({
                                ...prev,
                                [name]: newPrice,
                                product_discount_percentage: Math.round(percentage)
                            }));
                            return;
                        }
                    }
                }
            }
            
            setFormData(prev => ({
                ...prev,
                [name]: newValue
            }));
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const clearFilters = () => {
        setFilters({
            category: '',
            minPrice: '',
            maxPrice: '',
            stockStatus: 'all',
            dateAdded: ''
        });
    };

    const resetForm = () => {
        setFormData({
            product_name: '',
            product_description: '',
            product_price: 0,
            product_brand: '',
            product_stock: 0,
            product_category_id: 0,
            product_discount: false
        });
        setAdditionalDetails({
            product_color: '',
            product_size: '',
            product_weight: 0,
            product_dimensions: '',
            product_material: '',
            product_manufacturer: '',
            product_origin: ''
        });
        setSelectedProduct(null);
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            
            const productData = {
                product: formData,
                additionalDetails
            };

            if (selectedProduct?.id) {
                await apiClient(`/product/products/${selectedProduct.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(productData),
                });
            } else {
                await apiClient('/product/products', {
                    method: 'POST',
                    body: JSON.stringify(productData),
                });
            }
            
            setShowForm(false);
            resetForm();
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            setLoading(true);
            await apiClient(`/product/products/${id}`, { method: 'DELETE' });
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            ...product,
            product_category_id: product.product_category_id
        });
        
        if (product.additional_details) {
            setAdditionalDetails(product.additional_details);
        }
        
        setShowForm(true);
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, isPrimary: boolean = false) => {
        if (!e.target.files || !e.target.files[0] || !selectedProduct?.id) return;
        
        try {
            setUploading(true);
            setUploadError('');
            
            const formData = new FormData();
            formData.append('image', e.target.files[0]);
            formData.append('isPrimary', isPrimary ? 'true' : 'false');
            
            await apiClient(`/product/products/${selectedProduct.id}/media`, {
                method: 'POST',
                body: formData,
                headers: {}, 
            });
            
            fetchProductMedia(selectedProduct.id);
            
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error: any) {
            console.error('Error uploading image:', error);
            setUploadError(error.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };
    
    const handleDeleteImage = async (mediaId: number) => {
        if (!selectedProduct?.id) return;
        
        if (!window.confirm('Are you sure you want to delete this image?')) return;
        
        try {
            await apiClient(`/product/products/${selectedProduct.id}/media/${mediaId}`, {
                method: 'DELETE'
            });
            
            fetchProductMedia(selectedProduct.id);
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    };

    const filteredProducts = products.filter(product => {
        if (searchTerm && 
            !product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !product.product_brand.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        
        if (filters.category !== '' && product.product_category_id !== Number(filters.category)) {
            return false;
        }
        
        if (filters.minPrice !== '' && product.product_price < Number(filters.minPrice)) {
            return false;
        }
        if (filters.maxPrice !== '' && product.product_price > Number(filters.maxPrice)) {
            return false;
        }
        
        if (filters.stockStatus === 'in-stock' && product.product_stock <= 0) {
            return false;
        }
        if (filters.stockStatus === 'out-of-stock' && product.product_stock > 0) {
            return false;
        }
        
        if (filters.dateAdded && product.createdAt) {
            const filterDate = new Date(filters.dateAdded);
            const productDate = new Date(product.createdAt);
            
            filterDate.setHours(0, 0, 0, 0);
            productDate.setHours(0, 0, 0, 0);
            
            if (productDate < filterDate) {
                return false;
            }
        }
        
        return true;
    });

    const formatPrice = (price: any): string => {
        if (price === null || price === undefined || isNaN(Number(price))) {
            return '$0.00';
        }
        return `$${Number(price).toFixed(2)}`;
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

    return (
        <div className="product-management">
            <div className="product-header">
                <h2>{selectedProduct ? 'Edit Product' : 'Product Management'}</h2>
                {!showForm && (
                    <div className="header-actions">
                        <button 
                            className="filter-toggle-btn" 
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <span className="icon">🔍</span> {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                        <button 
                            className="add-product-btn" 
                            onClick={() => setShowForm(true)}
                        >
                            <span className="icon">+</span> Add New Product
                        </button>
                    </div>
                )}
            </div>
            
            {!showForm && (
                <>
                    <div className="product-controls">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="product-count">
                            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                        </div>
                    </div>
                    
                    {showFilters && (
                        <div className="filter-panel">
                            <div className="filter-panel-header">
                                <h3>Filters</h3>
                                <button className="clear-filters" onClick={clearFilters}>Clear All</button>
                            </div>
                            <div className="filter-grid">
                                <div className="filter-group">
                                    <label>Category</label>
                                    <select 
                                        name="category"
                                        value={filters.category}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.product_category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="filter-group">
                                    <label>Price Range</label>
                                    <div className="price-range">
                                        <input
                                            type="number"
                                            name="minPrice"
                                            placeholder="Min"
                                            value={filters.minPrice}
                                            onChange={handleFilterChange}
                                        />
                                        <span>to</span>
                                        <input
                                            type="number"
                                            name="maxPrice"
                                            placeholder="Max"
                                            value={filters.maxPrice}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                </div>
                                
                                <div className="filter-group">
                                    <label>Stock Status</label>
                                    <select
                                        name="stockStatus"
                                        value={filters.stockStatus}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="all">All</option>
                                        <option value="in-stock">In Stock</option>
                                        <option value="out-of-stock">Out of Stock</option>
                                    </select>
                                </div>
                                
                                <div className="filter-group">
                                    <label>Added After</label>
                                    <input
                                        type="date"
                                        name="dateAdded"
                                        value={filters.dateAdded}
                                        onChange={handleFilterChange}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="products-list">
                        {loading ? (
                            <div className="loading">
                                <div className="spinner"></div>
                                <p>Loading products...</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Brand</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                            <th>Category</th>
                                            <th>Created</th>
                                            <th>Updated</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map(product => (
                                                <tr key={product.id}>
                                                    <td className="product-name">{product.product_name}</td>
                                                    <td>{product.product_brand}</td>
                                                    <td>{formatPrice(product.product_price)}</td>
                                                    <td>
                                                        <span className={`stock-badge ${product.product_stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                                            {product.product_stock > 0 ? product.product_stock : 'Out of stock'}
                                                        </span>
                                                    </td>
                                                    <td>{product.category?.product_category || ''}</td>
                                                    <td>{formatDate(product.createdAt)}</td>
                                                    <td>{formatDate(product.updatedAt)}</td>
                                                    <td className="action-buttons">
                                                        <button 
                                                            className="edit-btn"
                                                            onClick={() => handleEdit(product)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            className="delete-btn"
                                                            onClick={() => product.id && handleDelete(product.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="no-products">
                                                    No products found. Try adjusting your search or add a new product.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
            
            {showForm && (
                <div className="product-form-container">
                    <form onSubmit={handleCreateOrUpdate}>
                        <div className="form-section">
                            <h3>Basic Information</h3>
                            <div className="form-group">
                                <label htmlFor="product_name">Product Name *</label>
                                <input
                                    type="text"
                                    id="product_name"
                                    name="product_name"
                                    value={formData.product_name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="product_description">Description *</label>
                                <textarea
                                    id="product_description"
                                    name="product_description"
                                    value={formData.product_description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="product_category_id">Category *</label>
                                <select
                                    id="product_category_id"
                                    name="product_category_id"
                                    value={formData.product_category_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.product_category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="product_price">Price *</label>
                                    <input
                                        type="number"
                                        id="product_price"
                                        name="product_price"
                                        value={formData.product_price}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="product_stock">Stock *</label>
                                    <input
                                        type="number"
                                        id="product_stock"
                                        name="product_stock"
                                        value={formData.product_stock}
                                        onChange={handleInputChange}
                                        min="0"
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="product_brand">Brand *</label>
                                    <input
                                        type="text"
                                        id="product_brand"
                                        name="product_brand"
                                        value={formData.product_brand}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="form-section">
                            <h3>Discount Information</h3>
                            <div className="form-group checkbox">
                                <input
                                    type="checkbox"
                                    id="product_discount"
                                    name="product_discount"
                                    checked={formData.product_discount}
                                    onChange={handleInputChange}
                                />
                                <label htmlFor="product_discount">Apply Discount</label>
                            </div>
                            
                            {formData.product_discount && (
                                <>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="product_discount_price">Discount Price</label>
                                            <input
                                                type="number"
                                                id="product_discount_price"
                                                name="product_discount_price"
                                                value={formData.product_discount_price || ''}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                            />
                                            <small className="form-text text-muted">
                                                Enter discount price to auto-calculate percentage
                                            </small>
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="product_discount_percentage">Discount Percentage</label>
                                            <input
                                                type="number"
                                                id="product_discount_percentage"
                                                name="product_discount_percentage"
                                                value={formData.product_discount_percentage || ''}
                                                onChange={handleInputChange}
                                                min="0"
                                                max="100"
                                            />
                                            <small className="form-text text-muted">
                                                Enter percentage to auto-calculate discount price
                                            </small>
                                        </div>
                                    </div>
                                    
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="product_discount_start">Start Date</label>
                                            <input
                                                type="date"
                                                id="product_discount_start"
                                                name="product_discount_start"
                                                value={formData.product_discount_start || ''}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="product_discount_end">End Date</label>
                                            <input
                                                type="date"
                                                id="product_discount_end"
                                                name="product_discount_end"
                                                value={formData.product_discount_end || ''}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="product_discount_code">Discount Code</label>
                                        <input
                                            type="text"
                                            id="product_discount_code"
                                            name="product_discount_code"
                                            value={formData.product_discount_code || ''}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group checkbox">
                                        <input
                                            type="checkbox"
                                            id="product_discount_active"
                                            name="product_discount_active"
                                            checked={formData.product_discount_active || false}
                                            onChange={handleInputChange}
                                        />
                                        <label htmlFor="product_discount_active">Discount Active</label>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div className="form-section">
                            <h3>Additional Details</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="additional_product_color">Color</label>
                                    <input
                                        type="text"
                                        id="additional_product_color"
                                        name="additional_product_color"
                                        value={additionalDetails.product_color || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="additional_product_size">Size</label>
                                    <input
                                        type="text"
                                        id="additional_product_size"
                                        name="additional_product_size"
                                        value={additionalDetails.product_size || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="additional_product_weight">Weight</label>
                                    <input
                                        type="number"
                                        id="additional_product_weight"
                                        name="additional_product_weight"
                                        value={additionalDetails.product_weight || ''}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="additional_product_dimensions">Dimensions</label>
                                    <input
                                        type="text"
                                        id="additional_product_dimensions"
                                        name="additional_product_dimensions"
                                        value={additionalDetails.product_dimensions || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="additional_product_material">Material</label>
                                    <input
                                        type="text"
                                        id="additional_product_material"
                                        name="additional_product_material"
                                        value={additionalDetails.product_material || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="additional_product_manufacturer">Manufacturer</label>
                                    <input
                                        type="text"
                                        id="additional_product_manufacturer"
                                        name="additional_product_manufacturer"
                                        value={additionalDetails.product_manufacturer || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="additional_product_origin">Country of Origin</label>
                                <input
                                    type="text"
                                    id="additional_product_origin"
                                    name="additional_product_origin"
                                    value={additionalDetails.product_origin || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="warranty">Warranty</label>
                                <input
                                    type="text"
                                    id="warranty"
                                    name="warranty"
                                    value={formData.warranty || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {selectedProduct?.id && (
                            <div className="form-section">
                                <h3>Product Images</h3>
                                <p className="image-limit-info">
                                    Maximum of 10 images allowed per product.
                                    {productMedia.length >= 10 && (
                                        <span className="limit-reached"> Limit reached.</span>
                                    )}
                                </p>
                                
                                <div className="image-upload-container">
                                    <div className="primary-image">
                                        <h4>Primary Image</h4>
                                        <div className="upload-box">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/gif"
                                                onChange={(e) => handleUploadImage(e, true)}
                                                disabled={uploading || productMedia.length >= 10}
                                                ref={fileInputRef}
                                            />
                                            <p>Drop a file here or click to browse</p>
                                            {uploading && <div className="upload-spinner">Uploading...</div>}
                                        </div>
                                        {uploadError && <p className="upload-error">{uploadError}</p>}
                                    </div>
                                    
                                    <div className="additional-images">
                                        <h4>Additional Images</h4>
                                        <div className="upload-box">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/gif"
                                                onChange={(e) => handleUploadImage(e, false)}
                                                disabled={uploading || productMedia.length >= 10}
                                            />
                                            <p>Drop a file here or click to browse</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="media-gallery">
                                    <h4>Current Images</h4>
                                    {productMedia.length === 0 ? (
                                        <p>No images uploaded yet.</p>
                                    ) : (
                                        <div className="media-grid">
                                            {productMedia.map((media) => (
                                                <div key={media.id} className={`media-item ${media.is_primary ? 'primary' : ''}`}>
                                                    {media.is_primary && <span className="primary-badge">Primary</span>}
                                                    <div className="media-actions">
                                                        <button 
                                                            type="button" 
                                                            className="delete-media" 
                                                            onClick={() => handleDeleteImage(media.id)}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                    {media.media_data && (
                                                        <img 
                                                            src={media.media_data} 
                                                            alt="Product" 
                                                            className="media-image" 
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="form-actions">
                            <button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : selectedProduct ? 'Update Product' : 'Create Product'}
                            </button>
                            <button type="button" onClick={() => {
                                setShowForm(false);
                                resetForm();
                            }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}