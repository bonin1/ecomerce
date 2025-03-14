'use client';

import React from 'react';
import Checkout from '../components/checkout/Checkout';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
  const { cartItems, totalItems } = useCart();
  const router = useRouter();
  
  if (totalItems === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-6">Your Cart is Empty</h1>
        <p className="mb-8 text-gray-600">You don't have any items in your cart.</p>
        <Link href="/products" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition">
          Browse Products
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <Checkout />
    </div>
  );
}
