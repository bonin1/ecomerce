'use client';

import React, { useEffect, useState } from 'react';
import { getOrders, cancelOrder } from '../utils/orderApi';
import Link from 'next/link';
import './orders.scss';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  total_price: number;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  createdAt: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  payment_method: string;
  payment_status: string;
  tracking_number?: string;
  estimated_delivery_date?: string;
  items: OrderItem[];
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await getOrders();
        setOrders(response || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: number) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        setLoading(true);
        await cancelOrder(orderId);
        
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: 'cancelled' } 
              : order
          )
        );
      } catch (err) {
        console.error('Error cancelling order:', err);
        alert('Failed to cancel the order. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-warning';
      case 'processing': return 'bg-info';
      case 'shipped': return 'bg-primary';
      case 'delivered': return 'bg-success';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const formatPrice = (price: any): string => {
    try {
      const numValue = typeof price === 'string' ? parseFloat(price) : Number(price);
      return numValue.toFixed(2);
    } catch (error) {
      console.error("Error formatting price:", error);
      return "0.00"; 
    }
  };

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-error">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
        <div className="text-center mt-4">
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p className="text-muted">Track and manage your purchases</p>
      </div>

      {orders.length > 0 ? (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              <div className="order-header">
                <div className="order-details">
                  <h5 className="order-number">Order #{order.order_number}</h5>
                  <p className="order-date">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="order-status">
                  <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="order-items">
                {order.items.slice(0, 3).map((item) => (
                  <div className="order-item" key={item.id}>
                    <div className="item-name">{item.product_name}</div>
                    <div className="item-details">
                      <span className="item-price">${formatPrice(item.price)}</span>
                      <span className="item-quantity">x {item.quantity}</span>
                      <span className="item-total">${formatPrice(item.total_price)}</span>
                    </div>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="more-items">
                    +{order.items.length - 3} more items
                  </div>
                )}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <span>Total: </span>
                  <span className="total-amount">${formatPrice(order.total_amount)}</span>
                </div>
                <div className="order-actions">
                  <Link href={`/orders/${order.id}`} className="btn btn-primary btn-sm">
                    View Details
                  </Link>
                  {order.status === 'pending' && (
                    <button 
                      className="btn btn-outline-danger btn-sm ms-2"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-orders">
          <div className="no-orders-icon">
            <i className="bi bi-box"></i>
          </div>
          <h3>You haven't placed any orders yet</h3>
          <p>When you place an order, it will appear here for you to track</p>
          <Link href="/products" className="btn btn-primary">
            Start Shopping Now
          </Link>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
