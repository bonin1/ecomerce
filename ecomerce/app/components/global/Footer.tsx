"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import "./Footer.scss";
import toast from "react-hot-toast";
import { apiClient } from "@/app/utils/apiClient";

interface Category {
  id: number;
  product_category: string;
}

const Footer = () => {
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient("/product/categories");
        if (response && response.data) {
          setCategories(response.data.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setSubscribing(true);
    
    try {
      const response = await apiClient("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      
      if (response.success) {
        toast.success("Thank you for subscribing to our newsletter!");
        setEmail("");
      } else {
        toast.error(response.message || "You're already subscribed to our newsletter.");
      }
    } catch (error: any) {
      console.error("Subscribe error:", error);
      toast.error(error.message || "Failed to subscribe. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="container">
          <div className="footer-top">
            <div className="footer-intro">
              <div className="footer-logo">
                <img src="/logo/STRIKETECH-1.png" alt="StrikeTech Logo" />
              </div>

              <div className="company-info">
                <p>
                  Founded in 2025, StrikeTech has quickly become the premier
                  destination for tech enthusiasts, offering cutting-edge
                  products and unparalleled customer service.
                </p>
              </div>
            </div>

            <div className="footer-newsletter">
              <h3>Stay Updated</h3>
              <p>
                Subscribe to get exclusive deals, product updates, and tech news
                delivered to your inbox.
              </p>
              <form onSubmit={handleSubscribe}>
                <div className="input-group">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={subscribing}
                  />
                  <button type="submit" disabled={subscribing}>
                    {subscribing ? "Subscribing..." : "Subscribe"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="footer-middle">
            <div className="footer-links-section">
              <div className="footer-links-column">
                <h4>Shop Categories</h4>
                {loading ? (
                  <div className="loading-categories">Loading...</div>
                ) : (
                  <ul>
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <li key={category.id}>
                          <Link
                            href={`/category/${category.product_category.toLowerCase()}`}
                          >
                            {category.product_category}
                          </Link>
                        </li>
                      ))
                    ) : (
                      <>
                        <li>
                          <Link href="/category/electronics">Electronics</Link>
                        </li>
                        <li>
                          <Link href="/category/clothing">Clothing</Link>
                        </li>
                        <li>
                          <Link href="/category/books">Books</Link>
                        </li>
                      </>
                    )}
                    <li>
                      <Link href="/categories">All Categories</Link>
                    </li>
                  </ul>
                )}
              </div>

              <div className="footer-links-column">
                <h4>Customer Service</h4>
                <ul>
                  <li>
                    <Link href="/help/shipping">Shipping Info</Link>
                  </li>
                  <li>
                    <Link href="/help/returns">Returns & Refunds</Link>
                  </li>
                  <li>
                    <Link href="/help/order-status">Order Status</Link>
                  </li>
                  <li>
                    <Link href="/help/faq">FAQs</Link>
                  </li>
                  <li>
                    <Link href="/contact">Contact Support</Link>
                  </li>
                </ul>
              </div>

              <div className="footer-links-column">
                <h4>Company</h4>
                <ul>
                  <li>
                    <Link href="/about">About Us</Link>
                  </li>
                  <li>
                    <Link href="/careers">Careers</Link>
                  </li>
                  <li>
                    <Link href="/affiliate">Affiliate Program</Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="footer-social-payments">
              <div className="social-section">
                <h4>Connect With Us</h4>
                <div className="social-links">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                  >
                    <i className="bi bi-facebook"></i>
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                  >
                    <i className="bi bi-twitter-x"></i>
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <i className="bi bi-instagram"></i>
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                  >
                    <i className="bi bi-linkedin"></i>
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                  >
                    <i className="bi bi-youtube"></i>
                  </a>
                </div>
              </div>

              <div className="payments-section">
                <h4>We Accept</h4>
                <div className="payment-icons">
                  <img src="/images/payment/visa.svg" alt="Visa" />
                  <img src="/images/payment/mastercard.svg" alt="Mastercard" />
                  <img src="/images/payment/amex.svg" alt="American Express" />
                  <img src="/images/payment/paypal.svg" alt="PayPal" />
                  <img src="/images/payment/apple-pay.svg" alt="Apple Pay" />
                  <img src="/images/payment/google-pay.svg" alt="Google Pay" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <p className="copyright">
              &copy; {currentYear} StrikeTech. All Rights Reserved.
            </p>
            <div className="footer-bottom-links">
              <Link href="/terms">Terms of Service</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/cookies">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
