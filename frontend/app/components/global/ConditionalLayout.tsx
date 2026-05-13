'use client';

import { usePathname } from 'next/navigation';
import Navbar from './navbar';
import Footer from './Footer';
import CartSidebar from '../cart/CartSidebar';
import React from 'react';
import '../../globals.css'

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
