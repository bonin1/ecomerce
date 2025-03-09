'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, CartItem } from '@/app/context/CartContext';
import './CartSidebar.scss';

const CartItemComponent: React.FC<{item: CartItem}> = ({ item }) => {
    const { updateQuantity, removeFromCart } = useCart();
    
    const incrementQuantity = () => {
        updateQuantity(item.id, item.quantity + 1);
    };
    
    const decrementQuantity = () => {
        if (item.quantity > 1) {
        updateQuantity(item.id, item.quantity - 1);
        } else {
        if (window.confirm('Remove this item from your cart?')) {
            removeFromCart(item.id);
        }
        }
    };
    
    return (
        <div className="cart-sidebar-item">
            <div className="cart-item-image">
                {item.image ? (
                    <Image 
                        src={item.image} 
                        alt={item.product_name} 
                        width={60} 
                        height={60} 
                        className="cart-product-image" 
                    />
                    ) : (
                    <div className="cart-placeholder-image"></div>
                )}
            </div>
            
            <div className="cart-item-details">
                <h4>{item.product_name}</h4>
                <div className="cart-price-quantity">
                    <div className="cart-item-price">
                        <span className="cart-current-price">${item.price.toFixed(2)}</span>
                        {item.originalPrice && (
                        <span className="cart-original-price">${item.originalPrice.toFixed(2)}</span>
                        )}
                    </div>
                    
                    <div className="cart-quantity-control">
                        <button 
                            onClick={decrementQuantity}
                            className="cart-quantity-btn"
                            aria-label="Decrease quantity"
                        >
                        -
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                            onClick={incrementQuantity}
                            className="cart-quantity-btn"
                            aria-label="Increase quantity"
                        >
                        +
                        </button>
                    </div>
                </div>
            </div>
            
            <button 
                className="cart-remove-item" 
                onClick={() => removeFromCart(item.id)} 
                title="Remove item"
                aria-label="Remove item"
            >
                &times;
            </button>
        </div>
    );
};

const CartSidebar: React.FC = () => {
    const { cartItems, isCartOpen, closeCart, totalItems, totalPrice, clearCart } = useCart();
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
        closeCart();
        setIsClosing(false);
        }, 300);
    };

    useEffect(() => {
        if (isCartOpen) {
        setIsClosing(false);
        }
    }, [isCartOpen]);
    
    if (!isCartOpen) return null;
    
    return (
        <>
        <div className={`cart-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}></div>
            <div className={`cart-sidebar-panel ${isClosing ? 'closing' : ''}`}>
                <div className="cart-sidebar-header">
                    <h3>Your Cart ({totalItems})</h3>
                    <button className="cart-close-btn" onClick={handleClose}>&times;</button>
                </div>
                
                <div className="cart-sidebar-body">
                    {cartItems.length > 0 ? (
                        cartItems.map(item => <CartItemComponent key={item.id} item={item} />)
                    ) : (
                        <div className="cart-empty-state">
                            <p>Your cart is empty</p>
                            <Link href="/products" className="cart-continue-shopping" onClick={handleClose}>
                                Continue Shopping
                            </Link>
                        </div>
                    )}
                </div>
                
                {cartItems.length > 0 && (
                    <div className="cart-sidebar-footer">
                        <div className="cart-subtotal">
                            <span>Subtotal</span>
                            <span>${totalPrice.toFixed(2)}</span>
                        </div>
                        
                        <div className="cart-sidebar-actions">
                            <Link href="/checkout" className="cart-checkout-btn">
                                Proceed to Checkout
                            </Link>
                            <button className="cart-clear-btn" onClick={clearCart}>
                                Clear Cart
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartSidebar;
