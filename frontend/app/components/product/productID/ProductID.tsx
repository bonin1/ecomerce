'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/app/utils/apiClient';
import Image from 'next/image';
import { useCart } from '@/app/context/CartContext';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import ProductReviews from '@/app/components/reviews/ProductReviews';
import { wishlistStatus, addToWishlist, removeFromWishlist } from '@/app/API/wishlist';

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
  const [isMobileView, setIsMobileView] = useState(true);
  const magnificationLevel = 2.5;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobileView(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const placeholderImage = '/placeholder-image.jpg';

  const getAccessToken = () =>
    typeof window !== 'undefined'
      ? sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
      : null;

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

  useEffect(() => {
    const token = getAccessToken();
    if (!productId || !token) {
      setInWishlist(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await wishlistStatus(productId);
        if (!cancelled && res?.success) {
          setInWishlist(!!res.inWishlist);
        }
      } catch {
        if (!cancelled) setInWishlist(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleToggleWishlist = async () => {
    const token = getAccessToken();
    if (!token) {
      toast.error('Sign in to use your wishlist');
      return;
    }
    if (!product) return;
    setWishlistBusy(true);
    try {
      if (inWishlist) {
        const res = await removeFromWishlist(product.id);
        if (res?.success) {
          setInWishlist(false);
          toast.success('Removed from wishlist');
        } else {
          toast.error(res?.message || 'Could not update wishlist');
        }
      } else {
        const res = await addToWishlist(product.id);
        if (res?.success) {
          setInWishlist(true);
          toast.success('Saved to wishlist');
        } else {
          toast.error(res?.message || 'Could not update wishlist');
        }
      }
    } catch {
      toast.error('Could not update wishlist');
    } finally {
      setWishlistBusy(false);
    }
  };

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
    if (isMobileView || !imageRef.current) return;
    
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
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-slate-50 px-4">
        <div className="h-11 w-11 animate-spin rounded-full border-2 border-market-orange/30 border-t-market-orange" />
        <p className="text-sm font-medium text-slate-600">Loading product…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error || 'Product not found'}
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-bold text-brand-primary hover:underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  const discountPercentage = product.product_discount_percentage || 
    (product.product_discount_active && product.product_discount_price ? 
      Math.round(((product.product_price - product.product_discount_price) / product.product_price) * 100) : 0);

  const validMediaItems = product.media ? 
    product.media.filter(img => isValidImage(img.media_data)) : 
    [];

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 text-xs text-slate-600 sm:text-sm">
          <Link href="/" className="font-semibold text-market-orange hover:text-market-orange-dark">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          {product.category ? (
            <>
              <Link
                href={`/categories/${product.category.product_category.toLowerCase()}`}
                className="font-medium text-slate-700 hover:text-market-orange"
              >
                {product.category.product_category}
              </Link>
              <span className="text-slate-300">/</span>
            </>
          ) : null}
          <span className="line-clamp-1 text-slate-500">{product.product_name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Gallery */}
          <div className="flex flex-col gap-4 md:flex-row md:gap-4">
            {validMediaItems.length > 1 && (
              <div className="flex flex-row gap-2 overflow-x-auto pb-1 md:w-[88px] md:flex-col md:overflow-y-auto md:pb-0 md:pr-1">
                {validMediaItems.map((img: ProductMedia) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImage(img.media_data)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition md:h-20 md:w-20 ${
                      selectedImage === img.media_data
                        ? 'border-market-orange shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Image
                      src={img.media_data}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized={img.media_data.startsWith('data:')}
                    />
                  </button>
                ))}
              </div>
            )}
            <div className="relative min-h-[280px] flex-1 sm:min-h-[360px] lg:min-h-[420px]">
              <div
                ref={imageRef}
                className="relative aspect-square w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                onMouseEnter={() => !isMobileView && setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseMove={handleMouseMove}
              >
                {isValidImage(selectedImage) ? (
                  <Image
                    src={selectedImage || placeholderImage}
                    alt={product.product_name}
                    fill
                    className="object-contain p-4"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    unoptimized={!!selectedImage?.startsWith('data:')}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">No image</div>
                )}
                {product.product_discount_active && discountPercentage > 0 && (
                  <span className="absolute left-3 top-3 rounded-lg bg-market-orange px-2.5 py-1 text-xs font-black text-white shadow">
                    -{discountPercentage}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Buy box */}
          <div className="relative" ref={productInfoRef}>
            {isHovered && !isMobileView && isValidImage(selectedImage) && (
              <div
                className="pointer-events-none absolute right-0 top-0 z-20 hidden h-56 w-56 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-2xl ring-1 ring-slate-200/80 lg:block"
                style={{
                  backgroundImage: `url(${selectedImage})`,
                  backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                  backgroundSize: `${magnificationLevel * 100}%`,
                }}
              />
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              {product.category && (
                <Link
                  href={`/categories/${product.category.product_category.toLowerCase()}`}
                  className="inline-block rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-market-orange-dark hover:bg-orange-100"
                >
                  {product.category.product_category}
                </Link>
              )}
              <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                {product.product_name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                  <i className="bi bi-shop text-market-orange" aria-hidden />
                  {product.product_brand}
                </span>
                {product.warranty ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    <i className="bi bi-shield-check" aria-hidden />
                    {product.warranty}
                  </span>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap items-baseline gap-3 border-b border-slate-100 pb-6">
                {product.product_discount_active && product.product_discount_price ? (
                  <>
                    <span className="text-3xl font-black text-market-orange-dark sm:text-4xl">
                      {formatPrice(product.product_discount_price)}
                    </span>
                    <span className="text-lg text-slate-400 line-through">{formatPrice(product.product_price)}</span>
                    <span className="rounded-md bg-red-50 px-2 py-0.5 text-sm font-bold text-red-700">
                      -{discountPercentage}%
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-black text-slate-900 sm:text-4xl">{formatPrice(product.product_price)}</span>
                )}
              </div>

              <div className="mt-4">
                {product.product_stock > 0 ? (
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    In stock · {product.product_stock} available
                  </p>
                ) : (
                  <p className="text-sm font-bold text-red-600">Out of stock</p>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={wishlistBusy}
                  aria-pressed={inWishlist}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-lg transition ${
                    inWishlist
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-market-orange/40'
                  }`}
                  title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <i className={`bi ${inWishlist ? 'bi-heart-fill' : 'bi-heart'}`} />
                </button>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="h-12 w-11 text-lg font-bold text-slate-700 hover:bg-white disabled:opacity-40"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
                    min={1}
                    max={product.product_stock || 10}
                    className="h-12 w-14 border-x border-slate-200 bg-white text-center text-sm font-bold text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= (product.product_stock || 10)}
                    className="h-12 w-11 text-lg font-bold text-slate-700 hover:bg-white disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.product_stock <= 0}
                  className="min-h-12 flex-1 rounded-xl bg-gradient-to-r from-market-orange to-market-orange-dark px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-market-orange/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                >
                  {product.product_stock > 0 ? 'Add to cart' : 'Unavailable'}
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: 'bi-truck', t: 'Shipping', s: 'Orders $50+' },
                  { icon: 'bi-lock-fill', t: 'Secure pay', s: 'Encrypted' },
                  { icon: 'bi-headset', t: 'Support', s: 'We are here to help' },
                ].map((x) => (
                  <div key={x.t} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <i className={`bi ${x.icon} text-xl text-market-orange`} aria-hidden />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{x.t}</p>
                      <p className="text-[11px] text-slate-500">{x.s}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2 pt-2 sm:px-4">
            <button
              type="button"
              className={`shrink-0 whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-bold transition ${
                activeTab === 'description'
                  ? 'border-b-2 border-market-orange text-market-orange-dark'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
          <button
            type="button"
            className={`shrink-0 whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-bold transition ${
              activeTab === 'specifications'
                ? 'border-b-2 border-market-orange text-market-orange-dark'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('specifications')}
          >
            Specifications
          </button>
          <button
            type="button"
            className={`shrink-0 whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-bold transition ${
              activeTab === 'reviews'
                ? 'border-b-2 border-market-orange text-market-orange-dark'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
          <button
            type="button"
            className={`shrink-0 whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-bold transition ${
              activeTab === 'shipping'
                ? 'border-b-2 border-market-orange text-market-orange-dark'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('shipping')}
          >
            Shipping &amp; returns
          </button>
          <button
            type="button"
            className={`shrink-0 whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-bold transition ${
              activeTab === 'payment'
                ? 'border-b-2 border-market-orange text-market-orange-dark'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('payment')}
          >
            Payment
          </button>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === 'description' && (
            <div className="space-y-6">
              <div className="max-w-none whitespace-pre-wrap text-sm leading-relaxed text-slate-700 sm:text-base">
                {product.product_description}
              </div>

              {product.warranty && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 sm:p-5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">Warranty</h3>
                  <p className="mt-2 text-sm leading-relaxed text-amber-950/90">{product.warranty}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div>
              {product.additional_details && Object.values(product.additional_details).some((x) => x) ? (
                <dl className="grid gap-3 sm:grid-cols-2">
                  {product.additional_details.product_color && (
                    <div className="flex flex-col justify-between gap-1 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center">
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Color</dt>
                      <dd className="text-sm font-semibold text-slate-900">{product.additional_details.product_color}</dd>
                    </div>
                  )}
                  {product.additional_details.product_size && (
                    <div className="flex flex-col justify-between gap-1 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center">
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Size</dt>
                      <dd className="text-sm font-semibold text-slate-900">{product.additional_details.product_size}</dd>
                    </div>
                  )}
                  {product.additional_details.product_weight && (
                    <div className="flex flex-col justify-between gap-1 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center">
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Weight</dt>
                      <dd className="text-sm font-semibold text-slate-900">{product.additional_details.product_weight}g</dd>
                    </div>
                  )}
                  {product.additional_details.product_dimensions && (
                    <div className="flex flex-col justify-between gap-1 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center">
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Dimensions</dt>
                      <dd className="text-sm font-semibold text-slate-900">{product.additional_details.product_dimensions}</dd>
                    </div>
                  )}
                  {product.additional_details.product_material && (
                    <div className="flex flex-col justify-between gap-1 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center">
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Material</dt>
                      <dd className="text-sm font-semibold text-slate-900">{product.additional_details.product_material}</dd>
                    </div>
                  )}
                  {product.additional_details.product_manufacturer && (
                    <div className="flex flex-col justify-between gap-1 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center">
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Manufacturer</dt>
                      <dd className="text-sm font-semibold text-slate-900">{product.additional_details.product_manufacturer}</dd>
                    </div>
                  )}
                  {product.additional_details.product_origin && (
                    <div className="flex flex-col justify-between gap-1 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center">
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Country of origin</dt>
                      <dd className="text-sm font-semibold text-slate-900">{product.additional_details.product_origin}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-slate-500">No detailed specifications are available for this product.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <ProductReviews productId={productId} />
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-black text-slate-900">Shipping</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <h4 className="text-sm font-bold text-market-orange-dark">Standard</h4>
                    <p className="mt-2 text-sm text-slate-600">Delivery within 3–5 business days</p>
                    <p className="mt-1 text-xs text-slate-500">Free on orders over $50</p>
                    <p className="text-xs text-slate-500">$4.99 under $50</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <h4 className="text-sm font-bold text-market-orange-dark">Express</h4>
                    <p className="mt-2 text-sm text-slate-600">Delivery within 1–2 business days</p>
                    <p className="mt-1 text-xs text-slate-500">$9.99 for all orders</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <h4 className="text-sm font-bold text-market-orange-dark">Same day</h4>
                    <p className="mt-2 text-sm text-slate-600">Select areas only</p>
                    <p className="mt-1 text-xs text-slate-500">Order before 11am</p>
                    <p className="text-xs text-slate-500">$14.99</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">Returns</h3>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
                  We accept returns within 30 days of delivery. Items must be in original condition with tags attached and in
                  original packaging.
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                  To start a return, contact customer service with your order number.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-8">
              <h3 className="text-lg font-black text-slate-900">Payment methods</h3>

              {paymentMethodsLoading ? (
                <p className="text-sm text-slate-500">Loading payment methods…</p>
              ) : paymentMethodsError ? (
                <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{paymentMethodsError}</p>
              ) : paymentMethods.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No product-specific payment methods are listed. Standard options are available at checkout.
                </p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {paymentMethods.map((method) => (
                    <li
                      key={method.id}
                      className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm"
                    >
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-lg font-black text-market-orange"
                        style={method.icon ? { backgroundImage: `url(${method.icon})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                      >
                        {!method.icon && method.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900">{method.name}</p>
                        {method.description && <p className="mt-1 text-xs text-slate-600">{method.description}</p>}
                        {method.processing_time != null && method.processing_time !== '' && (
                          <p className="mt-1 text-xs text-slate-500">Processing: {String(method.processing_time)}</p>
                        )}
                        {(method.fee_percentage || method.fee_fixed) && (
                          <p className="mt-1 text-xs font-semibold text-market-orange-dark">
                            Fee: {method.fee_percentage ? `${method.fee_percentage}%` : ''}
                            {method.fee_percentage && method.fee_fixed ? ' + ' : ''}
                            {method.fee_fixed ? `$${method.fee_fixed.toFixed(2)}` : ''}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
                <h3 className="text-sm font-black text-emerald-900">Secure checkout</h3>
                <p className="mt-2 text-sm text-emerald-950/85">
                  Transactions are encrypted. We do not store full card numbers on our servers.
                </p>
                <p className="mt-2 text-sm text-emerald-950/85">
                  Orders are processed in USD; your bank may apply conversion fees.
                </p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
