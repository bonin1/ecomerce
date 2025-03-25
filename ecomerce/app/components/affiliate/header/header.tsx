import React from 'react';
import Link from 'next/link';
import './header.scss';

const Header = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="affiliate-header">
      <div className="container">
        <div className="header-content">
          <h1>Transform Your Influence Into Income</h1>
          <p>
            Join the StrikeTech affiliate network and earn up to 15% commission for every sale you generate. Our cutting-edge tracking system ensures you get credit for every referral.
          </p>
          <div className="cta-buttons">
            <a href="#apply-section" className="primary-btn" onClick={(e) => { e.preventDefault(); scrollToSection('apply-section'); }}>
              Become an Affiliate
            </a>
            <Link href="/affiliate/login" className="secondary-btn">
              Partner Login
            </Link>
          </div>
        </div>

        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-value">15%</div>
            <div className="stat-label">Commission Rate</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">90</div>
            <div className="stat-label">Day Cookie</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">10k+</div>
            <div className="stat-label">Active Affiliates</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">$1.2M</div>
            <div className="stat-label">Monthly Payouts</div>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
