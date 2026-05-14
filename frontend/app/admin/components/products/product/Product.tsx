'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
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
    custom_attributes?: Record<string, string> | null;
    additional_details?: AdditionalDetails;
    category?: Category;
    createdAt?: string;
    updatedAt?: string;
    media?: { id?: number; media_data?: string; is_primary?: boolean }[];
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

interface PaymentMethod {
    id: number;
    name: string;
    icon: string | null;
    is_active: boolean;
}

type FormTab = 'basics' | 'specs' | 'custom' | 'discount' | 'media' | 'payments';

type CustomFieldRow = { key: string; value: string };

function customAttributesToRows(obj: Record<string, string> | null | undefined): CustomFieldRow[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj).map(([key, value]) => ({ key, value: String(value ?? '') }));
}

function rowsToCustomAttributes(rows: CustomFieldRow[]): Record<string, string> | null {
    const out: Record<string, string> = {};
    for (const r of rows) {
        const k = r.key.trim();
        if (k) out[k] = r.value;
    }
    return Object.keys(out).length ? out : null;
}

/** Product modal form controls — Tailwind only (no SCSS form coupling). */
const pmField =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';
const pmTextarea = `${pmField} min-h-[120px] resize-y`;
const pmLabel = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600';
const pmHint = 'mt-1 text-xs leading-snug text-slate-500';
const pmSection = 'space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6';
const pmSectionTitle =
    'border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wider text-slate-800';
const pmGrid2 = 'grid grid-cols-1 gap-4 sm:grid-cols-2';
const pmGrid3 = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';
const pmCheckbox = 'mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-primary focus:ring-2 focus:ring-brand-primary/30';
const pmFileDrop =
    'relative flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center text-sm text-slate-600 transition hover:border-brand-primary/50 hover:bg-slate-50';
