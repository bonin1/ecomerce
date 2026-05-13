'use client'

import React, { useState, useEffect, useRef } from 'react'
import './navbar.scss'
import Link from 'next/link'
import { User } from '@/app/types'
import { useCart } from '@/app/context/CartContext'
import { dispatchUserLogout } from '@/app/utils/auth-events'

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isMobileProfileMenuOpen, setIsMobileProfileMenuOpen] = useState(false);
    const { toggleCart, totalItems } = useCart();
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const profileDropdownRef = useRef<HTMLDivElement>(null);
    const mobileProfileDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isProfileMenuOpen && 
                profileDropdownRef.current && 
                !profileDropdownRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
            
            if (isMobileProfileMenuOpen && 
                mobileProfileDropdownRef.current && 
                !mobileProfileDropdownRef.current.contains(event.target as Node)) {
                setIsMobileProfileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileMenuOpen, isMobileProfileMenuOpen]);

    useEffect(() => {
        const handleScroll = () => {
            if (isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        const checkUserAuth = () => {
            const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error('Error parsing user data:', error);
                }
            }
        };
        
        checkUserAuth();
        
        const handleLogin = (event: Event) => {
            const customEvent = event as CustomEvent<User>;
            if (customEvent.detail) {
                setUser(customEvent.detail);
            }
        };
        
        const handleLogout = () => {
            setUser(null);
        };
        
        window.addEventListener('user-login', handleLogin as EventListener);
        window.addEventListener('user-logout', handleLogout);
        
        return () => {
            window.removeEventListener('user-login', handleLogin as EventListener);
            window.removeEventListener('user-logout', handleLogout);
        };
    }, []);

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

    const toggleCategories = () => {
        setIsCategoriesOpen(!isCategoriesOpen);
    };

    const renderAuthButtons = () => {
        if (user) {
            return (
                <div className="profile-section">
                    <div className="profile-trigger" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                        {user.profilePic ? (
                            <img src={user.profilePic} alt="Profile" className="profile-pic" />
                        ) : (
                            <div className="default-profile">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="profile-name">{user.name}</span>
                    </div>
                    {isProfileMenuOpen && (
                        <div className="profile-dropdown" ref={profileDropdownRef}>
                            <Link href="/profile" className="dropdown-item">
                                <i className="bi bi-person"></i> Profile
                            </Link>
                            <Link href="/orders" className="dropdown-item">
                                <i className="bi bi-box"></i> Orders
                            </Link>
                            <Link href="/settings" className="dropdown-item">
                                <i className="bi bi-gear"></i> Settings
                            </Link>
                            <hr className="dropdown-divider" />
                            <button onClick={handleLogout} className="dropdown-item text-danger">
                                <i className="bi bi-box-arrow-right"></i> Logout
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="auth-buttons">
                <Link href="/login">
                    <button className="login">Login</button>
                </Link>
                <Link href="/register">
                    <button className="register">Register</button>
                </Link>
            </div>
        );
    };
    
    const renderMobileAuthButtons = () => {
        if (user) {
            return (
                <div className="profile-section mobile-profile-section">
                    <div className="profile-trigger" onClick={(e) => {
                        e.stopPropagation();
                        setIsMobileProfileMenuOpen(!isMobileProfileMenuOpen);
                    }}>
                        {user.profilePic ? (
                            <img src={user.profilePic} alt="Profile" className="profile-pic" />
                        ) : (
                            <div className="default-profile">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="profile-name">{user.name}</span>
                    </div>
                    {isMobileProfileMenuOpen && (
                        <div className="profile-dropdown mobile-profile-dropdown" ref={mobileProfileDropdownRef}>
                            <Link href="/profile" className="dropdown-item">
                                <i className="bi bi-person"></i> Profile
                            </Link>
                            <Link href="/orders" className="dropdown-item">
                                <i className="bi bi-box"></i> Orders
                            </Link>
                            <Link href="/settings" className="dropdown-item">
                                <i className="bi bi-gear"></i> Settings
                            </Link>
                            <hr className="dropdown-divider" />
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleLogout();
                                }} 
                                className="dropdown-item text-danger"
                            >
                                <i className="bi bi-box-arrow-right"></i> Logout
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="auth-buttons">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="login">Login</button>
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="register">Register</button>
                </Link>
            </div>
        );
    };

    const handleCartClick = (e: React.MouseEvent) => {
        e.preventDefault();
        toggleCart();
    };

    return (
        <header>
            <nav className='navbar'>
                <div className="container-navbar">
                    <div className="logo">
                        <Link href='/'>
                            <img src="/logo/STRIKETECH-1.png" alt="logo" />
                        </Link>
                    </div>
                    
                    <div className="search-container desktop-only">
                        <input type="text" placeholder="Search products..." />
                        <button className="search-btn">
                            <i className="bi bi-search"></i>
                        </button>
                    </div>

                    <div className="nav-actions desktop-only">
                        {renderAuthButtons()}
                        <div className="cart" onClick={handleCartClick}>
                            <i className="bi bi-cart3"></i>
                            <span className="cart-count">{totalItems}</span>
                        </div>
                    </div>

                    <button className="burger-menu" onClick={toggleMobileMenu}>
                        <i className={`bi ${isMobileMenuOpen ? 'bi-x' : 'bi-list'}`}></i>
                    </button>
                </div>
            </nav>
            <div 
                className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`} 
                ref={mobileMenuRef}
            >
                <div className="search-container">
                    <input type="text" placeholder="Search products..." />
                    <button className="search-btn">
                        <i className="bi bi-search"></i>
                    </button>
                </div>

                <div className="mobile-auth">
                    {renderMobileAuthButtons()}
                </div>

                <div className="mobile-nav-actions">
                    <div className="cart-action" onClick={handleCartClick}>
                        <i className="bi bi-cart3"></i>
                        <span>Cart ({totalItems})</span>
                    </div>
                </div>

                <div className="mobile-categories">
                    <button className="categories-toggle" onClick={toggleCategories}>
                        Categories
                        <span className="toggle-icon">
                            {isCategoriesOpen ? '−' : '+'}
                        </span>
                    </button>
                    <ul className={`categories ${isCategoriesOpen ? 'open' : ''}`}>
                        <li><Link href="/category/electronics">Electronics</Link></li>
                        <li><Link href="/category/clothing">Clothing</Link></li>
                        <li><Link href="/category/books">Books</Link></li>
                        <li><Link href="/category/sports">Sports</Link></li>
                        <li><Link href="/category/home">Home & Living</Link></li>
                    </ul>
                </div>
            </div>

            <div className="subnav desktop-only">
                <div className="container-navbar">
                    <ul className="categories">
                        <li><Link href="/category/electronics">Electronics</Link></li>
                        <li><Link href="/category/clothing">Clothing</Link></li>
                        <li><Link href="/category/books">Books</Link></li>
                        <li><Link href="/category/sports">Sports</Link></li>
                        <li><Link href="/category/home">Home & Living</Link></li>
                    </ul>
                </div>
            </div>
            
        </header>
    )
}

export default Navbar