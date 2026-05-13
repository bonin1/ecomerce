'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/admin/components/Sidebar/sidebar';
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
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden p-6 md:p-8">
                <PaymentMethodsManager />
            </main>
        </div>
    );
};

export default PaymentMethodsPage;
