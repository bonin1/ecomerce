'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie'; 

type AdminRole = 'admin' | 'superadmin' | 'staff' | 'moderator';

interface AdminUser {
    id?: number;
    name: string;
    role: string;
    email: string;
}

interface NavItem {
    path: string;
    label: string;
    icon: string;
    /** If set, only these roles see the link (matched case-insensitively). */
    roles?: AdminRole[];
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

    const navigation: { section: string; items: NavItem[] }[] = [
        {
            section: 'Operations',
            items: [
                {
                    path: '/admin/operations',
                    label: 'Operations hub',
                    icon: 'bi-sliders',
                    roles: ['admin', 'superadmin', 'staff', 'moderator'],
                },
                {
                    path: '/admin/coupons',
                    label: 'Coupons',
                    icon: 'bi-ticket-perforated',
                    roles: ['admin', 'superadmin'],
                },
                {
                    path: '/admin/audit-log',
                    label: 'Audit log',
                    icon: 'bi-journal-text',
                    roles: ['admin', 'superadmin'],
                },
            ],
        },
        {
            section: 'Dashboard',
            items: [{ path: '/admin/dashboard', label: 'Overview', icon: 'bi-grid-1x2' }],
        },
        {
            section: 'Products',
            items: [{ path: '/admin/products', label: 'Products', icon: 'bi-box-seam' }],
        },
        {
            section: 'Categories',
            items: [{ path: '/admin/categories', label: 'Categories', icon: 'bi-tags' }],
        },
        {
            section: 'Careers',
            items: [
                { path: '/admin/careers', label: 'Job Listings', icon: 'bi-briefcase' },
                { path: '/admin/careers/applications', label: 'Applications', icon: 'bi-file-earmark-person' },
            ],
        },
        {
            section: 'Affiliate Program',
            items: [
                {
                    path: '/admin/affiliate',
                    label: 'Affiliate Management',
                    icon: 'bi-people',
                    roles: ['admin', 'superadmin'],
                },
            ],
        },
        {
            section: 'Sales',
            items: [
                { path: '/admin/orders', label: 'Orders', icon: 'bi-receipt' },
                { path: '/admin/orders/tracking', label: 'Order Tracking', icon: 'bi-truck' },
                { path: '/admin/customers', label: 'Customers', icon: 'bi-person-badge' },
                { path: '/admin/reviews', label: 'Reviews', icon: 'bi-chat-square-text' },
            ],
        },
        {
            section: 'Settings',
            items: [
                {
                    path: '/admin/payment-methods',
                    label: 'Payment Methods',
                    icon: 'bi-credit-card',
                    roles: ['admin', 'superadmin'],
                },
                { path: '/admin/users', label: 'Users', icon: 'bi-shield-lock', roles: ['admin', 'superadmin'] },
                { path: '/admin/settings', label: 'General Settings', icon: 'bi-gear', roles: ['admin', 'superadmin'] },
            ],
        },
    ];

    const normalizedRole = (adminUser?.role?.toLowerCase() as AdminRole) || 'staff';
    const visibleNavigation = navigation
        .map((nav) => ({
            ...nav,
            items: nav.items.filter((item) => !item.roles || item.roles.includes(normalizedRole)),
        }))
        .filter((nav) => nav.items.length > 0);

    return (
        <div className="w-[260px] h-screen bg-brand-secondary text-white flex flex-col shrink-0 overflow-hidden sticky top-0">
            <div className="h-[72px] flex items-center px-6 border-b border-white/10 shrink-0 bg-[#222a3d]">
                <h3 className="text-xl font-bold text-white tracking-wide m-0 flex items-center gap-2">
                    <i className="bi bi-shield-check text-brand-primary" />
                    Admin Panel
                </h3>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-6 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {visibleNavigation.map((nav, index) => (
                    <div className="mb-6" key={index}>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
                            {nav.section}
                        </div>
                        <ul className="list-none p-0 m-0 space-y-1">
                            {nav.items.map((item) => {
                                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                                return (
                                    <li key={item.path}>
                                        <Link
                                            href={item.path}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors no-underline ${
                                                isActive 
                                                    ? 'bg-brand-primary text-white shadow-sm' 
                                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            <i className={`bi ${item.icon} text-lg ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                            {item.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>
            
            <div className="p-4 border-t border-white/10 bg-[#222a3d]">
                {adminUser && (
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded bg-brand-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <p className="text-sm font-bold text-white m-0 truncate">{adminUser.name || 'Admin User'}</p>
                            <p className="text-xs text-brand-primary m-0 capitalize truncate">{adminUser.role || 'administrator'}</p>
                        </div>
                    </div>
                )}
                <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center justify-center gap-2 rounded bg-red-500/10 border border-red-500/20 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white focus:outline-none"
                >
                    <i className="bi bi-box-arrow-right" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;