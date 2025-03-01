'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../../utils/apiClient';
import './Product.scss';
import Link from 'next/link';
import Image from 'next/image';

interface ProductType {
  id: number;
  product_name: string;
  product_primary_image: string;
  product_price: number | string;
  product_discount_active: boolean;
  product_discount_price: number | string;
  product_discount_percentage: number | string;
}

const ProductGrid = () => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Using the correct endpoint: /product/products
        const response = await apiClient('/product/products?limit=18', { 
          method: 'GET', 
          skipAuth: true 
        });
        
        if (response && response.success && Array.isArray(response.data)) {
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

  // Helper function to safely format price values
  const formatPrice = (price: number | string): string => {
    if (price === null || price === undefined) return '0.00';
    
    // Convert to number if it's a string
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    // Check if it's a valid number
    if (isNaN(numericPrice)) return '0.00';
    
    // Format the number
    return numericPrice.toFixed(2);
  };

  if (loading) {
    return <div className="loading-container">Loading products...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="product-section">
      <h2 className="section-title">Featured Products</h2>
      <div className="product-grid">
        {products && products.length > 0 ? (
          products.map((product) => (
            <div className="product-card" key={product.id}>
              <Link href={`/product/${product.id}`}>
                <div className="product-image-container">
                  {product.product_primary_image ? (
                    <Image 
                      src={product.product_primary_image} 
                      alt={product.product_name} 
                      width={250}
                      height={250}
                      className="product-image"
                    />
                  ) : (
                    <div className="placeholder-image">No image available</div>
                  )}
                  {product.product_discount_active && (
                    <div className="discount-badge">
                      -{formatPrice(product.product_discount_percentage)}%
                    </div>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.product_name}</h3>
                  <div className="product-price">
                    {product.product_discount_active ? (
                      <>
                        <span className="original-price">${formatPrice(product.product_price)}</span>
                        <span className="discount-price">${formatPrice(product.product_discount_price)}</span>
                      </>
                    ) : (
                      <span>${formatPrice(product.product_price)}</span>
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
