'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, CartItem } from '@/app/context/CartContext';

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
        <div className="flex gap-4 py-4 border-b border-slate-100 last:border-b-0 relative pr-6">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-50 relative">
                {item.image ? (
                    <Image 
                        src={item.image} 
                        alt={item.product_name} 
                        fill
                        className="object-cover" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <i className="bi bi-image text-2xl" />
                    </div>
                )}
            </div>
            
            <div className="flex flex-col flex-1 justify-between">
                <div>
                    <h4 className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug pr-4">{item.product_name}</h4>
                    <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-bold text-brand-primary">${item.price.toFixed(2)}</span>
                        {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-xs text-slate-400 line-through">${item.originalPrice.toFixed(2)}</span>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center mt-2">
                    <div className="flex items-center rounded border border-slate-200 overflow-hidden bg-white">
                        <button 
                            onClick={decrementQuantity}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-primary transition-colors text-sm font-medium focus:outline-none"
                            aria-label="Decrease quantity"
                        >
                            <i className="bi bi-dash" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-slate-800 border-x border-slate-200 py-1 bg-slate-50">{item.quantity}</span>
                        <button 
                            onClick={incrementQuantity}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-primary transition-colors text-sm font-medium focus:outline-none"
                            aria-label="Increase quantity"
                        >
                            <i className="bi bi-plus" />
                        </button>
                    </div>
                </div>
            </div>
            
            <button 
                className="absolute top-4 right-0 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-full p-1" 
                onClick={() => removeFromCart(item.id)} 
                title="Remove item"
                aria-label="Remove item"
            >
                <i className="bi bi-x-lg text-xs font-bold" />
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
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isCartOpen]);
    
    if (!isCartOpen && !isClosing) return null;
    
    return (
        <div className="fixed inset-0 z-[2000] flex justify-end">
            <div 
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
            />
            
            <div 
                className={`relative w-full max-w-[400px] h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-lg font-bold text-brand-secondary m-0 flex items-center gap-2">
                        <i className="bi bi-cart3" />
                        Your Cart <span className="text-sm font-normal text-slate-500">({totalItems})</span>
                    </h3>
                    <button 
                        className="text-slate-400 hover:text-slate-800 transition-colors p-1" 
                        onClick={handleClose}
                    >
                        <i className="bi bi-x-lg text-lg" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 py-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {cartItems.length > 0 ? (
                        cartItems.map(item => <CartItemComponent key={item.id} item={item} />)
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center px-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <i className="bi bi-cart-x text-4xl text-slate-300" />
                            </div>
                            <p className="text-slate-600 font-medium mb-6">Your cart is empty.</p>
                            <button 
                                className="px-6 py-2.5 bg-brand-primary text-white text-sm font-bold rounded shadow-sm hover:bg-brand-primary/90 transition-colors w-full"
                                onClick={handleClose}
                            >
                                Continue Shopping
                            </button>
                        </div>
                    )}
                </div>
                
                {cartItems.length > 0 && (
                    <div className="border-t border-slate-200 p-6 bg-slate-50">
                        <div className="flex justify-between items-center mb-4 text-sm">
                            <span className="text-slate-600">Subtotal</span>
                            <span className="text-lg font-bold text-brand-secondary">${totalPrice.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-4 text-center">Shipping & taxes calculated at checkout.</p>
                        
                        <div className="flex flex-col gap-2">
                            <Link 
                                href="/checkout" 
                                className="w-full py-3 bg-brand-primary text-white text-sm font-bold rounded flex justify-center items-center gap-2 hover:bg-brand-primary/90 transition-colors shadow-sm no-underline"
                                onClick={handleClose}
                            >
                                Proceed to Checkout
                            </Link>
                            <button 
                                className="w-full py-2.5 border border-slate-300 bg-white text-slate-600 text-sm font-bold rounded hover:bg-slate-50 hover:text-slate-800 transition-colors" 
                                onClick={clearCart}
                            >
                                Clear Cart
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartSidebar;