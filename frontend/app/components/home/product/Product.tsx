'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../../utils/apiClient';
import './Product.scss';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/app/context/CartContext';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ProductMedia {
  id: number;
  media_type: string;
  is_primary: boolean;
  media_data: string; 
}

interface ProductType {
  id: number;
  product_name: string;
  product_price: number | string;
  product_discount_active: boolean;
  product_discount_price: number | string;
  product_discount_percentage: number | string;
  media?: ProductMedia[]; 
}

const ProductGrid = () => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await apiClient('/product/products?limit=18', { 
          method: 'GET', 
          skipAuth: true 
        });
        
        if (response && response.success && Array.isArray(response.data)) {
          console.log('Product data sample:', response.data[0]);
          setProducts(response.data);
        } else {
          console.error('Unexpected API response structure:', response);
          setError('Received invalid data from server');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const formatPrice = (price: number | string): string => {
    if (price === null || price === undefined) return '0.00';
    
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numericPrice)) return '0.00';
    
    return numericPrice.toFixed(2);
  };

  const getProductImage = (product: ProductType): string | null => {
    if (product.media && product.media.length > 0) {
      const primaryImage = product.media.find(m => m.is_primary);
      if (primaryImage) {
        return primaryImage.media_data;
      }
      return product.media[0].media_data;
    }
    return null;
  };

  const calculateDiscount = (original: number | string, discounted: number | string): string => {
    const originalPrice = Number(original);
    const discountPrice = Number(discounted);
    
    if (originalPrice > 0 && discountPrice > 0) {
      const percentage = Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
      return percentage.toString();
    }
    return '0';
  };

  const handleAddToCart = (e: React.MouseEvent, product: ProductType) => {
    e.preventDefault(); 
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.product_name} added to cart`);
  };

  const handleViewProduct = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation(); 
    router.push(`/product/${productId}`);
  };

  if (loading) {
    return <div className="loading-container">Loading products...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="product-section">
      <div className="product-grid">
        {products && products.length > 0 ? (
          products.map((product) => (
            <div className="product-card" key={product.id}>
              <Link href={`/product/${product.id}`}>
                <div className="product-image-container">
                  {getProductImage(product) ? (
                    <Image 
                      src={getProductImage(product) || '/placeholder-image.jpg'}
                      alt={product.product_name}
                      width={250}
                      height={250}
                      className="product-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="placeholder-image">No image available</div>
                  )}
                  {product.product_discount_active && (
                    <div className="discount-badge">
                      -{product.product_discount_percentage || 
                        calculateDiscount(product.product_price, product.product_discount_price)}%
                    </div>
                  )}
                  
                  <div className="product-actions">
                    <button 
                      className="view-product-btn"
                      onClick={(e) => handleViewProduct(e, product.id)}
                    >
                      View Product
                    </button>
                    <button 
                      className="add-to-cart-btn" 
                      onClick={(e) => handleAddToCart(e, product)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.product_name}</h3>
                  <div className="product-price">
                    {product.product_discount_active ? (
                      <div className="price-row">
                        <span className="discount-price">${formatPrice(product.product_discount_price)}</span>
                        <span className="original-price">${formatPrice(product.product_price)}</span>
                      </div>
                    ) : (
                      <span className="regular-price">${formatPrice(product.product_price)}</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="no-products-message">No products found</div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
