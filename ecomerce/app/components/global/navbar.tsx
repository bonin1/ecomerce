'use client'

import React, { useState } from 'react'
import './navbar.scss'
import Link from 'next/link'

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        if (isCategoriesOpen) setIsCategoriesOpen(false);
    };

    const toggleCategories = () => {
        setIsCategoriesOpen(!isCategoriesOpen);
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
                        <div className="auth-buttons">
                            <Link href="/login">
                                <button className="login">Login</button>
                            </Link>
                            <Link href="/register">
                                <button className="register">Register</button>
                            </Link>
                        </div>
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

                <div className="auth-buttons">
                    <Link href="/login">
                        <button className="login">Login</button>
                    </Link>
                    <Link href="/register">
                        <button className="register">Register</button>
                    </Link>
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