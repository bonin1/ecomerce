'use client'

import React, { useState, useEffect } from 'react'
import './navbar.scss'
import Link from 'next/link'
import { User } from '@/app/types'

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        setUser(null);
        window.location.href = '/'; 
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        if (isCategoriesOpen) setIsCategoriesOpen(false);
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
                        <div className="profile-dropdown">
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
                        <div className="cart">
                            <i className="bi bi-cart3"></i>
                            <span className="cart-count">0</span>
                        </div>
                    </div>

                    <button className="burger-menu" onClick={toggleMobileMenu}>
                        <i className={`bi ${isMobileMenuOpen ? 'bi-x' : 'bi-list'}`}></i>
                    </button>
                </div>
            </nav>
            <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="search-container">
                    <input type="text" placeholder="Search products..." />
                    <button className="search-btn">
                        <i className="bi bi-search"></i>
                    </button>
                </div>

                <div className="mobile-auth">
                    {renderAuthButtons()}
                </div>

                <div className="mobile-categories">
                    <button className="categories-toggle" onClick={toggleCategories}>
                        Categories {isCategoriesOpen}
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