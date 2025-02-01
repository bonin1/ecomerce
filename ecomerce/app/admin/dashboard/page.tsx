'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/admin/Sidebar/sidebar';

const Dashboard = () => {
    const router = useRouter();
    const [adminUser, setAdminUser] = useState<any>(null);

    useEffect(() => {
        const user = localStorage.getItem('adminUser');
        if (!user) {
            router.push('/admin/login');
            return;
        }
        setAdminUser(JSON.parse(user));
    }, [router]);

    if (!adminUser) return null;

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main" style={{ marginLeft: '250px', padding: '2rem' }}>
                <h1>Welcome, {adminUser.name}</h1>
                <div className="dashboard-stats">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>Total Orders</h3>
                            <p className="stat-number">0</p>
                        </div>
                        <div className="stat-card">
                            <h3>Total Products</h3>
                            <p className="stat-number">0</p>
                        </div>
                        <div className="stat-card">
                            <h3>Total Users</h3>
                            <p className="stat-number">0</p>
                        </div>
                        <div className="stat-card">
                            <h3>Total Revenue</h3>
                            <p className="stat-number">$0</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
