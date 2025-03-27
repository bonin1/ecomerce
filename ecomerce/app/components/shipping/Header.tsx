import React from 'react';
import './Header.scss';

const ShippingHeader: React.FC = () => {
  return (
    <div className="shipping-header">
      <div className="shipping-header__overlay"></div>
      <div className="shipping-header__container">
        <h1 className="shipping-header__title">Premium Shipping Experience</h1>
        <p className="shipping-header__subtitle">
          Delivering excellence to your doorstep with personalized service
        </p>
        <div className="shipping-header__badges">
          <div className="badge">
            <span className="badge__icon">✓</span>
            <span className="badge__text">Fast Delivery</span>
          </div>
          <div className="badge">
            <span className="badge__icon">✓</span>
            <span className="badge__text">100% Insured</span>
          </div>
          <div className="badge">
            <span className="badge__icon">✓</span>
            <span className="badge__text">Global Shipping</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingHeader;
