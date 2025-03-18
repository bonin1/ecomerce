"use client";

import React, { useState } from "react";
import { apiClient } from "@/app/utils/apiClient";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import "../unsubscribe/UnsubscribePage.scss";

const SubscribePage = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiClient("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (response.success) {
        toast.success("Thank you for subscribing to our newsletter!");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        toast.error(
          response.message || "You're already subscribed to our newsletter."
        );
      }
    } catch (error: any) {
      console.error("Subscribe error:", error);
      toast.error(error.message || "Failed to subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="unsubscribe-container">
      <div className="unsubscribe-card">
        <div className="header">
          <Image
            src="/logo/STRIKETECH-1.png"
            alt="StrikeTech Logo"
            width={180}
            height={60}
            className="logo"
          />
          <h1>Newsletter Subscription</h1>
        </div>

        <div className="content">
          <div className="status-icon success">
            <i className="bi bi-envelope-fill"></i>
          </div>
          <p className="message">Join Our Newsletter</p>
          <p className="sub-message">
            Subscribe to get exclusive deals, product updates, and tech news
            delivered to your inbox.
          </p>

          <form onSubmit={handleSubscribe} className="newsletter-form">
            <div className="input-wrapper">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                disabled={submitting}
                className="email-input"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  marginBottom: "1rem",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              {submitting ? "Subscribing..." : "Subscribe Now"}
            </button>
          </form>

          <div className="action-buttons" style={{ marginTop: "1rem" }}>
            <Link href="/" className="btn btn-secondary">
              Return to Homepage
            </Link>
          </div>
        </div>

        <div className="footer">
          <p className="copyright">
            © {currentYear} StrikeTech. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscribePage;
