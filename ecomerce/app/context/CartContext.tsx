'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
    id: number;
    product_name: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    image?: string;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: any) => void;
    removeFromCart: (id: number) => void;
    updateQuantity: (id: number, quantity: number) => void;
    clearCart: () => void;
    isCartOpen: boolean;
    toggleCart: () => void;
    closeCart: () => void;
    totalItems: number;
    totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                setCartItems(parsedCart);
            } catch (error) {
                console.error('Failed to parse cart from localStorage', error);
            }
        }
    }, []);

    useEffect(() => {
        if (cartItems.length > 0) {
            localStorage.setItem('cart', JSON.stringify(cartItems));
        } else {
            localStorage.removeItem('cart');
        }
        
        const items = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const price = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        setTotalItems(items);
        setTotalPrice(price);
    }, [cartItems]);

    const addToCart = (product: any) => {
        setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.id === product.id);
        
        if (existingItem) {
            return prevItems.map(item => 
            item.id === product.id 
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
        } else {
            const price = product.product_discount_active
            ? Number(product.product_discount_price)
            : Number(product.product_price);

            const image = product.media && product.media.length > 0 
            ? (product.media.find((m: any) => m.is_primary)?.media_data || product.media[0].media_data)
            : null;

            return [...prevItems, {
                id: product.id,
                product_name: product.product_name,
                price: price,
                originalPrice: product.product_discount_active ? Number(product.product_price) : undefined,
                quantity: 1,
                image: image
            }];
        }
        });
        
        setIsCartOpen(true);
    };

    const removeFromCart = (id: number) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    const updateQuantity = (id: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(id);
            return;
        }
        
        setCartItems(prevItems => 
            prevItems.map(item => 
                item.id === id ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('cart');
    };

    const toggleCart = () => {
        setIsCartOpen(prev => !prev);
    };

    const closeCart = () => {
        setIsCartOpen(false);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            isCartOpen,
            toggleCart,
            closeCart,
            totalItems,
            totalPrice
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
