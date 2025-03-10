'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/app/utils/apiClient';
import Image from 'next/image';
import { useCart } from '@/app/context/CartContext';
import { toast } from 'react-hot-toast';
import './ProductID.scss';

interface ProductMedia {
  id: number;
  media_type: string;
  is_primary: boolean;
  media_data: string;
}

interface ProductAdditionalDetails {
  product_color?: string;
  product_size?: string;
  product_weight?: number;
  product_dimensions?: string;
  product_material?: string;
  product_manufacturer?: string;
  product_origin?: string;
}

interface Category {
  id: number;
  product_category: string;
}

interface ProductData {
  id: number;
  product_name: string;
  product_description: string;
  product_price: number;
  product_brand: string;
  product_stock: number;
  product_discount_active: boolean;
  product_discount_price?: number;
  product_discount_percentage?: number;
  warranty?: string;
  media: ProductMedia[];
  additional_details?: ProductAdditionalDetails;
  category?: Category;
  createdAt: string;
}

interface ProductDetailProps {
  productId: number;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ productId }) => {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient(`/product/products/${productId}`, {
          skipAuth: true
        });
        
        if (response.success && response.data) {
          setProduct(response.data);
          
          // Set the initial selected image to primary image or first image
          if (response.data.media && response.data.media.length > 0) {
            const primaryImage = response.data.media.find(img => img.is_primary);
            setSelectedImage(primaryImage ? primaryImage.media_data : response.data.media[0].media_data);
          }
        } else {
          setError('Failed to load product data');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Error loading product. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
      toast.success(`${quantity} x ${product.product_name} added to cart`);
    }
  };

  const handleQuantityChange = (value: number) => {
    if (value >= 1 && value <= (product?.product_stock || 10)) {
      setQuantity(value);
    }
  };

  // Updated formatPrice function to handle any input type
  const formatPrice = (price?: number | string | null): string => {
    if (price === undefined || price === null) return '$0.00';
    
    // Convert string prices to numbers
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    // Check if valid number after conversion
    if (isNaN(numericPrice)) return '$0.00';
    
    return `$${numericPrice.toFixed(2)}`;
  };

  if (loading) {
    return <div className="product-detail-loading">Loading product details...</div>;
  }

  if (error || !product) {
    return <div className="product-detail-error">{error || 'Product not found'}</div>;
  }

  const discountPercentage = product.product_discount_percentage || 
    (product.product_discount_active && product.product_discount_price ? 
      Math.round(((product.product_price - product.product_discount_price) / product.product_price) * 100) : 0);

  return (
    <div className="product-detail-container">
      <div className="product-detail-grid">
        {/* Product Images */}
        <div className="product-images">
          <div className="main-image">
            {selectedImage ? (
              <Image 
                src={selectedImage} 
                alt={product.product_name}
                width={500}
                height={500}
                className="product-img"
                priority
              />
            ) : (
              <div className="product-img-placeholder">No image available</div>
            )}
            
            {product.product_discount_active && discountPercentage > 0 && (
              <div className="discount-badge">-{discountPercentage}%</div>
            )}
          </div>
          
          {product.media && product.media.length > 1 && (
            <div className="thumbnail-gallery">
              {product.media.map((img) => (
                <div 
                  key={img.id} 
                  className={`thumbnail ${selectedImage === img.media_data ? 'active' : ''}`}
                  onClick={() => setSelectedImage(img.media_data)}
                >
                  <Image 
                    src={img.media_data} 
                    alt={`${product.product_name} thumbnail`}
                    width={80}
                    height={80}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info">
          <h1 className="product-title">{product.product_name}</h1>
          
          <div className="product-meta">
            <span className="product-brand">Brand: <strong>{product.product_brand}</strong></span>
            {product.category && (
              <span className="product-category">Category: <strong>{product.category.product_category}</strong></span>
            )}
          </div>
          
          <div className="product-price-container">
            {product.product_discount_active && product.product_discount_price ? (
              <>
                <span className="discount-price">{formatPrice(product.product_discount_price)}</span>
                <span className="original-price">{formatPrice(product.product_price)}</span>
                <span className="discount-tag">-{discountPercentage}%</span>
              </>
            ) : (
              <span className="regular-price">{formatPrice(product.product_price)}</span>
            )}
          </div>
          
          <div className="product-stock">
            <span className={product.product_stock > 0 ? "in-stock" : "out-of-stock"}>
              {product.product_stock > 0 ? `In Stock (${product.product_stock} available)` : "Out of Stock"}
            </span>
          </div>
          
          <div className="product-description">
            <h3>Description</h3>
            <div className="description-content">
              {product.product_description}
            </div>
          </div>
          
          {product.additional_details && Object.values(product.additional_details).some(x => x) && (
            <div className="product-specs">
              <h3>Specifications</h3>
              <ul className="specs-list">
                {product.additional_details.product_color && (
                  <li><span>Color:</span> {product.additional_details.product_color}</li>
                )}
                {product.additional_details.product_size && (
                  <li><span>Size:</span> {product.additional_details.product_size}</li>
                )}
                {product.additional_details.product_weight && (
                  <li><span>Weight:</span> {product.additional_details.product_weight}g</li>
                )}
                {product.additional_details.product_dimensions && (
                  <li><span>Dimensions:</span> {product.additional_details.product_dimensions}</li>
                )}
                {product.additional_details.product_material && (
                  <li><span>Material:</span> {product.additional_details.product_material}</li>
                )}
                {product.additional_details.product_manufacturer && (
                  <li><span>Manufacturer:</span> {product.additional_details.product_manufacturer}</li>
                )}
                {product.additional_details.product_origin && (
                  <li><span>Country of Origin:</span> {product.additional_details.product_origin}</li>
                )}
              </ul>
            </div>
          )}

          {product.warranty && (
            <div className="product-warranty">
              <h3>Warranty</h3>
              <p>{product.warranty}</p>
            </div>
          )}
          
          <div className="product-actions">
            <div className="quantity-selector">
              <button 
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="quantity-btn"
              >
                -
              </button>
              <input 
                type="number" 
                value={quantity} 
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)} 
                min="1" 
                max={product.product_stock || 10}
              />
              <button 
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= (product.product_stock || 10)}
                className="quantity-btn"
              >
                +
              </button>
            </div>
            
            <button 
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={product.product_stock <= 0}
            >
              {product.product_stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
