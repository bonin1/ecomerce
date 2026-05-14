"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { apiClient } from "@/app/utils/apiClient";
import { SITE_NAME } from "@/app/config/site";

interface Category {
  id: number;
  product_category: string;
}

const Footer = () => {
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient("/product/categories", {
          skipAuth: true,
        });

        if (response && response.success && Array.isArray(response.data)) {
          setCategories(response.data.slice(0, 6)); 
        }
      } catch (error) {
        console.error("Error fetching categories for footer:", error);
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
        toast.error(
          response.message || "You're already subscribed to our newsletter."
        );
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
    <footer className="bg-white border-t border-slate-200 mt-10">
      {/* Top Newsletter / Trust Strip */}
      <div className="bg-brand-secondary text-white">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold mb-2">Subscribe to our Newsletter</h3>
              <p className="text-slate-300 text-sm">
                Get exclusive deals, product updates, and tech news delivered straight to your inbox.
              </p>
            </div>
            <div className="w-full max-w-md">
              <form method="post" onSubmit={handleSubscribe} className="flex rounded overflow-hidden">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={subscribing}
                  className="flex-1 px-4 py-3 text-slate-800 outline-none w-full"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="bg-brand-primary px-6 font-bold tracking-wide hover:bg-brand-primary/90 transition-colors whitespace-nowrap"
                >
                  {subscribing ? "Wait..." : "Subscribe"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <img src="/logo/STRIKETECH-1.png" alt={`${SITE_NAME} logo`} className="h-12 mb-6" />
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-6">
              {SITE_NAME} — curated tech products and dependable customer service.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-brand-primary hover:text-white transition-colors">
                <i className="bi bi-facebook text-lg"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-brand-primary hover:text-white transition-colors">
                <i className="bi bi-twitter-x text-lg"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-brand-primary hover:text-white transition-colors">
                <i className="bi bi-instagram text-lg"></i>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-brand-primary hover:text-white transition-colors">
                <i className="bi bi-youtube text-lg"></i>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-bold text-slate-800 mb-4 uppercase tracking-wider text-sm">Shop</h4>
            <ul className="space-y-3 list-none p-0 m-0">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/categories/${c.product_category.toLowerCase()}`} className="text-sm text-slate-600 hover:text-brand-primary transition-colors no-underline">
                    {c.product_category}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/categories" className="text-sm text-slate-600 hover:text-brand-primary transition-colors font-medium no-underline">
                  View All Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold text-slate-800 mb-4 uppercase tracking-wider text-sm">Customer Service</h4>
            <ul className="space-y-3 list-none p-0 m-0">
              <li><Link href="/help/shipping" className="text-sm text-slate-600 hover:text-brand-primary transition-colors no-underline">Shipping Info</Link></li>
              <li><Link href="/help/returns" className="text-sm text-slate-600 hover:text-brand-primary transition-colors no-underline">Returns & Refunds</Link></li>
              <li><Link href="/help/order-status" className="text-sm text-slate-600 hover:text-brand-primary transition-colors no-underline">Order Status</Link></li>
              <li><Link href="/help/faq" className="text-sm text-slate-600 hover:text-brand-primary transition-colors no-underline">FAQs</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-600 hover:text-brand-primary transition-colors no-underline">Contact Support</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-slate-800 mb-4 uppercase tracking-wider text-sm">Company</h4>
            <ul className="space-y-3 list-none p-0 m-0">
              <li><Link href="/about" className="text-sm text-slate-600 hover:text-brand-primary transition-colors no-underline">About Us</Link></li>
              <li><Link href="/careers" className="text-sm text-slate-600 hover:text-brand-primary transition-colors no-underline">Careers</Link></li>
              <li><Link href="/affiliate" className="text-sm text-slate-600 hover:text-brand-primary transition-colors no-underline">Affiliate Program</Link></li>
              <li><Link href="/terms" className="text-sm text-slate-600 hover:text-brand-primary transition-colors no-underline">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm text-slate-600 hover:text-brand-primary transition-colors no-underline">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Payment Strip */}
      <div className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {currentYear} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-slate-500 mr-2">Secure Payments:</span>
            <img src="/images/payment/visa.svg" alt="Visa" className="h-6" />
            <img src="/images/payment/mastercard.svg" alt="Mastercard" className="h-6" />
            <img src="/images/payment/amex.svg" alt="American Express" className="h-6" />
            <img src="/images/payment/paypal.svg" alt="PayPal" className="h-6" />
            <img src="/images/payment/apple-pay.svg" alt="Apple Pay" className="h-6" />
            <img src="/images/payment/google-pay.svg" alt="Google Pay" className="h-6" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
