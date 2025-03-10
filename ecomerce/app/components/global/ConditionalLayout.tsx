'use client';

import { usePathname } from 'next/navigation';
import Navbar from './navbar';
import CartSidebar from '../cart/CartSidebar';
import React from 'react';

const ConditionalLayout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

    return (
        <>
            <Navbar />
                {children}
            <CartSidebar />
        </>
    );
};

export default ConditionalLayout;
