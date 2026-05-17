'use client';

import { usePathname } from 'next/navigation';
import Navbar from './navbar';
import Footer from './Footer';
import CartSidebar from '../cart/CartSidebar';
import SiteMaintenanceBanner from './SiteMaintenanceBanner';
import React from 'react';

const ConditionalLayout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  
  const isExcludedRoute = () => {
    return (
      pathname?.startsWith('/verify-email') ||
      pathname === '/verify-otp' ||
      pathname === '/reset-password'
    );
  };

  const shouldShowNavbarFooter = !isAdminRoute && !isExcludedRoute();

  return (
    <>
      {shouldShowNavbarFooter && <Navbar />}
      {shouldShowNavbarFooter && <SiteMaintenanceBanner />}
      {isAdminRoute || isExcludedRoute() ? (
        children
      ) : (
        <div className="wrapper">
          <div className="wrapper-assist">
            {children}
          </div>
        </div>
      )}
      {shouldShowNavbarFooter && <Footer />}
      <CartSidebar />
    </>
  );
};

export default ConditionalLayout;