const pmFileInput = 'absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed';

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
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<number[]>([]);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
    const [brandQuery, setBrandQuery] = useState('');
    const [debouncedBrand, setDebouncedBrand] = useState('');
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [discountOnly, setDiscountOnly] = useState(false);
    const [endingSoonOnly, setEndingSoonOnly] = useState(false);
    const [quickView, setQuickView] = useState<Product | null>(null);
    const [bulkStockOpen, setBulkStockOpen] = useState(false);
    const [bulkMode, setBulkMode] = useState<'set' | 'add'>('set');
    const [bulkStockInput, setBulkStockInput] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const pendingMediaCloneFromId = useRef<number | null>(null);
    const [formTab, setFormTab] = useState<FormTab>('basics');
    const [customRows, setCustomRows] = useState<CustomFieldRow[]>([]);
    const [duplicateImagePreview, setDuplicateImagePreview] = useState<NonNullable<Product['media']> | null>(null);

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
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedBrand(brandQuery), 400);
        return () => clearTimeout(t);
    }, [brandQuery]);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(pageSize));
            params.set('sort', sortBy);
            params.set('order', sortOrder);
            if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
            if (filters.category !== '') params.set('category', String(filters.category));
            if (filters.minPrice !== '') params.set('min_price', String(filters.minPrice));
            if (filters.maxPrice !== '') params.set('max_price', String(filters.maxPrice));
            if (filters.stockStatus === 'in-stock') params.set('stock', 'in');
            if (filters.stockStatus === 'out-of-stock') params.set('stock', 'out');
            if (filters.dateAdded) params.set('created_after', filters.dateAdded);
            if (debouncedBrand.trim()) params.set('brand', debouncedBrand.trim());
            if (lowStockOnly) params.set('low_stock', '10');
            if (discountOnly) params.set('discount_only', '1');
            if (endingSoonOnly) params.set('ending_soon', '1');

            const response = (await apiClient(`/product/products?${params.toString()}`)) as {
                success?: boolean;
                data?: Product[];
                pagination?: { total: number; pages: number; page: number; limit: number };
                message?: string;
            };

            if (response?.success && Array.isArray(response.data)) {
                setProducts(response.data);
                const p = response.pagination;
                if (p) {
                    setTotal(p.total ?? 0);
                    setTotalPages(p.pages ?? 1);
                }
                setSelectedIds([]);
            } else {
                setProducts([]);
                if (response?.message) toast.error(response.message);
            }
        } catch {
            toast.error('Failed to load products');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [
        page,
        pageSize,
        sortBy,
        sortOrder,
        debouncedSearch,
        debouncedBrand,
        filters.category,
        filters.minPrice,
        filters.maxPrice,
        filters.stockStatus,
        filters.dateAdded,
        lowStockOnly,
        discountOnly,
        endingSoonOnly,
    ]);

    useEffect(() => {
        void fetchCategories();
    }, []);

    useEffect(() => {
        void fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        fetchAvailablePaymentMethods();
    }, []);

    useEffect(() => {
        if (selectedProduct?.id) {
            fetchProductMedia(selectedProduct.id);
            fetchProductPaymentMethods(selectedProduct.id);
        }
    }, [selectedProduct]);

    const fetchCategories = async () => {
        try {
            const response = (await apiClient('/product/categories')) as { data?: Category[] };
            setCategories(response.data ?? []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProductMedia = async (productId: number) => {
        try {
            const response = (await apiClient(`/product/products/${productId}/media`)) as {
                data?: ProductMedia[];
            };
            setProductMedia(response.data || []);
        } catch (error) {
            console.error('Error fetching product media:', error);
        }
    };

    const fetchAvailablePaymentMethods = async () => {
        try {
            setLoadingPaymentMethods(true);
            const response = (await apiClient('/payment-methods')) as {
                success?: boolean;
                data?: PaymentMethod[];
            };
            if (response.success) {
                setAvailablePaymentMethods((response.data ?? []).filter((method: PaymentMethod) => method.is_active));
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
        } finally {
            setLoadingPaymentMethods(false);
        }
    };

    const fetchProductPaymentMethods = async (productId: number) => {
        try {
            setLoadingPaymentMethods(true);
            const response = (await apiClient(`/payment-methods/product/${productId}`)) as {
                success?: boolean;
                data?: PaymentMethod[];
            };
            if (response.success && Array.isArray(response.data)) {
                const methodIds = response.data.map((method: PaymentMethod) => method.id);
                setSelectedPaymentMethods(methodIds);
            }
        } catch (error) {
            console.error('Error fetching product payment methods:', error);
        } finally {
            setLoadingPaymentMethods(false);
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
        setPage(1);
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const clearFilters = () => {
        setPage(1);
        setSearchTerm('');
        setBrandQuery('');
        setLowStockOnly(false);
        setDiscountOnly(false);
        setEndingSoonOnly(false);
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
        setSelectedPaymentMethods([]);
        pendingMediaCloneFromId.current = null;
        setDuplicateImagePreview(null);
        setCustomRows([]);
        setFormTab('basics');
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            const custom_attributes = rowsToCustomAttributes(customRows);
            const {
                id: _omitId,
                media: _omitMedia,
                category: _omitCat,
                createdAt: _omitCa,
                updatedAt: _omitUa,
                additional_details: _omitAd,
                ...productPayload
            } = formData as Product & Record<string, unknown>;

            const productBody: Product = {
                ...(productPayload as Product),
                custom_attributes,
            };

            const productData = {
                product: productBody,
                additionalDetails,
            };

            const cloneFrom = pendingMediaCloneFromId.current;

            let productId: number | undefined;
            if (selectedProduct?.id) {
                const response = (await apiClient(`/product/products/${selectedProduct.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(productData),
                })) as { success?: boolean; message?: string };
                if (response?.success === false) {
                    toast.error(response.message || 'Update failed');
                    return;
                }
                productId = selectedProduct.id;
                toast.success('Product updated');
            } else {
                const response = (await apiClient('/product/products', {
                    method: 'POST',
                    body: JSON.stringify(productData),
                })) as { success?: boolean; data?: { id?: number }; message?: string };
                if (response?.success === false) {
                    toast.error(response.message || 'Create failed');
                    return;
                }
                const created = response.data as { id?: number } | undefined;
                productId = created?.id;
                toast.success('Product created');
            }

            if (productId) {
                await apiClient(`/payment-methods/product/${productId}`, {
                    method: 'POST',
                    body: JSON.stringify({ paymentMethodIds: selectedPaymentMethods }),
                });
            }

            if (!selectedProduct?.id && productId && cloneFrom) {
                const cr = (await apiClient(`/product/products/${productId}/clone-media`, {
                    method: 'POST',
                    body: JSON.stringify({ from_product_id: cloneFrom }),
                })) as { success?: boolean; message?: string; data?: { copied?: number } };
                if (cr.success === false) {
                    toast.error(cr.message || 'Images could not be copied from the original');
                } else if ((cr.data?.copied ?? 0) > 0) {
                    toast.success(`Copied ${cr.data?.copied} image(s) from the original product`);
                }
            }

            pendingMediaCloneFromId.current = null;
            setDuplicateImagePreview(null);

            setShowForm(false);
            resetForm();
            void fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Error saving product');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            setLoading(true);
            const res = (await apiClient(`/product/products/${id}`, { method: 'DELETE' })) as {
                success?: boolean;
                message?: string;
            };
            if (res?.success === false) {
                toast.error(res.message || 'Delete failed');
                return;
            }
            toast.success('Product deleted');
            void fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Error deleting product');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product: Product) => {
        pendingMediaCloneFromId.current = null;
        setDuplicateImagePreview(null);
        setSelectedProduct(product);
        setFormData({
            ...product,
            product_category_id: product.product_category_id,
        });

        if (product.additional_details) {
            setAdditionalDetails(product.additional_details);
        }

        setCustomRows(customAttributesToRows(product.custom_attributes ?? null));
        setFormTab('basics');
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

    const handlePaymentMethodToggle = (methodId: number) => {
        setSelectedPaymentMethods(prev => {
            if (prev.includes(methodId)) {
                return prev.filter(id => id !== methodId);
            } else {
                return [...prev, methodId];
            }
        });
    };

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, debouncedBrand]);

    const toggleSort = (field: string) => {
        setPage(1);
        if (sortBy === field) {
            setSortOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(field);
            setSortOrder(field === 'product_name' || field === 'product_brand' ? 'ASC' : 'DESC');
        }
    };

    const sortIndicator = (field: string) =>
        sortBy === field ? (sortOrder === 'ASC' ? <i className="bi bi-caret-up-fill" aria-hidden /> : <i className="bi bi-caret-down-fill" aria-hidden />) : null;

    const getRowThumbnail = (product: Product): string | undefined => {
        const primary = product.media?.find((m) => m.is_primary)?.media_data || product.media?.[0]?.media_data;
        if (primary) return primary;
        if (product.product_primary_image?.startsWith('data:') || product.product_primary_image?.startsWith('http')) {
            return product.product_primary_image;
        }
        return undefined;
    };

    const toggleRowSelected = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleSelectAllOnPage = () => {
        const ids = products.map((p) => p.id).filter((x): x is number => typeof x === 'number');
        const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
        setSelectedIds(allSelected ? selectedIds.filter((id) => !ids.includes(id)) : [...new Set([...selectedIds, ...ids])]);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Delete ${selectedIds.length} product(s)? This cannot be undone.`)) return;
        try {
            setLoading(true);
            for (const id of selectedIds) {
                const res = (await apiClient(`/product/products/${id}`, { method: 'DELETE' })) as { success?: boolean; message?: string };
                if (res?.success === false) {
                    toast.error(res.message || `Failed to delete #${id}`);
                    void fetchProducts();
                    return;
                }
            }
            toast.success('Selected products deleted');
            void fetchProducts();
        } catch {
            toast.error('Bulk delete failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicate = (product: Product) => {
        const {
            id: _omitId,
            createdAt: _omitC,
            updatedAt: _omitU,
            media: dupMedia,
            category: _omitCat,
            additional_details,
            ...core
        } = product;
        const baseName = product.product_name?.trim() || 'Product';
        const copyName = baseName.toLowerCase().includes('(copy)') ? `${baseName} ${Date.now()}` : `${baseName} (copy)`;
        setSelectedProduct(null);
        pendingMediaCloneFromId.current = product.id ?? null;
        const thumbs =
            dupMedia && dupMedia.length > 0
                ? [...dupMedia].sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary))
                : product.product_primary_image &&
                    (product.product_primary_image.startsWith('data:') || product.product_primary_image.startsWith('http'))
                  ? [{ media_data: product.product_primary_image, is_primary: true as const }]
                  : null;
        setDuplicateImagePreview(thumbs);

        setFormData({
            ...core,
            product_name: copyName,
            product_stock: Math.max(0, product.product_stock),
        });
        if (additional_details) {
            setAdditionalDetails({
                product_color: additional_details.product_color ?? '',
                product_size: additional_details.product_size ?? '',
                product_weight: additional_details.product_weight ?? 0,
                product_dimensions: additional_details.product_dimensions ?? '',
                product_material: additional_details.product_material ?? '',
                product_manufacturer: additional_details.product_manufacturer ?? '',
                product_origin: additional_details.product_origin ?? '',
            });
        }
        setCustomRows(customAttributesToRows(product.custom_attributes ?? null));
        setSelectedPaymentMethods([]);
        setFormTab('basics');
        setShowForm(true);
        toast('Duplicate draft — save to create the product; images copy from the original automatically.', {
            duration: 4500,
        });
    };

    const exportCsv = (mode: 'page' | 'selected') => {
        const rows =
            mode === 'selected' ? products.filter((p) => p.id && selectedIds.includes(p.id)) : products;
        if (rows.length === 0) {
            toast.error(mode === 'selected' ? 'No rows selected on this page' : 'Nothing to export');
            return;
        }
        const esc = (v: string | number | undefined | null) => {
            const s = v === undefined || v === null ? '' : String(v);
            if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
        };
        const header = ['id', 'name', 'brand', 'price', 'stock', 'category', 'discount_active', 'createdAt'];
        const lines = [
            header.join(','),
            ...rows.map((p) =>
                [
                    p.id,
                    p.product_name,
                    p.product_brand,
                    p.product_price,
                    p.product_stock,
                    p.category?.product_category ?? '',
                    p.product_discount_active ? 'yes' : 'no',
                    p.createdAt ?? '',
                ]
                    .map(esc)
                    .join(',')
            ),
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-${mode}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV downloaded');
    };

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

    const dealEndsInDays = (end?: string): number | null => {
        if (!end) return null;
        const t = new Date(end).getTime();
        if (Number.isNaN(t)) return null;
        return Math.ceil((t - Date.now()) / 86400000);
    };

    const copyStorefrontLink = async (productId: number) => {
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        const url = `${base}/product/${productId}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Storefront link copied');
        } catch {
            toast.error('Could not copy link');
        }
    };

    const handleBulkInventory = async () => {
        if (selectedIds.length === 0) {
            toast.error('Select at least one product');
            return;
        }
        const n = parseInt(bulkStockInput, 10);
        if (Number.isNaN(n) || (bulkMode === 'set' && n < 0)) {
            toast.error('Enter a valid non-negative number');
            return;
        }
        if (bulkMode === 'add' && n === 0) {
            toast.error('Enter a non-zero adjustment for add mode');
            return;
        }
        try {
            setLoading(true);
            const body =
                bulkMode === 'set'
                    ? { ids: selectedIds, set_stock: n }
                    : { ids: selectedIds, add_stock: n };
            const res = (await apiClient('/product/products/bulk-inventory', {
                method: 'POST',
                body: JSON.stringify(body),
            })) as { success?: boolean; message?: string };
            if (res?.success === false) {
                toast.error(res.message || 'Bulk update failed');
                return;
            }
            toast.success(res.message || 'Inventory updated');
            setBulkStockOpen(false);
            setBulkStockInput('');
            void fetchProducts();
        } catch {
            toast.error('Bulk inventory request failed');
        } finally {
            setLoading(false);
        }
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
                            type="button"
                        >
                            <i className="bi bi-funnel me-1" aria-hidden />
                            {showFilters ? 'Hide filters' : 'Show filters'}
                        </button>
                        <button 
                            className="add-product-btn" 
                            onClick={() => {
                                resetForm();
                                setDuplicateImagePreview(null);
                                pendingMediaCloneFromId.current = null;
                                setCustomRows([]);
                                setFormTab('basics');
                                setShowForm(true);
                            }}
                            type="button"
                        >
                            <i className="bi bi-plus-lg me-1" aria-hidden />
                            Add new product
                        </button>
                    </div>
                )}
            </div>
            
            {!showForm && (
                <>
                    <div className="product-controls">
                        <div className="search-box">
                            <i className="bi bi-search search-icon" aria-hidden />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="product-count">
                            {total} product{total !== 1 ? 's' : ''} match
                            {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}
                        </div>
                    </div>

                    <div className="list-toolbar-row">
                        <div className="toolbar-cluster">
                            <label className="toolbar-label">
                                Per page
                                <select
                                    className="toolbar-select"
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPage(1);
                                        setPageSize(Number(e.target.value));
                                    }}
                                >
                                    {[10, 15, 25, 50, 100].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <button type="button" className="toolbar-btn" onClick={() => exportCsv('page')}>
                                <i className="bi bi-download me-1" aria-hidden />
                                Export page (CSV)
                            </button>
                            <button
                                type="button"
                                className="toolbar-btn"
                                disabled={selectedIds.length === 0}
                                onClick={() => exportCsv('selected')}
                            >
                                <i className="bi bi-download me-1" aria-hidden />
                                Export selected
                            </button>
                            <button
                                type="button"
                                className="toolbar-btn"
                                disabled={selectedIds.length === 0}
                                onClick={() => setBulkStockOpen(true)}
                            >
                                <i className="bi bi-box-seam me-1" aria-hidden />
                                Bulk stock ({selectedIds.length})
                            </button>
                            <button
                                type="button"
                                className="toolbar-btn toolbar-btn-danger"
                                disabled={selectedIds.length === 0}
                                onClick={() => void handleBulkDelete()}
                            >
                                <i className="bi bi-trash me-1" aria-hidden />
                                Delete selected ({selectedIds.length})
                            </button>
                        </div>
                    </div>
                    
                    {showFilters && (
                        <div className="filter-panel">
                            <div className="filter-panel-header">
                                <h3>Filters</h3>
                                <button type="button" className="clear-filters" onClick={clearFilters}>Clear all</button>
                            </div>
                            <div className="filter-grid">
                                <div className="filter-group">
                                    <label>Category</label>
                                    <select 
                                        name="category"
                                        value={filters.category}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All categories</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.product_category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="filter-group">
                                    <label>Price range</label>
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
                                    <label>Stock status</label>
                                    <select
                                        name="stockStatus"
                                        value={filters.stockStatus}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="all">All</option>
                                        <option value="in-stock">In stock</option>
                                        <option value="out-of-stock">Out of stock</option>
                                    </select>
                                </div>
                                
                                <div className="filter-group">
                                    <label>Added after</label>
                                    <input
                                        type="date"
                                        name="dateAdded"
                                        value={filters.dateAdded}
                                        onChange={handleFilterChange}
                                    />
                                </div>

                                <div className="filter-group">
                                    <label htmlFor="brand-filter">Brand contains</label>
                                    <input
                                        id="brand-filter"
                                        type="text"
                                        placeholder="Filter by brand…"
                                        value={brandQuery}
                                        onChange={(e) => setBrandQuery(e.target.value)}
                                    />
                                </div>

                                <div className="filter-group filter-group-checkboxes">
                                    <label className="checkbox-inline">
                                        <input
                                            type="checkbox"
                                            checked={lowStockOnly}
                                            onChange={(e) => {
                                                setPage(1);
                                                setLowStockOnly(e.target.checked);
                                            }}
                                        />
                                        Low stock (1–10 units, in stock)
                                    </label>
                                    <label className="checkbox-inline">
                                        <input
                                            type="checkbox"
                                            checked={discountOnly}
                                            onChange={(e) => {
                                                setPage(1);
                                                setDiscountOnly(e.target.checked);
                                            }}
                                        />
                                        Active discount only
                                    </label>
                                    <label className="checkbox-inline">
                                        <input
                                            type="checkbox"
                                            checked={endingSoonOnly}
                                            onChange={(e) => {
                                                setPage(1);
                                                setEndingSoonOnly(e.target.checked);
                                            }}
                                        />
                                        Deal ending in 7 days
                                    </label>
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
                                            <th className="th-narrow">
                                                <input
                                                    type="checkbox"
                                                    aria-label="Select all on this page"
                                                    checked={
                                                        products.length > 0 &&
                                                        products.every((p) => p.id != null && selectedIds.includes(p.id!))
                                                    }
                                                    onChange={toggleSelectAllOnPage}
                                                />
                                            </th>
                                            <th className="th-narrow">Image</th>
                                            <th>
                                                <button type="button" className="sortable-th" onClick={() => toggleSort('product_name')}>
                                                    Name {sortIndicator('product_name')}
                                                </button>
                                            </th>
                                            <th>
                                                <button type="button" className="sortable-th" onClick={() => toggleSort('product_brand')}>
                                                    Brand {sortIndicator('product_brand')}
                                                </button>
                                            </th>
                                            <th>
                                                <button type="button" className="sortable-th" onClick={() => toggleSort('product_price')}>
                                                    Price {sortIndicator('product_price')}
                                                </button>
                                            </th>
                                            <th>
                                                <button type="button" className="sortable-th" onClick={() => toggleSort('product_stock')}>
                                                    Stock {sortIndicator('product_stock')}
                                                </button>
                                            </th>
                                            <th>Category</th>
                                            <th>
                                                <button type="button" className="sortable-th" onClick={() => toggleSort('createdAt')}>
                                                    Created {sortIndicator('createdAt')}
                                                </button>
                                            </th>
                                            <th>
                                                <button type="button" className="sortable-th" onClick={() => toggleSort('updatedAt')}>
                                                    Updated {sortIndicator('updatedAt')}
                                                </button>
                                            </th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.length > 0 ? (
                                            products.map((product) => {
                                                const discountDaysLeft = dealEndsInDays(product.product_discount_end);
                                                return (
                                                <tr key={product.id}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            aria-label={`Select ${product.product_name}`}
                                                            checked={product.id != null && selectedIds.includes(product.id)}
                                                            onChange={() => product.id != null && toggleRowSelected(product.id)}
                                                        />
                                                    </td>
                                                    <td>
                                                        {getRowThumbnail(product) ? (
                                                            <img
                                                                className="product-thumb"
                                                                src={getRowThumbnail(product)}
                                                                alt=""
                                                                width={40}
                                                                height={40}
                                                            />
                                                        ) : (
                                                            <span className="product-thumb-placeholder" title="No image">
                                                                <i className="bi bi-image" aria-hidden />
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="product-name-cell">
                                                        <div className="product-name-row">
                                                            <span className="product-name">{product.product_name}</span>
                                                            <button
                                                                type="button"
                                                                className="quick-view-btn"
                                                                title="Quick view"
                                                                onClick={() => setQuickView(product)}
                                                            >
                                                                <i className="bi bi-eye" aria-hidden />
                                                            </button>
                                                        </div>
                                                        <div className="amazon-badges">
                                                            {product.product_stock > 0 && product.product_stock <= 10 ? (
                                                                <span className="deal-badge deal-badge--warn">Low stock</span>
                                                            ) : null}
                                                            {product.product_discount_active &&
                                                            discountDaysLeft != null &&
                                                            discountDaysLeft <= 7 &&
                                                            discountDaysLeft >= 0 ? (
                                                                <span className="deal-badge deal-badge--urgent">
                                                                    Ends in {discountDaysLeft}d
                                                                </span>
                                                            ) : null}
                                                            {product.product_discount_active &&
                                                            product.product_discount_percentage != null &&
                                                            product.product_discount_percentage > 0 ? (
                                                                <span className="deal-badge">
                                                                    −{Math.round(Number(product.product_discount_percentage))}%
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td>{product.product_brand}</td>
                                                    <td>
                                                        <div className="price-cell">
                                                            {formatPrice(product.product_price)}
                                                            {product.product_discount_active ? (
                                                                <span className="sale-pill">Sale</span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`stock-badge ${product.product_stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                                            {product.product_stock > 0 ? product.product_stock : 'Out of stock'}
                                                        </span>
                                                    </td>
                                                    <td>{product.category?.product_category || ''}</td>
                                                    <td>{formatDate(product.createdAt)}</td>
                                                    <td>{formatDate(product.updatedAt)}</td>
                                                    <td className="action-buttons">
                                                        {product.id != null ? (
                                                            <button
                                                                type="button"
                                                                className="ghost-link-btn"
                                                                onClick={() => void copyStorefrontLink(product.id!)}
                                                            >
                                                                Copy link
                                                            </button>
                                                        ) : null}
                                                        {product.id != null ? (
                                                            <Link className="view-store-btn" href={`/product/${product.id}`} target="_blank" rel="noopener noreferrer">
                                                                View
                                                            </Link>
                                                        ) : null}
                                                        <button 
                                                            type="button"
                                                            className="edit-btn"
                                                            onClick={() => handleEdit(product)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="edit-btn duplicate-btn"
                                                            onClick={() => handleDuplicate(product)}
                                                        >
                                                            Duplicate
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            className="delete-btn"
                                                            onClick={() => product.id && handleDelete(product.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={10} className="no-products">
                                                    No products found. Try adjusting filters or add a new product.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {!loading && totalPages > 1 && (
                        <div className="pagination-bar">
                            <button
                                type="button"
                                className="toolbar-btn"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <i className="bi bi-chevron-left" aria-hidden /> Previous
                            </button>
                            <span className="pagination-meta">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                type="button"
                                className="toolbar-btn"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                                Next <i className="bi bi-chevron-right" aria-hidden />
                            </button>
                        </div>
                    )}

                    {bulkStockOpen && (
                        <div
                            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                            role="presentation"
                            onClick={() => setBulkStockOpen(false)}
                        >
                            <div
                                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl ring-1 ring-slate-900/5"
                                role="dialog"
                                aria-labelledby="bulk-stock-title"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="mb-4 flex items-start justify-between gap-3">
                                    <div>
                                        <h3 id="bulk-stock-title" className="text-lg font-bold text-slate-900">
                                            Bulk inventory
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Applies to {selectedIds.length} selected product{selectedIds.length !== 1 ? 's' : ''}{' '}
                                            (max 200 per request).
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                        aria-label="Close"
                                        onClick={() => setBulkStockOpen(false)}
                                    >
                                        <i className="bi bi-x-lg" />
                                    </button>
                                </div>
                                <div className="mb-4 flex flex-col gap-2">
                                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                                        <input
                                            type="radio"
                                            name="bulkMode"
                                            className="h-4 w-4 border-slate-300 text-brand-primary focus:ring-brand-primary"
                                            checked={bulkMode === 'set'}
                                            onChange={() => setBulkMode('set')}
                                        />
                                        Set stock to absolute value
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                                        <input
                                            type="radio"
                                            name="bulkMode"
                                            className="h-4 w-4 border-slate-300 text-brand-primary focus:ring-brand-primary"
                                            checked={bulkMode === 'add'}
                                            onChange={() => setBulkMode('add')}
                                        />
                                        Add (or subtract) from current stock
                                    </label>
                                </div>
                                <input
                                    type="number"
                                    className="mb-5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-brand-primary/30 placeholder:text-slate-400 focus:border-brand-primary focus:ring-2"
                                    placeholder={bulkMode === 'set' ? 'e.g. 50' : 'e.g. 10 or −2'}
                                    value={bulkStockInput}
                                    onChange={(e) => setBulkStockInput(e.target.value)}
                                    min={bulkMode === 'set' ? 0 : undefined}
                                />
                                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        onClick={() => setBulkStockOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95"
                                        onClick={() => void handleBulkInventory()}
                                    >
                                        Apply changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {quickView && (
                        <div
                            className="fixed inset-0 z-[110] bg-slate-950/50 backdrop-blur-[2px]"
                            role="presentation"
                            onClick={() => setQuickView(null)}
                        >
                            <aside
                                className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                                role="dialog"
                                aria-label="Product quick view"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                    <h3 className="text-base font-bold text-slate-900">Quick view</h3>
                                    <button
                                        type="button"
                                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                                        onClick={() => setQuickView(null)}
                                        aria-label="Close"
                                    >
                                        <i className="bi bi-x-lg" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto px-5 py-4">
                                    {getRowThumbnail(quickView) ? (
                                        <img
                                            className="mb-4 max-h-48 w-full rounded-xl border border-slate-100 object-contain"
                                            src={getRowThumbnail(quickView)}
                                            alt=""
                                        />
                                    ) : (
                                        <div className="mb-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-3xl text-slate-300">
                                            <i className="bi bi-image" />
                                        </div>
                                    )}
                                    <p className="text-lg font-semibold text-slate-900">{quickView.product_name}</p>
                                    <p className="text-sm text-slate-500">{quickView.product_brand}</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatPrice(quickView.product_price)}</p>
                                    <dl className="mt-4 space-y-2 text-sm">
                                        <div className="flex justify-between gap-4 border-b border-slate-50 py-2">
                                            <dt className="text-slate-500">Stock</dt>
                                            <dd className="font-semibold text-slate-900">{quickView.product_stock}</dd>
                                        </div>
                                        <div className="flex justify-between gap-4 border-b border-slate-50 py-2">
                                            <dt className="text-slate-500">Category</dt>
                                            <dd className="font-semibold text-slate-900">{quickView.category?.product_category ?? '—'}</dd>
                                        </div>
                                        {quickView.product_discount_end ? (
                                            <div className="flex justify-between gap-4 py-2">
                                                <dt className="text-slate-500">Discount ends</dt>
                                                <dd className="font-semibold text-slate-900">{formatDate(quickView.product_discount_end)}</dd>
                                            </div>
                                        ) : null}
                                    </dl>
                                    <div className="mt-6 flex flex-col gap-2">
                                        {quickView.id != null ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                                    onClick={() => void copyStorefrontLink(quickView.id!)}
                                                >
                                                    Copy storefront link
                                                </button>
                                                <Link
                                                    className="flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-900 no-underline hover:bg-emerald-100"
                                                    href={`/product/${quickView.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Open storefront
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="w-full rounded-xl bg-brand-primary py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95"
                                                    onClick={() => {
                                                        setQuickView(null);
                                                        handleEdit(quickView);
                                                    }}
                                                >
                                                    Edit in catalog
                                                </button>
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}
                </>
            )}
            
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/55 px-3 py-6 backdrop-blur-sm sm:px-5">
                    <div
                        className="relative my-1 w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/5"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="product-editor-title"
                    >
                        <button
                            type="button"
                            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            aria-label="Close editor"
                            onClick={() => {
                                setShowForm(false);
                                resetForm();
                            }}
                        >
                            <i className="bi bi-x-lg text-lg" />
                        </button>
                        <div className="max-h-[min(92vh,900px)] overflow-y-auto px-4 pb-8 pt-14 sm:px-7">
                            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-4">
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                                    onClick={() => {
                                        setShowForm(false);
                                        resetForm();
                                    }}
                                >
                                    <i className="bi bi-arrow-left" aria-hidden />
                                    Back
                                </button>
                                <h2 id="product-editor-title" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                    {selectedProduct?.id ? 'Edit product' : 'New product'}
                                </h2>
                                {selectedProduct?.id != null ? (
                                    <Link
                                        className="ml-auto inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800 no-underline hover:bg-indigo-100"
                                        href={`/product/${selectedProduct.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <i className="bi bi-box-arrow-up-right" aria-hidden />
                                        Storefront
                                    </Link>
                                ) : null}
                            </div>
                            {duplicateImagePreview && duplicateImagePreview.length > 0 ? (
                                <div
                                    className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/80 px-4 py-3 text-amber-950"
                                    role="status"
                                >
                                    <div className="min-w-0 flex-1 text-sm">
                                        <p className="font-bold">Duplicate draft</p>
                                        <p className="text-amber-900/90">Gallery copies from the original when you save.</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {duplicateImagePreview.slice(0, 8).map((m, i) =>
                                            m.media_data ? (
                                                <img
                                                    key={i}
                                                    src={m.media_data}
                                                    alt=""
                                                    className="h-11 w-11 rounded-lg border border-amber-300/80 object-cover"
                                                />
                                            ) : null
                                        )}
                                    </div>
                                </div>
                            ) : null}
                            <nav
                                className="mt-4 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1.5"
                                aria-label="Product form sections"
                            >
                                {(
                                    [
                                        { id: 'basics' as const, label: 'Overview', icon: 'bi-grid' },
                                        { id: 'specs' as const, label: 'Specs', icon: 'bi-rulers' },
                                        { id: 'custom' as const, label: 'Custom', icon: 'bi-braces' },
                                        { id: 'discount' as const, label: 'Promotions', icon: 'bi-percent' },
                                        { id: 'media' as const, label: 'Media', icon: 'bi-images' },
                                        { id: 'payments' as const, label: 'Payments', icon: 'bi-credit-card' },
                                    ] as const
                                ).map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                                            formTab === t.id
                                                ? 'bg-white text-brand-primary shadow-sm ring-1 ring-slate-200/80'
                                                : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                                        }`}
                                        onClick={() => setFormTab(t.id)}
                                    >
                                        <i className={`bi ${t.icon}`} aria-hidden />
                                        {t.label}
                                    </button>
                                ))}
                            </nav>
                            <form
                                onSubmit={handleCreateOrUpdate}
                                className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-6"
                            >
                        {formTab === 'basics' && (
                        <div className={pmSection}>
                            <h3 className={pmSectionTitle}>Basic information</h3>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="product_name" className={pmLabel}>Product name *</label>
                                <input
                                    type="text"
                                    id="product_name"
                                    name="product_name"
                                    className={pmField}
                                    value={formData.product_name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="product_description" className={pmLabel}>Description *</label>
                                <textarea
                                    id="product_description"
                                    name="product_description"
                                    className={pmTextarea}
                                    value={formData.product_description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    required
                                />
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="product_category_id" className={pmLabel}>Category *</label>
                                <select
                                    id="product_category_id"
                                    name="product_category_id"
                                    className={pmField}
                                    value={formData.product_category_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.product_category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className={pmGrid3}>
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="product_price" className={pmLabel}>Price *</label>
                                    <input
                                        type="number"
                                        id="product_price"
                                        name="product_price"
                                        className={pmField}
                                        value={formData.product_price}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="product_stock" className={pmLabel}>Stock *</label>
                                    <input
                                        type="number"
                                        id="product_stock"
                                        name="product_stock"
                                        className={pmField}
                                        value={formData.product_stock}
                                        onChange={handleInputChange}
                                        min="0"
                                        required
                                    />
                                </div>
                                
                                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                                    <label htmlFor="product_brand" className={pmLabel}>Brand *</label>
                                    <input
                                        type="text"
                                        id="product_brand"
                                        name="product_brand"
                                        className={pmField}
                                        value={formData.product_brand}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        )}

                        {formTab === 'discount' && (
                        <div className={pmSection}>
                            <h3 className={pmSectionTitle}>Discount</h3>
                            <label
                                htmlFor="product_discount"
                                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 hover:bg-slate-100/80"
                            >
                                <input
                                    type="checkbox"
                                    id="product_discount"
                                    name="product_discount"
                                    className={pmCheckbox}
                                    checked={formData.product_discount}
                                    onChange={handleInputChange}
                                />
                                <span className="text-sm font-medium text-slate-800">Apply discount</span>
                            </label>
                            
                            {formData.product_discount && (
                                <>
                                    <div className={pmGrid2}>
                                        <div className="flex flex-col gap-1.5">
                                            <label htmlFor="product_discount_price" className={pmLabel}>Discount price</label>
                                            <input
                                                type="number"
                                                id="product_discount_price"
                                                name="product_discount_price"
                                                className={pmField}
                                                value={formData.product_discount_price || ''}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                            />
                                            <p className={pmHint}>Enter discount price to auto-calculate percentage.</p>
                                        </div>
                                        
                                        <div className="flex flex-col gap-1.5">
                                            <label htmlFor="product_discount_percentage" className={pmLabel}>Discount %</label>
                                            <input
                                                type="number"
                                                id="product_discount_percentage"
                                                name="product_discount_percentage"
                                                className={pmField}
                                                value={formData.product_discount_percentage || ''}
                                                onChange={handleInputChange}
                                                min="0"
                                                max="100"
                                            />
                                            <p className={pmHint}>Enter percentage to auto-calculate discount price.</p>
                                        </div>
                                    </div>
                                    
                                    <div className={pmGrid2}>
                                        <div className="flex flex-col gap-1.5">
                                            <label htmlFor="product_discount_start" className={pmLabel}>Start date</label>
                                            <input
                                                type="date"
                                                id="product_discount_start"
                                                name="product_discount_start"
                                                className={pmField}
                                                value={formData.product_discount_start || ''}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        
                                        <div className="flex flex-col gap-1.5">
                                            <label htmlFor="product_discount_end" className={pmLabel}>End date</label>
                                            <input
                                                type="date"
                                                id="product_discount_end"
                                                name="product_discount_end"
                                                className={pmField}
                                                value={formData.product_discount_end || ''}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="product_discount_code" className={pmLabel}>Discount code</label>
                                        <input
                                            type="text"
                                            id="product_discount_code"
                                            name="product_discount_code"
                                            className={pmField}
                                            value={formData.product_discount_code || ''}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    
                                    <label
                                        htmlFor="product_discount_active"
                                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 hover:bg-slate-100/80"
                                    >
                                        <input
                                            type="checkbox"
                                            id="product_discount_active"
                                            name="product_discount_active"
                                            className={pmCheckbox}
                                            checked={formData.product_discount_active || false}
                                            onChange={handleInputChange}
                                        />
                                        <span className="text-sm font-medium text-slate-800">Discount active</span>
                                    </label>
                                </>
                            )}
                        </div>
                        )}

                        {formTab === 'specs' && (
                        <div className={pmSection}>
                            <h3 className={pmSectionTitle}>Additional details</h3>
                            <div className={pmGrid2}>
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="additional_product_color" className={pmLabel}>Color</label>
                                    <input
                                        type="text"
                                        id="additional_product_color"
                                        name="additional_product_color"
                                        className={pmField}
                                        value={additionalDetails.product_color || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="additional_product_size" className={pmLabel}>Size</label>
                                    <input
                                        type="text"
                                        id="additional_product_size"
                                        name="additional_product_size"
                                        className={pmField}
                                        value={additionalDetails.product_size || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            
                            <div className={pmGrid2}>
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="additional_product_weight" className={pmLabel}>Weight</label>
                                    <input
                                        type="number"
                                        id="additional_product_weight"
                                        name="additional_product_weight"
                                        className={pmField}
                                        value={additionalDetails.product_weight || ''}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="additional_product_dimensions" className={pmLabel}>Dimensions</label>
                                    <input
                                        type="text"
                                        id="additional_product_dimensions"
                                        name="additional_product_dimensions"
                                        className={pmField}
                                        value={additionalDetails.product_dimensions || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            
                            <div className={pmGrid2}>
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="additional_product_material" className={pmLabel}>Material</label>
                                    <input
                                        type="text"
                                        id="additional_product_material"
                                        name="additional_product_material"
                                        className={pmField}
                                        value={additionalDetails.product_material || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="additional_product_manufacturer" className={pmLabel}>Manufacturer</label>
                                    <input
                                        type="text"
                                        id="additional_product_manufacturer"
                                        name="additional_product_manufacturer"
                                        className={pmField}
                                        value={additionalDetails.product_manufacturer || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="additional_product_origin" className={pmLabel}>Country of origin</label>
                                <input
                                    type="text"
                                    id="additional_product_origin"
                                    name="additional_product_origin"
                                    className={pmField}
                                    value={additionalDetails.product_origin || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="warranty" className={pmLabel}>Warranty</label>
                                <input
                                    type="text"
                                    id="warranty"
                                    name="warranty"
                                    className={pmField}
                                    value={formData.warranty || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                        )}

                        {formTab === 'custom' && (
                        <div className={pmSection}>
                            <h3 className={pmSectionTitle}>Custom attributes</h3>
                            <p className={`${pmHint} mb-2`}>
                                Optional key/value data stored on the product JSON column (e.g. <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">badge_text</code>,{' '}
                                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">care</code>, <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">warranty_notes</code>). Empty keys are ignored.
                            </p>
                            <div className="flex flex-col gap-2">
                                {customRows.length === 0 ? (
                                    <p className="text-sm text-slate-500">No custom fields yet. Add rows for anything not covered by specs.</p>
                                ) : (
                                    customRows.map((row, idx) => (
                                        <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
                                            <input
                                                type="text"
                                                placeholder="Field name"
                                                className={pmField}
                                                value={row.key}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setCustomRows((prev) => prev.map((r, i) => (i === idx ? { ...r, key: v } : r)));
                                                }}
                                                aria-label={`Custom field name ${idx + 1}`}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Value"
                                                className={pmField}
                                                value={row.value}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setCustomRows((prev) => prev.map((r, i) => (i === idx ? { ...r, value: v } : r)));
                                                }}
                                                aria-label={`Custom field value ${idx + 1}`}
                                            />
                                            <button
                                                type="button"
                                                className="flex h-10 w-10 items-center justify-center justify-self-start rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 sm:justify-self-end"
                                                onClick={() => setCustomRows((prev) => prev.filter((_, i) => i !== idx))}
                                                aria-label="Remove row"
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <button
                                type="button"
                                className="mt-1 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                                onClick={() => setCustomRows((prev) => [...prev, { key: '', value: '' }])}
                            >
                                <i className="bi bi-plus-lg" aria-hidden /> Add field
                            </button>
                        </div>
                        )}

                        {formTab === 'payments' && (
                        <div className={pmSection}>
                            <h3 className={pmSectionTitle}>Payment methods</h3>
                            <p className={pmHint}>Select which payment methods are allowed for this product.</p>
                            
                            {loadingPaymentMethods ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                                    Loading payment methods…
                                </div>
                            ) : availablePaymentMethods.length === 0 ? (
                                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                                    No payment methods available. Add payment methods in settings first.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {availablePaymentMethods.map((method) => {
                                        const checked = selectedPaymentMethods.includes(method.id);
                                        return (
                                        <label
                                            key={method.id}
                                            htmlFor={`payment-method-${method.id}`}
                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 shadow-sm transition ${
                                                checked
                                                    ? 'border-brand-primary bg-brand-primary/[0.06] ring-2 ring-brand-primary/25'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                id={`payment-method-${method.id}`}
                                                className={pmCheckbox}
                                                checked={checked}
                                                onChange={() => handlePaymentMethodToggle(method.id)}
                                            />
                                            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-slate-800">
                                                {method.icon ? (
                                                    <span className="text-lg leading-none" aria-hidden>{method.icon}</span>
                                                ) : null}
                                                <span className="truncate">{method.name}</span>
                                            </span>
                                        </label>
                                        );
                                    })}
                                </div>
                            )}
                            <p className={`${pmHint} italic`}>
                                If none are selected, all available payment methods are allowed.
                            </p>
                        </div>
                        )}

                        {formTab === 'media' && (
                            <div className={pmSection}>
                                <h3 className={pmSectionTitle}>Product images</h3>
                                {selectedProduct?.id ? (
                                    <>
                                <p className="text-sm text-slate-600">
                                    Maximum of 10 images per product.
                                    {productMedia.length >= 10 && (
                                        <span className="ml-1 font-semibold text-red-600">Limit reached.</span>
                                    )}
                                </p>
                                
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Primary image</h4>
                                        <label className={pmFileDrop}>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/gif"
                                                className={pmFileInput}
                                                onChange={(e) => handleUploadImage(e, true)}
                                                disabled={uploading || productMedia.length >= 10}
                                                ref={fileInputRef}
                                            />
                                            <span className="font-medium text-slate-800">Drop a file or click to browse</span>
                                            <span className="mt-1 text-xs text-slate-500">JPEG, PNG, or GIF</span>
                                            {uploading && (
                                                <span className="mt-2 text-xs font-semibold text-brand-primary">Uploading…</span>
                                            )}
                                        </label>
                                        {uploadError ? <p className="text-sm font-medium text-red-600">{uploadError}</p> : null}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Additional images</h4>
                                        <label className={pmFileDrop}>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/gif"
                                                className={pmFileInput}
                                                onChange={(e) => handleUploadImage(e, false)}
                                                disabled={uploading || productMedia.length >= 10}
                                            />
                                            <span className="font-medium text-slate-800">Drop a file or click to browse</span>
                                            <span className="mt-1 text-xs text-slate-500">JPEG, PNG, or GIF</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div className="mt-2 space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Current images</h4>
                                    {productMedia.length === 0 ? (
                                        <p className="text-sm text-slate-500">No images uploaded yet.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                            {productMedia.map((media) => (
                                                <div
                                                    key={media.id}
                                                    className={`group relative aspect-square overflow-hidden rounded-xl border bg-slate-50 ${
                                                        media.is_primary
                                                            ? 'border-brand-primary ring-2 ring-brand-primary/30'
                                                            : 'border-slate-200'
                                                    }`}
                                                >
                                                    {media.is_primary ? (
                                                        <span className="absolute left-1.5 top-1.5 z-10 rounded bg-brand-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                                            Primary
                                                        </span>
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-bold leading-none text-white shadow hover:bg-red-700"
                                                        onClick={() => handleDeleteImage(media.id)}
                                                        aria-label="Remove image"
                                                    >
                                                        ×
                                                    </button>
                                                    {media.media_data ? (
                                                        <img
                                                            src={media.media_data}
                                                            alt="Product"
                                                            className="h-full w-full object-contain p-1"
                                                        />
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                    </>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
                                        <p>Save the product first to upload and manage gallery images here.</p>
                                        {duplicateImagePreview && duplicateImagePreview.length > 0 ? (
                                            <p className="mt-2 text-xs text-slate-500">
                                                When you save a duplicate, images from the source product are copied automatically to the new product.
                                            </p>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex min-w-[140px] items-center justify-center rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? 'Saving…' : selectedProduct ? 'Save changes' : 'Create product'}
                            </button>
                            <button
                                type="button"
                                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}