'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './sidebar.scss';
import Cookies from 'js-cookie'; 

interface AdminUser {
    name: string;
    role: string;
    email: string;
}

const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

    useEffect(() => {
        const userJson = localStorage.getItem('adminUser');
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                setAdminUser(user);
            } catch (error) {
                console.error('Failed to parse admin user', error);
            }
        }
    }, []);

    const handleLogout = async () => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            Cookies.remove('adminTokenSync', { path: '/' });
            
            router.push('/admin/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const navigation = [
        {
            section: 'Dashboard',
            items: [
                { path: '/admin/dashboard', label: 'Overview', icon: '📊' }
            ]
        },
        {
            section: 'Products',
            items: [
                { path: '/admin/products', label: 'Products', icon: '📦' }
            ]
        },
        {
            section: 'Categories',
            items: [
                { path: '/admin/categories', label: 'Categories', icon: '🗂️' }
            ]
        },
        {
            section: 'Careers',
            items: [
                { path: '/admin/careers', label: 'Job Listings', icon: '💼' },
                { path: '/admin/careers/applications', label: 'Applications', icon: '📝' }
            ]
        },
        {
            section: 'Affiliate Program',
            items: [
                { path: '/admin/affiliate', label: 'Affiliate Management', icon: '🤝' }
            ]
        },
        {
            section: 'Sales',
            items: [
                { path: '/admin/orders', label: 'Orders', icon: '🛍️' },
                { path: '/admin/orders/tracking', label: 'Order Tracking', icon: '🚚' },
                { path: '/admin/customers', label: 'Customers', icon: '👥' }
            ]
        },
        {
            section: 'Settings',
            items: [
                { path: '/admin/payment-methods', label: 'Payment Methods', icon: '💳' },
                { path: '/admin/users', label: 'Users', icon: '👤' },
                { path: '/admin/settings', label: 'General Settings', icon: '⚙️' }
            ]
        }
    ];

    return (
        <div className="admin-sidebar">
            <div className="sidebar-header">
                <h3>Admin Panel</h3>
            </div>
            <nav className="sidebar-nav">
                {navigation.map((nav, index) => (
                    <div className="nav-section" key={index}>
                        <div className="section-title">{nav.section}</div>
                        {nav.items.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`nav-item ${pathname === item.path || pathname.startsWith(item.path + '/') ? 'active' : ''}`}
                            >
                                <span className="icon">{item.icon}</span>
                                <span className="label">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>
            <div className="sidebar-footer">
                {adminUser && (
                    <div className="user-info">
                        <div className="avatar">
                            {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="user-details">
                            <p className="user-name">{adminUser.name || 'Admin User'}</p>
                            <p className="user-role">{adminUser.role || 'administrator'}</p>
                        </div>
                    </div>
                )}
                <button onClick={handleLogout} className="logout-btn">
                    <span className="icon">🚪</span>
                    <span className="label">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
