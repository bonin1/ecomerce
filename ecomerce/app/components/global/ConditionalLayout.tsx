'use client';

import { usePathname } from 'next/navigation';
import Navbar from './navbar';
import CartSidebar from '../cart/CartSidebar';
import React from 'react';
import '../../globals.css'

const ConditionalLayout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      {isAdminRoute ? (
        children
      ) : (
        <div className="wrapper">
          <div className="wrapper-assist">
            {children}
          </div>
        </div>
      )}
      <CartSidebar />
    </>
  );
};

export default ConditionalLayout;
