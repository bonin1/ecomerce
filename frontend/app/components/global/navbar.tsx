'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/app/types';
import { useCart } from '@/app/context/CartContext';
import { dispatchUserLogout } from '@/app/utils/auth-events';
import { apiClient } from '@/app/utils/apiClient';
import { SITE_NAME } from '@/app/config/site';

function readUserFromStorage(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!raw) return null;
    try {
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
}

interface NavCategory {
    id: number;
    product_category: string;
}

function categoryHref(name: string) {
    return `/categories/${name.toLowerCase()}`;
}

const Navbar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [user, setUser] = useState<User | null>(() => readUserFromStorage());
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isMobileProfileMenuOpen, setIsMobileProfileMenuOpen] = useState(false);
    const [categories, setCategories] = useState<NavCategory[]>([]);
    const { toggleCart, totalItems } = useCart();
    const profileDropdownRef = useRef<HTMLDivElement>(null);
    const mobileProfileDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await apiClient('/product/categories', { skipAuth: true });
                if (res?.success && Array.isArray(res.data)) {
                    setCategories(res.data);
                }
            } catch {
                setCategories([]);
            }
        };
        void loadCategories();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isProfileMenuOpen &&
                profileDropdownRef.current &&
                !profileDropdownRef.current.contains(event.target as Node)
            ) {
                setIsProfileMenuOpen(false);
            }

            if (
                isMobileProfileMenuOpen &&
                mobileProfileDropdownRef.current &&
                !mobileProfileDropdownRef.current.contains(event.target as Node)
            ) {
                setIsMobileProfileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileMenuOpen, isMobileProfileMenuOpen]);

    useEffect(() => {
        const syncFromStorage = () => setUser(readUserFromStorage());

        syncFromStorage();

        const handleLogin = (event: Event) => {
            const customEvent = event as CustomEvent<User>;
            if (customEvent.detail) setUser(customEvent.detail);
        };

        const onLogoutEvent = () => setUser(null);

        window.addEventListener('user-login', handleLogin as EventListener);
        window.addEventListener('user-logout', onLogoutEvent);
        window.addEventListener('storage', syncFromStorage);

        return () => {
            window.removeEventListener('user-login', handleLogin as EventListener);
            window.removeEventListener('user-logout', onLogoutEvent);
            window.removeEventListener('storage', syncFromStorage);
        };
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
        document.body.style.overflow = '';
        setUser(readUserFromStorage());
    }, [pathname]);

    const handleLogout = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('accessToken');
                setUser(null);
                dispatchUserLogout();
                window.location.href = '/';
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        if (isCategoriesOpen) setIsCategoriesOpen(false);
        document.body.style.overflow = !isMobileMenuOpen ? 'hidden' : '';
    };

    const toggleCategories = () => setIsCategoriesOpen(!isCategoriesOpen);

    const runSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        router.push(`/search?q=${encodeURIComponent(q)}`);
        setIsMobileMenuOpen(false);
        document.body.style.overflow = '';
    };

    const menuItemClass =
        'flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition';

    return (
        <header className="w-full bg-white shadow-sm border-b border-slate-200 sticky top-0 z-[1000]">
            {/* Top tiny bar for trust signals / secondary links (like Aliexpress) */}
            <div className="bg-slate-100 border-b border-slate-200 hidden md:block">
                <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-1.5 text-xs text-slate-500 sm:px-6">
                    <div className="flex gap-4">
                        <span>Welcome to {SITE_NAME}</span>
                    <Link href="/help/shipping" className="hover:text-brand-primary transition no-underline text-slate-500">Buyer Protection</Link>
                    <Link href="/contact" className="hover:text-brand-primary transition no-underline text-slate-500">Customer Service</Link>
                </div>
                <div className="flex gap-4">
                    <Link href="/affiliate" className="hover:text-brand-primary transition no-underline text-slate-500">Affiliate Program</Link>
                        <span>English / USD</span>
                    </div>
                </div>
            </div>

            {/* Main Header Row */}
            <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:py-4 sm:px-6">
                {/* Logo */}
                <div className="flex shrink-0 items-center lg:w-[220px]">
                    <Link href="/" className="inline-flex items-center">
                        <img
                            src="/logo/STRIKETECH-1.png"
                            alt={SITE_NAME}
                            className="h-10 w-auto sm:h-12 object-contain"
                        />
                    </Link>
                </div>

                {/* Big Search Bar (Centered) */}
                <form
                    className="hidden flex-1 md:flex max-w-3xl mx-auto"
                    onSubmit={runSearch}
                >
                    <div className="flex w-full rounded border-2 border-brand-primary overflow-hidden bg-white group hover:shadow-[0_0_0_2px_rgba(77,109,186,0.1)] focus-within:shadow-[0_0_0_2px_rgba(77,109,186,0.2)] transition-shadow">
                        <input
                            type="search"
                            name="q"
                            placeholder="I'm shopping for..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoComplete="off"
                            className="w-full px-4 py-2.5 text-sm text-slate-800 outline-none"
                        />
                        <button
                            type="submit"
                            className="bg-brand-primary px-6 text-white font-bold tracking-wide hover:bg-brand-primary/90 transition-colors"
                        >
                            <i className="bi bi-search" />
                        </button>
                    </div>
                </form>

                {/* Actions: Account, Wishlist, Cart */}
                <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4 lg:w-[320px] lg:justify-end">
                    {/* Account Dropdown */}
                    <div className="relative hidden md:block">
                        <button
                            type="button"
                            className="flex items-center gap-2 text-left hover:text-brand-primary transition-colors py-1 px-2 rounded"
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        >
                            <i className="bi bi-person text-2xl text-slate-600" />
                            <div className="flex flex-col leading-tight">
                                {user ? (
                                    <>
                                        <span className="text-[11px] text-slate-500">Account</span>
                                        <span className="text-sm font-bold text-slate-800 truncate max-w-[100px]">{user.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-[11px] text-slate-500">Sign in</span>
                                        <span className="text-sm font-bold text-slate-800">Account</span>
                                    </>
                                )}
                            </div>
                        </button>
                        
                        {isProfileMenuOpen && (
                            <div
                                ref={profileDropdownRef}
                                className="absolute right-0 top-full mt-2 w-56 rounded border border-slate-200 bg-white py-2 shadow-lg"
                            >
                                {user ? (
                                    <>
                                        <div className="px-4 py-2 border-b border-slate-100 mb-2">
                                            <p className="font-semibold text-slate-800 truncate">{user.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                        </div>
                            <Link href="/profile" className={`${menuItemClass} no-underline`} onClick={() => setIsProfileMenuOpen(false)}>
                                <i className="bi bi-person" /> My Account
                            </Link>
                            <Link href="/orders" className={`${menuItemClass} no-underline`} onClick={() => setIsProfileMenuOpen(false)}>
                                <i className="bi bi-box-seam" /> My Orders
                            </Link>
                            <Link href="/profile/settings" className={`${menuItemClass} no-underline`} onClick={() => setIsProfileMenuOpen(false)}>
                                <i className="bi bi-gear" /> Settings
                            </Link>
                                        <hr className="my-2 border-slate-100" />
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className={`${menuItemClass} text-red-600`}
                                        >
                                            <i className="bi bi-box-arrow-right" /> Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <div className="p-4">
                                        <Link href="/login" onClick={() => setIsProfileMenuOpen(false)} className="no-underline">
                                            <button className="w-full bg-brand-primary text-white font-bold py-2 rounded mb-2 hover:bg-brand-primary/90 transition-colors">
                                                Sign In
                                            </button>
                                        </Link>
                                        <div className="text-center text-xs text-slate-500">
                                            New customer? <Link href="/register" className="text-brand-primary font-bold hover:underline no-underline" onClick={() => setIsProfileMenuOpen(false)}>Register</Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Wishlist */}
                    {user && (
                        <Link href="/wishlist" className="hidden md:flex flex-col items-center justify-center hover:text-brand-primary transition-colors px-2">
                            <i className="bi bi-heart text-xl text-slate-600 mb-0.5" />
                            <span className="text-[11px] font-medium text-slate-600">Wishlist</span>
                        </Link>
                    )}

                    {/* Cart */}
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); toggleCart(); }}
                        className="flex items-center gap-2 hover:text-brand-primary transition-colors py-1 px-2 rounded"
                    >
                        <div className="relative">
                            <i className="bi bi-cart3 text-2xl text-slate-600" />
                            {totalItems > 0 && (
                                <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                    {totalItems > 99 ? '99+' : totalItems}
                                </span>
                            )}
                        </div>
                        <div className="hidden md:flex flex-col leading-tight text-left ml-1">
                            <span className="text-[11px] text-slate-500">Cart</span>
                            <span className="text-sm font-bold text-slate-800">{totalItems} item(s)</span>
                        </div>
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded border border-slate-200 text-xl text-slate-600 md:hidden hover:bg-slate-50"
                        onClick={toggleMobileMenu}
                    >
                        <i className={`bi ${isMobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`} />
                    </button>
                </div>
            </div>

            {/* Bottom Category Strip */}
            <div className="hidden md:block bg-white border-t border-slate-200">
                <div className="mx-auto max-w-[1400px] flex items-center px-4 sm:px-6">
                    <Link href="/categories" className="flex items-center gap-2 bg-brand-primary text-white font-bold px-4 py-2.5 rounded-t-sm hover:bg-brand-primary/90 transition-colors mr-6 no-underline">
                        <i className="bi bi-list text-lg" />
                        All Categories
                    </Link>
                    <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap scrollbar-hide py-2.5">
                        {categories.slice(0, 8).map((c) => (
                            <Link
                                key={c.id}
                                href={categoryHref(c.product_category)}
                                className="text-sm font-semibold text-slate-700 hover:text-brand-primary transition-colors no-underline"
                            >
                                {c.product_category}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Search Bar (shown under main header on small screens) */}
            <div className="md:hidden border-t border-slate-200 bg-slate-50 px-4 py-2.5">
                <form onSubmit={runSearch}>
                    <div className="flex w-full rounded border border-brand-primary overflow-hidden bg-white">
                        <input
                            type="search"
                            name="q"
                            placeholder="I'm shopping for..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 text-sm outline-none"
                        />
                        <button type="submit" className="bg-brand-primary px-4 text-white">
                            <i className="bi bi-search" />
                        </button>
                    </div>
                </form>
            </div>

            {/* Mobile Menu Drawer */}
            <div
                className={
                    isMobileMenuOpen
                        ? 'fixed inset-0 top-[116px] z-[999] bg-black/50 md:hidden'
                        : 'hidden'
                }
                onClick={() => setIsMobileMenuOpen(false)}
            >
                <div 
                    className="absolute top-0 right-0 bottom-0 w-[280px] bg-white shadow-xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        {user ? (
                            <div className="flex items-center gap-3">
                                {user.profilePic ? (
                                    <img src={user.profilePic} alt="" className="h-12 w-12 rounded object-cover" />
                                ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded bg-brand-primary text-xl font-bold text-white">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 text-lg">{user.name}</span>
                                    <span className="text-xs text-slate-500">{user.email}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex-1">
                                    <button className="w-full rounded bg-brand-primary py-2 font-bold text-white">
                                        Sign In
                                    </button>
                                </Link>
                                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="flex-1">
                                    <button className="w-full rounded border border-slate-300 bg-white py-2 font-bold text-slate-700">
                                        Register
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto py-2">
                        {user && (
                            <>
                                <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 no-underline" onClick={() => setIsMobileMenuOpen(false)}>
                                    <i className="bi bi-person text-lg" /> Profile
                                </Link>
                                <Link href="/orders" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 no-underline" onClick={() => setIsMobileMenuOpen(false)}>
                                    <i className="bi bi-box-seam text-lg" /> Orders
                                </Link>
                                <Link href="/wishlist" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 no-underline" onClick={() => setIsMobileMenuOpen(false)}>
                                    <i className="bi bi-heart text-lg" /> Wishlist
                                </Link>
                                <Link href="/profile/settings" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 no-underline" onClick={() => setIsMobileMenuOpen(false)}>
                                    <i className="bi bi-gear text-lg" /> Settings
                                </Link>
                                <div className="border-t border-slate-100 my-2" />
                            </>
                        )}
                        
                        <div className="px-4 py-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                            Categories
                        </div>
                        {categories.map((c) => (
                            <Link
                                key={c.id}
                                href={categoryHref(c.product_category)}
                                className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-brand-primary font-medium no-underline"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {c.product_category}
                            </Link>
                        ))}
                    </div>

                    {user && (
                        <div className="p-4 border-t border-slate-200">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 rounded bg-red-50 py-2.5 font-bold text-red-600 hover:bg-red-100"
                            >
                                <i className="bi bi-box-arrow-right" /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
