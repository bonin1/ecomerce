'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './OrderConfirmation.scss';

interface OrderDetails {
  orderNumber: string;
  totalAmount: number;
  email: string;
  date: string;
  paymentMethod?: string;
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const hasOrderConfirmation = sessionStorage.getItem('orderConfirmation');
    const orderDetailsStr = sessionStorage.getItem('orderDetails');
    
    if (hasOrderConfirmation === 'true' && orderDetailsStr) {
      try {
        const parsedDetails = JSON.parse(orderDetailsStr);
        setOrderDetails(parsedDetails);
      } catch (e) {
        console.error('Failed to parse order details:', e);
      }
    } else {
      console.error('No order confirmation found in session storage');
    }
    
    setIsLoading(false);
    
    return () => {
      sessionStorage.removeItem('orderConfirmation');
      sessionStorage.removeItem('orderDetails');
    };
  }, [router]);
  
  if (isLoading) {
    return (
      <div className="order-confirmation__loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  if (!orderDetails) {
    return (
      <div className="order-confirmation__error">
        <div className="order-confirmation__error-content">
          <h2>No Order Information Found</h2>
          <p>We couldn't find any order details. Redirecting you to homepage...</p>
          <Link href="/" className="btn btn-primary">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="order-confirmation">
      <div className="order-confirmation__container">
        <div className="order-confirmation__header">
          <div className="order-confirmation__icon-wrapper">
            <svg className="order-confirmation__check-icon" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="11" />
              <path d="M7 13l3 3 7-7" />
            </svg>
          </div>
          <h1>Order Confirmed!</h1>
        </div>
        
        <div className="order-confirmation__body">
          <div className="order-confirmation__message">
            <h2>Thank you for your purchase!</h2>
            <p>Your order has been received and is being processed. We've sent a confirmation email to <span>{orderDetails.email}</span>.</p>
          </div>
          
          <div className="order-confirmation__details">
            <h3>Order Summary</h3>
            
            <div className="order-confirmation__detail-row">
              <span>Order Number:</span>
              <strong className="order-number">{orderDetails.orderNumber}</strong>
            </div>
            
            <div className="order-confirmation__detail-row">
              <span>Date:</span>
              <strong>{new Date(orderDetails.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</strong>
            </div>
            
            <div className="order-confirmation__detail-row">
              <span>Total Amount:</span>
              <strong className="price">${typeof orderDetails.totalAmount === 'number' ? 
                orderDetails.totalAmount.toFixed(2) : parseFloat(String(orderDetails.totalAmount)).toFixed(2)}</strong>
            </div>
            
            <div className="order-confirmation__detail-row">
              <span>Payment Method:</span>
              <strong>{orderDetails.paymentMethod || 'Credit Card'}</strong>
            </div>
            
            <div className="order-confirmation__detail-row">
              <span>Status:</span>
              <div className="order-status">Processing</div>
            </div>
          </div>
          
          <div className="order-confirmation__next-steps">
            <h3>What happens next?</h3>
            <ol className="order-confirmation__steps">
              <li>
                <div className="step-number">1</div>
                <div className="step-content">
                  <strong>Order Processing</strong>
                  <p>Your order is being prepared for shipping.</p>
                </div>
              </li>
              <li>
                <div className="step-number">2</div>
                <div className="step-content">
                  <strong>Shipping Notification</strong>
                  <p>You'll receive an email once your order has been shipped.</p>
                </div>
              </li>
              <li>
                <div className="step-number">3</div>
                <div className="step-content">
                  <strong>Order Tracking</strong>
                  <p>Track your order status in the "My Orders" section of your account.</p>
                </div>
              </li>
              <li>
                <div className="step-number">4</div>
                <div className="step-content">
                  <strong>Delivery</strong>
                  <p>Your package will be delivered to your shipping address.</p>
                </div>
              </li>
            </ol>
          </div>
          
          <div className="order-confirmation__actions">
            <Link href="/account/orders" className="btn btn-primary">
              View My Orders
            </Link>
            <Link href="/products" className="btn btn-secondary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
