import React from 'react';
import Link from 'next/link';
import { AFFILIATE_DEFAULT_COMMISSION_PCT, SITE_NAME } from '@/app/config/site';
import './header.scss';

const Header = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const commission = AFFILIATE_DEFAULT_COMMISSION_PCT;

  return (
    <header className="affiliate-header">
      <div className="container">
        <div className="header-content">
          <h1>Transform your influence into income</h1>
          <p>
            Join the {SITE_NAME} affiliate program and earn up to {commission}% commission on qualifying sales.
            Cookie-based tracking helps ensure you get credit for referrals you drive.
          </p>
          <div className="cta-buttons">
            <a href="#apply-section" className="primary-btn" onClick={(e) => { e.preventDefault(); scrollToSection('apply-section'); }}>
              Become an affiliate
            </a>
            <Link href="/affiliate/login" className="secondary-btn">
              Partner login
            </Link>
          </div>
        </div>

        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-value">{commission}%</div>
            <div className="stat-label">Default commission</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">90</div>
            <div className="stat-label">Day cookie</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">Real-time</div>
            <div className="stat-label">Dashboard</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">Fair</div>
            <div className="stat-label">Payout tracking</div>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
