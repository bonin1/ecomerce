'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/app/utils/apiClient';
import Link from 'next/link';
import './track-order.scss';

interface OrderItem {
  product_name: string;
  quantity: number;
}

interface TrackingUpdate {
  status: string;
  location: string;
  description: string;
  carrier: string;
  carrier_tracking_number: string;
  estimated_delivery: string | null;
  createdAt: string;
}

interface OrderTracking {
  orderNumber: string;
  orderDate: string;
  currentStatus: string;
  trackingNumber: string | null;
  estimatedDeliveryDate: string | null;
  items: OrderItem[];
  trackingHistory: TrackingUpdate[];
}

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [trackingNumber, setTrackingNumber] = useState(searchParams.get('track') || '');
  const [trackingInfo, setTrackingInfo] = useState<OrderTracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Auto-track on initial load if URL parameters are present
  useEffect(() => {
    if (orderNumber && trackingNumber) {
      trackOrder();
      setIsInitialLoad(false);
    } else {
      setIsInitialLoad(false);
    }
  }, []);

  const trackOrder = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!orderNumber) {
      setError('Please enter an order number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      queryParams.append('orderNumber', orderNumber);
      if (trackingNumber) {
        queryParams.append('trackingNumber', trackingNumber);
      }
      
      const response = await apiClient(`/track-order/track?${queryParams.toString()}`);
      
      if (response.success) {
        setTrackingInfo(response.data);
      } else {
        setError(response.message || 'Could not find tracking information for this order');
      }
    } catch (err) {
      console.error('Error fetching tracking info:', err);
      setError('An error occurred while fetching tracking information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'order_placed':
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'packed': return 'status-packed';
      case 'shipped': return 'status-shipped';
      case 'out_for_delivery': return 'status-out-for-delivery';
      case 'delivered': return 'status-delivered';
      case 'failed_delivery': return 'status-failed';
      case 'returned': return 'status-returned';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getProgressPercentage = (status: string) => {
    const statuses = ['order_placed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    const index = statuses.indexOf(status.toLowerCase());
    if (index === -1) return 0;
    return (index / (statuses.length - 1)) * 100;
  };

  return (
    <div className="track-order-container">
      <div className="track-order-header">
        <h1>Track Your Order</h1>
        <p>Enter your order number and tracking number to get the latest updates</p>
      </div>

      <div className="track-order-form-container">
        <form onSubmit={trackOrder} className="track-order-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="orderNumber">Order Number (required)</label>
              <input
                type="text"
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. ORD-12345"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="trackingNumber">Tracking Number (optional)</label>
              <input
                type="text"
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. TRK-67890"
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="track-order-btn"
            disabled={loading}
          >
            {loading ? 'Tracking...' : 'Track Order'}
          </button>
        </form>
      </div>

      {error && (
        <div className="track-order-error">
          <div className="error-message">
            <i className="error-icon">⚠️</i>
            <p>{error}</p>
          </div>
          <div className="error-help">
            <p>Please check if you've entered the correct order number and tracking number.</p>
            <p>If you're still having issues, please <Link href="/help">contact customer support</Link>.</p>
          </div>
        </div>
      )}

      {trackingInfo && (
        <div className="tracking-result">
          <div className="tracking-header">
            <div className="order-info">
              <h2>Order #{trackingInfo.orderNumber}</h2>
              <p>Placed on {formatDate(trackingInfo.orderDate)}</p>
            </div>
            <div className="tracking-status">
              <span className={`status-badge ${getStatusClass(trackingInfo.currentStatus)}`}>
                {formatStatus(trackingInfo.currentStatus)}
              </span>
            </div>
          </div>

          {/* Tracking Progress Bar */}
          <div className="tracking-progress-container">
            <div className="tracking-progress-wrapper">
              <div className="tracking-progress-bar">
                <div 
                  className="tracking-progress-fill" 
                  style={{ width: `${getProgressPercentage(trackingInfo.currentStatus)}%` }}
                ></div>
              </div>
              <div className="tracking-progress-steps">
                <div className={`progress-step ${
                  ['order_placed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'].indexOf(trackingInfo.currentStatus) >= 0 ? 'active' : ''
                }`}>
                  <div className="step-dot"></div>
                  <span>Order Placed</span>
                </div>
                <div className={`progress-step ${
                  ['processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'].indexOf(trackingInfo.currentStatus) >= 0 ? 'active' : ''
                }`}>
                  <div className="step-dot"></div>
                  <span>Processing</span>
                </div>
                <div className={`progress-step ${
                  ['packed', 'shipped', 'out_for_delivery', 'delivered'].indexOf(trackingInfo.currentStatus) >= 0 ? 'active' : ''
                }`}>
                  <div className="step-dot"></div>
                  <span>Packed</span>
                </div>
                <div className={`progress-step ${
                  ['shipped', 'out_for_delivery', 'delivered'].indexOf(trackingInfo.currentStatus) >= 0 ? 'active' : ''
                }`}>
                  <div className="step-dot"></div>
                  <span>Shipped</span>
                </div>
                <div className={`progress-step ${
                  ['out_for_delivery', 'delivered'].indexOf(trackingInfo.currentStatus) >= 0 ? 'active' : ''
                }`}>
                  <div className="step-dot"></div>
                  <span>Out for Delivery</span>
                </div>
                <div className={`progress-step ${
                  trackingInfo.currentStatus === 'delivered' ? 'active' : ''
                }`}>
                  <div className="step-dot"></div>
                  <span>Delivered</span>
                </div>
              </div>
            </div>
          </div>

          <div className="tracking-details">
            <div className="tracking-section order-details">
              <h3>Order Details</h3>
              <div className="order-items">
                <div className="order-items-header">
                  <span>Item</span>
                  <span>Quantity</span>
                </div>
                {trackingInfo.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span className="item-name">{item.product_name}</span>
                    <span className="item-quantity">{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="tracking-section shipping-details">
              <h3>Shipping Details</h3>
              <div className="shipping-info">
                {trackingInfo.trackingNumber && (
                  <div className="info-row">
                    <span className="label">Tracking Number:</span>
                    <span className="value">{trackingInfo.trackingNumber}</span>
                  </div>
                )}
                {trackingInfo.estimatedDeliveryDate && (
                  <div className="info-row">
                    <span className="label">Estimated Delivery:</span>
                    <span className="value">{formatDate(trackingInfo.estimatedDeliveryDate)}</span>
                  </div>
                )}
                {trackingInfo.trackingHistory && trackingInfo.trackingHistory[0]?.carrier && (
                  <div className="info-row">
                    <span className="label">Carrier:</span>
                    <span className="value">{trackingInfo.trackingHistory[0].carrier}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="tracking-section tracking-history">
              <h3>Tracking Updates</h3>
              {trackingInfo.trackingHistory.length > 0 ? (
                <div className="timeline">
                  {trackingInfo.trackingHistory.map((update, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className={`status-badge ${getStatusClass(update.status)}`}>
                            {formatStatus(update.status)}
                          </span>
                          <span className="timestamp">{formatDateTime(update.createdAt)}</span>
                        </div>
                        <div className="timeline-body">
                          <div className="location">{update.location}</div>
                          {update.description && <div className="description">{update.description}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-updates">No tracking updates available yet.</p>
              )}
            </div>
          </div>

          <div className="tracking-actions">
            <Link href="/help/shipping" className="help-link">
              Shipping & Delivery FAQ
            </Link>
            <Link href="/help" className="contact-support-btn">
              Contact Support
            </Link>
          </div>
        </div>
      )}

      {!trackingInfo && !error && !loading && !isInitialLoad && (
        <div className="no-tracking-info">
          <div className="illustration">🔎</div>
          <h3>Enter your order details above to track your package</h3>
          <p>You can find your order number in the confirmation email we sent you.</p>
        </div>
      )}
    </div>
  );
}