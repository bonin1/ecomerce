"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/app/utils/apiClient";
import Link from "next/link";
import Image from "next/image";
import "./UnsubscribePage.scss";

const UnsubscribePage = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState(
    "Processing your unsubscribe request..."
  );
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      setStatus("error");
      setMessage(
        "Invalid unsubscribe link. Please check your email and try again."
      );
      return;
    }

    const processUnsubscribe = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const response = await apiClient(
          `/newsletter/unsubscribe?email=${encodeURIComponent(
            email
          )}&token=${token}`
        );

        if (response.success) {
          setStatus("success");
          setMessage("You have successfully unsubscribed from our newsletter.");
        } else {
          setStatus("error");
          setMessage(
            response.message || "Failed to unsubscribe. Please try again later."
          );
        }
      } catch (error: any) {
        setStatus("error");
        setMessage(
          error.message || "An error occurred while processing your request."
        );
      }
    };

    processUnsubscribe();
  }, [searchParams]);

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
          {status === "loading" && (
            <>
              <div className="loading-spinner"></div>
              <p className="message">{message}</p>
              <p className="sub-message">
                This should only take a moment. Please don't close this page.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="status-icon success">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <p className="message">{message}</p>
              <p className="sub-message">
                We're sorry to see you go. If you change your mind, you can
                always resubscribe to receive updates on our latest products,
                exclusive offers, and tech insights.
              </p>
              <div className="action-buttons">
                <Link href="/newsletter/subscribe" className="btn btn-primary">
                  Resubscribe
                </Link>
                <Link href="/" className="btn btn-secondary">
                  Return to Homepage
                </Link>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="status-icon error">
                <i className="bi bi-x-circle-fill"></i>
              </div>
              <p className="message">{message}</p>
              <p className="sub-message">
                There was a problem processing your unsubscribe request. The
                link may have expired or is invalid. If you continue having
                issues, please contact our support team.
              </p>
              <div className="action-buttons">
                <Link href="/contact" className="btn btn-primary">
                  Contact Support
                </Link>
                <Link href="/" className="btn btn-secondary">
                  Return to Homepage
                </Link>
              </div>
            </>
          )}
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

export default UnsubscribePage;
