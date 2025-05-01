'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { createOrder, getPaymentMethods, PaymentMethod } from '../../utils/orderApi';
import { useCart } from '../../context/CartContext';
import './Checkout.scss';

interface CheckoutFormData {
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  contactPhone: string;
  contactEmail: string;
  paymentMethod: string;
  notes: string;
}

const Checkout: React.FC = () => {
  const router = useRouter();
  const { cartItems, clearCart, totalPrice, totalItems } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    shippingAddress: '',
    shippingCity: '',
    shippingPostalCode: '',
    shippingCountry: '',
    contactPhone: '',
    contactEmail: '',
    paymentMethod: '',
    notes: '',
  });

  useEffect(() => {
    const loadPaymentMethods = async () => {
      setIsLoading(true);
      try {
        const methods = await getPaymentMethods();
        setPaymentMethods(methods);
        if (methods.length > 0) {
          setFormData(prev => ({ ...prev, paymentMethod: methods[0].name }));
        }
      } catch (error) {
        console.error('Failed to load payment methods:', error);
        toast.error('Failed to load payment methods');
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentMethods();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const orderItems = cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
      }));

      const response = await createOrder({
        items: orderItems,
        ...formData,
      });

      sessionStorage.setItem('orderConfirmation', 'true');
      sessionStorage.setItem('orderDetails', JSON.stringify({
        orderNumber: response.order?.order_number || 'Unknown',
        totalAmount: response.order?.total_amount || 0,
        email: formData.contactEmail,
        date: new Date().toISOString(),
        paymentMethod: formData.paymentMethod
      }));
      
      toast.success('Order placed successfully!');
      clearCart();
      router.push('/order-confirmation');
    } catch (error) {
      console.error('Failed to place order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-grid">
        <div className="checkout-form-container">
          <h2 className="section-title">Shipping Information</h2>
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-group">
              <label htmlFor="contactEmail">Email Address</label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactPhone">Phone Number</label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                required
                placeholder="+1234567890"
              />
            </div>

            <div className="form-group">
              <label htmlFor="shippingAddress">Address</label>
              <input
                type="text"
                id="shippingAddress"
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleChange}
                required
                placeholder="123 Main St, Apt 4B"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="shippingCity">City</label>
                <input
                  type="text"
                  id="shippingCity"
                  name="shippingCity"
                  value={formData.shippingCity}
                  onChange={handleChange}
                  required
                  placeholder="New York"
                />
              </div>

              <div className="form-group">
                <label htmlFor="shippingPostalCode">Postal Code</label>
                <input
                  type="text"
                  id="shippingPostalCode"
                  name="shippingPostalCode"
                  value={formData.shippingPostalCode}
                  onChange={handleChange}
                  required
                  placeholder="10001"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="shippingCountry">Country</label>
              <input
                type="text"
                id="shippingCountry"
                name="shippingCountry"
                value={formData.shippingCountry}
                onChange={handleChange}
                required
                placeholder="United States"
              />
            </div>

            <h2 className="section-title">Payment Method</h2>
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading payment methods...</p>
              </div>
            ) : (
              <div className="payment-methods">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <div className="payment-method-option" key={method.id}>
                      <input
                        type="radio"
                        id={`payment-${method.id}`}
                        name="paymentMethod"
                        value={method.name}
                        checked={formData.paymentMethod === method.name}
                        onChange={handleChange}
                        required
                      />
                      <label htmlFor={`payment-${method.id}`} className="payment-label">
                        {method.icon && (
                          <img src={method.icon} alt={method.name} className="payment-icon" />
                        )}
                        <div className="payment-details">
                          <span className="payment-name">{method.name}</span>
                          {method.description && (
                            <span className="payment-description">{method.description}</span>
                          )}
                          {(method.fee_percentage || method.fee_fixed) && (
                            <span className="payment-fee">
                              Fee: {method.fee_fixed ? `$${method.fee_fixed} + ` : ''}
                              {method.fee_percentage ? `${method.fee_percentage}%` : ''}
                            </span>
                          )}
                        </div>
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="no-payment-methods">No payment methods available</p>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="notes">Order Notes (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Special delivery instructions or other notes"
                rows={3}
              />
            </div>

            <button
              type="submit"
              className="checkout-button"
              disabled={isSubmitting || cartItems.length === 0}
            >
              {isSubmitting ? 'Processing...' : `Place Order ($${totalPrice.toFixed(2)})`}
            </button>
          </form>
        </div>

        <div className="order-summary">
          <h2 className="section-title">Order Summary</h2>
          <div className="order-items">
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <div key={item.id} className="order-item">
                  <div className="item-info">
                    <img
                      src={item.image || '/images/placeholder.jpg'}
                      alt={item.product_name}
                      className="item-image"
                    />
                    <div className="item-details">
                      <h3 className="item-name">{item.product_name}</h3>
                      <p className="item-price">
                        ${item.price.toFixed(2)} x {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="item-total">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))
            ) : (
              <p className="empty-cart">Your cart is empty</p>
            )}
          </div>

          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal ({totalItems} items)</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
