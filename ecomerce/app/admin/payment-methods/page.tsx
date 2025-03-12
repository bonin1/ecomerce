'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/admin/Sidebar/sidebar';
import PaymentMethodsManager from '../components/payment-methods/Payment';

const PaymentMethodsPage = () => {
    const router = useRouter();

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            router.push('/admin/login');
        }
    }, [router]);

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main" style={{ marginLeft: '260px', padding: '2rem' }}>
                <PaymentMethodsManager />
            </main>
        </div>
    );
};

export default PaymentMethodsPage;
