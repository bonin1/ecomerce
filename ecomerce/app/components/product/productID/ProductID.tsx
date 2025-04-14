'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/app/utils/apiClient';
import Image from 'next/image';
import { useCart } from '@/app/context/CartContext';
import { toast } from 'react-hot-toast';
import './ProductID.scss';
import ProductReviews from '@/app/components/reviews/ProductReviews';

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

interface PaymentMethod {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  processing_time?: string;
  fee_percentage?: number;
  fee_fixed?: number;
  min_amount?: number;
  max_amount?: number;
  display_order: number;
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
  const [activeTab, setActiveTab] = useState('description');
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const productInfoRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  const magnificationLevel = 2.5; 
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null);

  const placeholderImage = '/placeholder-image.jpg';

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
          
          const productData = response.data;
          
          if (productData.media && Array.isArray(productData.media)) {
            const validMedia = productData.media.filter((item: ProductMedia) => 
              item && item.media_data && typeof item.media_data === 'string' && 
              item.media_data.startsWith('data:')
            );
            
            
            if (validMedia.length > 0) {
              const primaryImage = validMedia.find((img: ProductMedia) => img.is_primary);
              if (primaryImage) {
                console.log("Setting primary image:", primaryImage.id);
                setSelectedImage(primaryImage.media_data);
              } else {
                console.log("Setting first image:", validMedia[0].id);
                setSelectedImage(validMedia[0].media_data);
              }
            } else {
              console.warn("No valid images found for this product");
              setSelectedImage(placeholderImage);
            }
          } else {
            console.warn("No media array found for this product");
            setSelectedImage(placeholderImage);
          }
        } else {
          console.error("API returned unsuccessful response or no data:", response);
          setError('Failed to load product data');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(`Error loading product: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (productId) {
      fetchProduct();
    }
  }, [productId, placeholderImage]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!productId) return;
      
      try {
        setPaymentMethodsLoading(true);
        setPaymentMethodsError(null);
        
        const response = await apiClient(`/payment-methods/product/${productId}`, {
          skipAuth: true
        });
        
        if (response.success && response.data) {
          setPaymentMethods(response.data);
        } else {
          console.warn("Failed to load payment methods or no payment methods available");
          setPaymentMethods([]);
        }
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        setPaymentMethodsError(`Error loading payment methods: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setPaymentMethods([]);
      } finally {
        setPaymentMethodsLoading(false);
      }
    };
    
    if (productId) {
      fetchPaymentMethods();
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

  const formatPrice = (price?: number | string | null): string => {
    if (price === undefined || price === null) return '$0.00';
    
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numericPrice)) return '$0.00';
    
    return `$${numericPrice.toFixed(2)}`;
  };

  const isValidImage = (src: any): boolean => {
    return (
      src && 
      typeof src === 'string' && 
      (src.startsWith('data:') || src.startsWith('http') || src.startsWith('/'))
    );
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !imageRef.current) return;
    
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    
    // Calculate relative mouse position within the image
    const relativeX = (event.clientX - left) / width;
    const relativeY = (event.clientY - top) / height;
    
    // Set background position percentage for magnifier
    const backgroundX = relativeX * 100;
    const backgroundY = relativeY * 100;
    
    setMousePosition({ x: backgroundX, y: backgroundY });
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

  const validMediaItems = product.media ? 
    product.media.filter(img => isValidImage(img.media_data)) : 
    [];

  return (
    <div className="product-detail-container">
      <div className="product-detail-grid">
        <div className="product-images">
          <div 
            className="main-image"
            ref={imageRef}
            onMouseEnter={() => !isMobile && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={handleMouseMove}
          >
            {isValidImage(selectedImage) ? (
              <Image 
                src={selectedImage || placeholderImage}
                alt={product.product_name}
                width={500}
                height={500}
                className="product-img"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="product-img-placeholder">No image available</div>
            )}
            
            {product.product_discount_active && discountPercentage > 0 && (
              <div className="discount-badge">-{discountPercentage}%</div>
            )}
          </div>
          
          {validMediaItems.length > 1 && (
            <div className="thumbnail-gallery">
              {validMediaItems.map((img: ProductMedia) => (
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
                    sizes="(max-width: 576px) 60px, 80px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="product-info" ref={productInfoRef}>
          {isHovered && !isMobile && isValidImage(selectedImage) && (
            <div 
              className="overlay-magnifier"
              style={{
                backgroundImage: `url(${selectedImage})`,
                backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                backgroundSize: `${magnificationLevel * 100}%`,
              }}
            >
            </div>
          )}
          
          <div className="product-header">
            {product.category && (
              <span className="product-category-badge">{product.category.product_category}</span>
            )}
            <h1 className="product-title">{product.product_name}</h1>
            
            <div className="product-meta">
              <span className="product-brand">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 1a1.5 1.5 0 0 0-1.5 1.5h3A1.5 1.5 0 0 0 8 1z"/>
                  <path d="M12 5V4a3 3 0 1 0-6 0v1H2.5A1.5 1.5 0 0 0 1 6.5v6A1.5 1.5 0 0 0 2.5 14h11a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 13.5 5H12zm-1 0H5V4a3 3 0 0 1 6 0v1z"/>
                </svg>
                <strong>{product.product_brand}</strong>
              </span>
              {product.warranty && (
                <span className="product-warranty-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                  </svg>
                  {product.warranty}
                </span>
              )}
            </div>
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
              {product.product_stock > 0 ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                  </svg>
                  In Stock ({product.product_stock} available)
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                  </svg>
                  Out of Stock
                </>
              )}
            </span>
          </div>
          
          <div className="product-actions-button">
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
              className="add-to-cart-btn-product"
              onClick={handleAddToCart}
              disabled={product.product_stock <= 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
              </svg>
              {product.product_stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>

          <div className="product-quick-info">
            <div className="info-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a.5.5 0 0 1-.5.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5v-7zm1.294 7.456A1.999 1.999 0 0 1 4.732 11h5.536a2.01 2.01 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456zM12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12v4zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
              </svg>
              <div>
                <h4>Free Shipping</h4>
                <p>On orders over $50</p>
              </div>
            </div>
            <div className="info-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 1a2 2 0 0 1 2 2v2H6V3a2 2 0 0 1 2-2zm3 4V3a3 3 0 1 0-6 0v2H3.36a1.5 1.5 0 0 0-1.483 1.277L.85 13.13A2.5 2.5 0 0 0 3.322 16h9.355a2.5 2.5 0 0 0 2.473-2.87l-1.028-6.853A1.5 1.5 0 0 0 12.64 5H11zm-1 1v1.5a.5.5 0 0 0 1 0V6h1.639a.5.5 0 0 1 .494.426l1.028 6.851A1.5 1.5 0 0 1 12.678 15H3.322a1.5 1.5 0 0 1-1.483-1.723l1.028-6.851A.5.5 0 0 1 3.36 6H5v1.5a.5.5 0 1 0 1 0V6h4z"/>
              </svg>
              <div>
                <h4>Secure Checkout</h4>
                <p>100% protected payments</p>
              </div>
            </div>
            <div className="info-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                <path d="M7.066 4.76A1.665 1.665 0 0 0 4 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112zm4 0A1.665 1.665 0 0 0 8 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112z"/>
              </svg>
              <div>
                <h4>24/7 Support</h4>
                <p>Expert assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="product-details-tabs">
        <div className="tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button 
            className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('specifications')}
          >
            Specifications
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
          <button 
            className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            Shipping & Returns
          </button>
          <button 
            className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            Payment Methods
          </button>
        </div>
        <div className="tabs-content">
          {activeTab === 'description' && (
            <div className="tab-pane description-content">
              <div className="description-text">
                {product.product_description}
              </div>
              
              {product.warranty && (
                <div className="warranty-info">
                  <h3>Warranty Information</h3>
                  <p>{product.warranty}</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'specifications' && (
            <div className="tab-pane specs-content">
              {product.additional_details && Object.values(product.additional_details).some(x => x) ? (
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
              ) : (
                <p>No detailed specifications available for this product.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="tab-pane">
              <ProductReviews productId={productId} />
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="tab-pane shipping-content">
              <h3>Shipping Information</h3>
              <div className="shipping-details">
                <div className="shipping-option">
                  <h4>Standard Shipping</h4>
                  <p>Delivery within 3-5 business days</p>
                  <p>Free on orders over $50</p>
                  <p>$4.99 for orders under $50</p>
                </div>
                <div className="shipping-option">
                  <h4>Express Shipping</h4>
                  <p>Delivery within 1-2 business days</p>
                  <p>$9.99 for all orders</p>
                </div>
                <div className="shipping-option">
                  <h4>Same Day Delivery</h4>
                  <p>Available for select areas</p>
                  <p>Order before 11am</p>
                  <p>$14.99 for all orders</p>
                </div>
              </div>

              <h3>Return Policy</h3>
              <p>We accept returns within 30 days of delivery. Items must be in original condition with tags attached and in original packaging.</p>
              <p>To initiate a return, please contact our customer service team with your order number.</p>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="tab-pane payment-content">
              <h3>Accepted Payment Methods</h3>
              
              {paymentMethodsLoading ? (
                <div className="loading-payment-methods">Loading payment methods...</div>
              ) : paymentMethodsError ? (
                <div className="error-payment-methods">{paymentMethodsError}</div>
              ) : paymentMethods.length === 0 ? (
                <p>No specific payment methods are defined for this product. Standard payment options are available at checkout.</p>
              ) : (
                <div className="payment-methods">
                  {paymentMethods.map(method => (
                    <div key={method.id} className="payment-method">
                      <div className={`payment-icon ${method.icon ? '' : 'default-icon'}`} 
                           style={method.icon ? { backgroundImage: `url(${method.icon})` } : {}}>
                        {!method.icon && method.name.charAt(0)}
                      </div>
                      <p>{method.name}</p>
                      {method.description && <small>{method.description}</small>}
                      {<small>Processing: {method.processing_time}</small>}
                      {(method.fee_percentage || method.fee_fixed) && (
                        <small className="fee-info">
                          Fee: {method.fee_percentage ? `${method.fee_percentage}%` : ''}
                          {(method.fee_percentage && method.fee_fixed) ? ' + ' : ''}
                          {method.fee_fixed ? `$${method.fee_fixed.toFixed(2)}` : ''}
                        </small>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <h3>Secure Checkout</h3>
              <p>All transactions are secure and encrypted. We never store your credit card information.</p>
              <p>Orders are processed in USD. Your bank may charge additional conversion fees for other currencies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
