'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import './navbar.scss'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User } from '@/app/types'
import { useCart } from '@/app/context/CartContext'
import { usePathname } from 'next/navigation'

// Type definitions
interface CategoryType {
  id: string;
  name: string;
  path: string;
}

const categories: CategoryType[] = [
  { id: 'electronics', name: 'Electronics', path: '/category/electronics' },
  { id: 'clothing', name: 'Clothing', path: '/category/clothing' },
  { id: 'books', name: 'Books', path: '/category/books' },
  { id: 'sports', name: 'Sports', path: '/category/sports' },
  { id: 'home', name: 'Home & Living', path: '/category/home' },
];

// ProfileDropdown Component
const ProfileDropdown: React.FC<{
  user: User;
  handleLogout: () => Promise<void>;
  closeDropdown: () => void;
}> = ({ user, handleLogout, closeDropdown }) => {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleNavigation = useCallback((path: string) => {
    closeDropdown();
    router.push(path);
  }, [closeDropdown, router]);
  
  return (
    <div className="profile-dropdown" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
      <button onClick={() => handleNavigation('/profile')} className="dropdown-item">
        <i className="bi bi-person"></i> Profile
      </button>
      <button onClick={() => handleNavigation('/orders')} className="dropdown-item">
        <i className="bi bi-box"></i> Orders
      </button>
      <button onClick={() => handleNavigation('/settings')} className="dropdown-item">
        <i className="bi bi-gear"></i> Settings
      </button>
      <hr className="dropdown-divider" />
      <button onClick={handleLogout} className="dropdown-item text-danger">
        <i className="bi bi-box-arrow-right"></i> Logout
      </button>
    </div>
  );
};

// ProfileSection Component
const ProfileSection: React.FC<{ user: User | null }> = ({ user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isDropdownOpen && 
        profileRef.current && 
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

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
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const closeDropdown = () => setIsDropdownOpen(false);

  if (!user) return null;

  return (
    <div className="profile-section" ref={profileRef}>
      <div className="profile-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
        {user.profilePic ? (
          <img src={user.profilePic} alt={`${user.name}'s profile`} className="profile-pic" />
        ) : (
          <div className="default-profile">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="profile-name">{user.name}</span>
        <i className={`bi bi-chevron-${isDropdownOpen ? 'up' : 'down'} dropdown-arrow`}></i>
      </div>
      
      {isDropdownOpen && (
        <ProfileDropdown 
          user={user} 
          handleLogout={handleLogout} 
          closeDropdown={closeDropdown}
        />
      )}
    </div>
  );
};

// AuthButtons Component
const AuthButtons: React.FC = () => (
  <div className="auth-buttons">
    <Link href="/login" className="auth-button login">
      <i className="bi bi-person"></i> Login
    </Link>
    <Link href="/register" className="auth-button register">
      <i className="bi bi-person-plus"></i> Register
    </Link>
  </div>
);

// SearchBar Component
const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form className="search-container" onSubmit={handleSearch}>
      <input 
        type="text" 
        placeholder="Search products..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search products"
      />
      <button type="submit" className="search-btn" aria-label="Search">
        <i className="bi bi-search"></i>
      </button>
    </form>
  );
};

// SubNavbar Component
const SubNavbar: React.FC = () => {
  const pathname = usePathname();
  
  return (
    <div className="subnav">
      <div className="container-navbar">
        <ul className="categories">
          {categories.map(category => (
            <li key={category.id}>
              <Link 
                href={category.path} 
                className={pathname?.includes(category.id) ? 'active' : ''}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Main Navbar Component
const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toggleCart, totalItems } = useCart();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
      
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
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    // Lock body scroll when mobile menu is open
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isCategoriesOpen) setIsCategoriesOpen(false);
  };

  const toggleCategories = () => {
    setIsCategoriesOpen(!isCategoriesOpen);
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleCart();
  };

  return (
    <header className="header-navigation">
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container-navbar">
          <div className="logo">
            <Link href='/'>
              <img src="/logo/STRIKETECH-1.png" alt="StrikeTech logo" />
            </Link>
          </div>
          
          <div className="search-wrapper desktop-only">
            <SearchBar />
          </div>

          <div className="nav-actions desktop-only">
            {user ? <ProfileSection user={user} /> : <AuthButtons />}
            
            <button className="cart-button" onClick={handleCartClick} aria-label="Shopping cart">
              <i className="bi bi-cart3"></i>
              {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
            </button>
          </div>

          <button 
            className="burger-menu" 
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <i className={`bi ${isMobileMenuOpen ? 'bi-x' : 'bi-list'}`}></i>
          </button>
        </div>
      </nav>
      
      <div 
        className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`} 
        ref={mobileMenuRef}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="mobile-search">
          <SearchBar />
        </div>

        <div className="mobile-auth">
          {user ? <ProfileSection user={user} /> : <AuthButtons />}
        </div>

        <div className="mobile-nav-actions">
          <button className="cart-action" onClick={handleCartClick}>
            <i className="bi bi-cart3"></i>
            <span>Cart {totalItems > 0 ? `(${totalItems})` : ''}</span>
          </button>
        </div>

        <div className="mobile-categories">
          <button 
            className="categories-toggle" 
            onClick={toggleCategories}
            aria-expanded={isCategoriesOpen}
          >
            <span>Categories</span>
            <i className={`bi bi-chevron-${isCategoriesOpen ? 'up' : 'down'}`}></i>
          </button>
          
          <ul className={`categories-list ${isCategoriesOpen ? 'open' : ''}`}>
            {categories.map(category => (
              <li key={category.id}>
                <Link href={category.path}>{category.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <SubNavbar />
    </header>
  )
}

export default Navbar;