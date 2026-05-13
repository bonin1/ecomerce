'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getOrderById, cancelOrder } from '../../utils/orderApi';
import '../orders.scss';
import './order-details.scss';

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
  contact_phone: string;
  contact_email: string;
  payment_method: string;
  payment_status: string;
  tracking_number?: string;
  estimated_delivery_date?: string;
  notes?: string;
  items: OrderItem[];
}

const OrderDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await getOrderById(orderId);
        setOrder(response);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        setLoading(true);
        await cancelOrder(orderId);
        
        // Update local state after successful cancellation
        if (order) {
          setOrder({ ...order, status: 'cancelled' });
        }
      } catch (err) {
        console.error('Error cancelling order:', err);
        alert('Failed to cancel the order. Please try again.');
      } finally {
        setLoading(false);
      }
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

  const getPaymentStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'failed': return 'bg-danger';
      case 'refunded': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
            onClick={() => router.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="orders-error">
        <div className="alert alert-info" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          Order not found
        </div>
        <div className="text-center mt-4">
          <Link href="/orders" className="btn btn-primary">
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-container">
      <div className="order-details-header">
        <div className="header-left">
          <h1>Order #{order.order_number}</h1>
          <p className="text-muted">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="header-right">
          <span className={`status-badge badge ${getStatusBadgeClass(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
          <div className="header-actions">
            <Link href="/orders" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-arrow-left me-1"></i> All Orders
            </Link>
            {order.status === 'pending' && (
              <button 
                className="btn btn-outline-danger btn-sm ms-2"
                onClick={handleCancelOrder}
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="order-details-content">
        <div className="order-summary card">
          <div className="card-header">
            <h5>Order Summary</h5>
          </div>
          <div className="card-body">
            <div className="summary-item">
              <span>Order Status:</span>
              <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <div className="summary-item">
              <span>Payment Status:</span>
              <span className={`badge ${getPaymentStatusBadgeClass(order.payment_status)}`}>
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </span>
            </div>
            <div className="summary-item">
              <span>Payment Method:</span>
              <span>{order.payment_method}</span>
            </div>
            {order.tracking_number && (
              <div className="summary-item">
                <span>Tracking Number:</span>
                <span>{order.tracking_number}</span>
              </div>
            )}
            {order.estimated_delivery_date && (
              <div className="summary-item">
                <span>Estimated Delivery:</span>
                <span>{new Date(order.estimated_delivery_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="customer-info card">
          <div className="card-header">
            <h5>Customer Information</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6>Shipping Address</h6>
                <address>
                  {order.shipping_address}<br />
                  {order.shipping_city}, {order.shipping_postal_code}<br />
                  {order.shipping_country}
                </address>
              </div>
              <div className="col-md-6">
                <h6>Contact Information</h6>
                <p className="mb-1">Email: {order.contact_email}</p>
                <p>Phone: {order.contact_phone}</p>
              </div>
            </div>
            {order.notes && (
              <div className="order-notes mt-3">
                <h6>Order Notes</h6>
                <p className="notes-text">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="order-items card">
          <div className="card-header">
            <h5>Ordered Items</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-center">Price</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="product-name">
                          <Link href={`/product/${item.product_id}`}>
                            {item.product_name}
                          </Link>
                        </div>
                      </td>
                      <td className="text-center">${formatPrice(item.price)}</td>
                      <td className="text-center">
                        <span className="quantity-badge">{item.quantity}</span>
                      </td>
                      <td className="text-end item-total">${formatPrice(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={3} className="text-end">Total:</th>
                    <th className="text-end">${formatPrice(order.total_amount)}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {order.status === 'shipped' && (
          <div className="order-tracking card">
            <div className="card-header">
              <h5>Tracking Information</h5>
            </div>
            <div className="card-body">
              <div className="tracking-info">
                <div className="tracking-number">
                  <strong>Tracking Number:</strong> {order.tracking_number || 'Not available'}
                </div>
                <div className="tracking-link mt-2">
                  <a href={`https://track.carrier.com?number=${order.tracking_number}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                    Track Package
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsPage;
