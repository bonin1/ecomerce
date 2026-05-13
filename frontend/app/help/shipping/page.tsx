"use client";

import React, { useState, useEffect } from "react";
import ShippingHeader from "@/app/components/shipping/Header";
import { motion } from "framer-motion";
import {
  IoAirplaneOutline,
  IoTimeOutline,
  IoGlobeOutline,
} from "react-icons/io5";
import { MdDone } from "react-icons/md";
import Image from "next/image";
import "./shipping.scss";

const ShippingPage = () => {
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [weight, setWeight] = useState(1);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [activeTab, setActiveTab] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [shippingCost, setShippingCost] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeDot, setActiveDot] = useState(0);

  const countries = [
    "United States",
    "Canada",
    "United Kingdom",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "Spain",
  ];

  const shippingOptions = [
    {
      id: "standard",
      name: "Standard",
      days: "5-7",
      icon: <IoTimeOutline size={24} />,
    },
    {
      id: "express",
      name: "Express",
      days: "2-3",
      icon: <IoAirplaneOutline size={24} />,
    },
    {
      id: "international",
      name: "International",
      days: "7-14",
      icon: <IoGlobeOutline size={24} />,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 4);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const calculateShipping = () => {
    setIsCalculating(true);

    setTimeout(() => {
      let baseCost = weight * 5;

      if (shippingMethod === "express") {
        baseCost *= 2;
      }

      if (selectedCountry !== "United States") {
        baseCost *= 1.5;
      }

      setShippingCost(baseCost.toFixed(2));
      setIsCalculating(false);
    }, 1500);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="shipping-page">
      <ShippingHeader />

      <div className="shipping-content">
        <section className="shipping-section premium-services">
          <div className="container">
            <h2 className="section-title">Premium Shipping Services</h2>

            <div className="service-tabs">
              <div className="tab-headers">
                <button
                  className={`tab-header ${activeTab === 0 ? "active" : ""}`}
                  onClick={() => setActiveTab(0)}
                >
                  Personal Delivery
                </button>
                <button
                  className={`tab-header ${activeTab === 1 ? "active" : ""}`}
                  onClick={() => setActiveTab(1)}
                >
                  Business Shipping
                </button>
                <button
                  className={`tab-header ${activeTab === 2 ? "active" : ""}`}
                  onClick={() => setActiveTab(2)}
                >
                  International
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 0 && (
                  <motion.div
                    className="tab-panel"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                  >
                    <motion.div variants={fadeInUp} className="service-feature">
                      <div className="feature-icon">
                        <Image
                          src="/images/personal-delivery.svg"
                          alt="Personal Delivery"
                          width={60}
                          height={60}
                        />
                      </div>
                      <div className="feature-content">
                        <h3>White Glove Delivery</h3>
                        <p>
                          Our premium white glove service ensures your valuable
                          purchases are handled with the utmost care from our
                          warehouse to your home.
                        </p>
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="service-feature">
                      <div className="feature-icon">
                        <Image
                          src="/images/same-day.svg"
                          alt="Same Day Delivery"
                          width={60}
                          height={60}
                        />
                      </div>
                      <div className="feature-content">
                        <h3>Same-Day Delivery</h3>
                        <p>
                          Available in select cities, our same-day delivery
                          ensures your items reach you within hours of purchase.
                        </p>
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="service-feature">
                      <div className="feature-icon">
                        <Image
                          src="/images/signature.svg"
                          alt="Signature Required"
                          width={60}
                          height={60}
                        />
                      </div>
                      <div className="feature-content">
                        <h3>Signature & ID Verification</h3>
                        <p>
                          Enhanced security with signature and ID verification
                          for valuable items and gifts.
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {activeTab === 1 && (
                  <motion.div
                    className="tab-panel"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                  >
                    <motion.div variants={fadeInUp} className="service-feature">
                      <div className="feature-icon">
                        <Image
                          src="/images/bulk-shipping.svg"
                          alt="Bulk Shipping"
                          width={60}
                          height={60}
                        />
                      </div>
                      <div className="feature-content">
                        <h3>Bulk Shipping Solutions</h3>
                        <p>
                          Specialized logistics for business orders with volume
                          discounts and dedicated account managers.
                        </p>
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="service-feature">
                      <div className="feature-icon">
                        <Image
                          src="/images/business-account.svg"
                          alt="Business Account"
                          width={60}
                          height={60}
                        />
                      </div>
                      <div className="feature-content">
                        <h3>Business Account Benefits</h3>
                        <p>
                          Special rates, priority handling, and custom shipping
                          schedules for business clients.
                        </p>
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="service-feature">
                      <div className="feature-icon">
                        <Image
                          src="/images/api-integration.svg"
                          alt="API Integration"
                          width={60}
                          height={60}
                        />
                      </div>
                      <div className="feature-content">
                        <h3>API Integration</h3>
                        <p>
                          Seamlessly integrate our shipping services with your
                          e-commerce platform or inventory management system.
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {activeTab === 2 && (
                  <motion.div
                    className="tab-panel"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                  >
                    <motion.div variants={fadeInUp} className="service-feature">
                      <div className="feature-icon">
                        <Image
                          src="/images/global-shipping.svg"
                          alt="Global Shipping"
                          width={60}
                          height={60}
                        />
                      </div>
                      <div className="feature-content">
                        <h3>Global Shipping Network</h3>
                        <p>
                          Our established network allows us to ship to over 200
                          countries with reliable tracking and competitive
                          rates.
                        </p>
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="service-feature">
                      <div className="feature-icon">
                        <Image
                          src="/images/customs-clearance.svg"
                          alt="Customs Clearance"
                          width={60}
                          height={60}
                        />
                      </div>
                      <div className="feature-content">
                        <h3>Customs Clearance Assistance</h3>
                        <p>
                          Our experts handle all documentation and customs
                          requirements for smooth international shipping.
                        </p>
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="service-feature">
                      <div className="feature-icon">
                        <Image
                          src="/images/international-tracking.svg"
                          alt="International Tracking"
                          width={60}
                          height={60}
                        />
                      </div>
                      <div className="feature-content">
                        <h3>Enhanced International Tracking</h3>
                        <p>
                          Real-time tracking with detailed status updates
                          throughout the international delivery journey.
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="shipping-section shipping-calculator">
          <div className="container">
            <motion.h2
              className="section-title"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Shipping Cost Calculator
            </motion.h2>

            <motion.div
              className="calculator-container"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="calculator-form">
                <div className="form-group">
                  <label htmlFor="country">Destination</label>
                  <select
                    id="country"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="premium-select"
                  >
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Package Weight (kg)</label>
                  <div className="weight-slider">
                    <input
                      type="range"
                      min="0.1"
                      max="20"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(parseFloat(e.target.value))}
                    />
                    <div className="weight-value">{weight} kg</div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Shipping Method</label>
                  <div className="shipping-methods">
                    {shippingOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`shipping-method ${
                          shippingMethod === option.id ? "active" : ""
                        }`}
                        onClick={() => setShippingMethod(option.id)}
                      >
                        <div className="method-icon">{option.icon}</div>
                        <div className="method-info">
                          <div className="method-name">{option.name}</div>
                          <div className="method-days">
                            {option.days} business days
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className="calculate-btn"
                  onClick={calculateShipping}
                  disabled={isCalculating}
                >
                  {isCalculating ? "Calculating..." : "Calculate Shipping Cost"}
                </button>
              </div>

              {shippingCost !== null && !isCalculating && (
                <motion.div
                  className="calculation-result"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="result-content">
                    <h3>Estimated Shipping Cost</h3>
                    <div className="result-price">${shippingCost}</div>
                    <p>
                      Shipping to {selectedCountry} via{" "}
                      {shippingMethod.charAt(0).toUpperCase() +
                        shippingMethod.slice(1)}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        <section className="shipping-section">
          <div className="container">
            <h2 className="section-title">Frequently Asked Questions</h2>

            <div className="accordion-faq">
              {[
                {
                  question: "How long will my order take to arrive?",
                  answer:
                    "Standard shipping typically takes 5-7 business days. Express shipping takes 2-3 business days within the continental US. International shipping times vary by destination, usually between 7-14 business days. You can always track your package in real-time through your account dashboard.",
                },
                {
                  question:
                    "Can I change my shipping address after placing my order?",
                  answer:
                    "Address changes can only be accommodated if the order hasn't shipped. Please contact customer service immediately through our 24/7 chat support or premium customer service line. Our team will do everything possible to update your shipping details before the order is processed.",
                },
                {
                  question: "Do you ship to PO boxes?",
                  answer:
                    "Yes, we ship to PO boxes for standard shipping. Express shipping requires a physical address due to courier requirements. International shipping to PO boxes may be restricted in certain countries - please check with our customer service team before placing an order to a PO box outside the US.",
                },
                {
                  question: "What if my package is damaged or lost?",
                  answer:
                    "All shipments include premium insurance at no additional cost. If your package arrives damaged, please document with photos and contact our support within 48 hours. For lost packages, once tracking confirms no delivery after the estimated date, our dedicated resolution team will initiate a claim process and expedite a replacement or refund.",
                },
                {
                  question:
                    "Do you offer gift wrapping and personalized messages?",
                  answer:
                    "Yes, we offer luxury gift wrapping services with premium materials and the option to include personalized handwritten messages with any order. You can select these options during checkout for a small additional fee. Our gift wrapping service includes high-quality paper, satin ribbon, and a wax seal for that special touch.",
                },
              ].map((faq, index) => (
                <div
                  key={index}
                  className={`faq-accordion-item ${
                    expandedFaq === index ? "expanded" : ""
                  }`}
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                >
                  <div className="faq-header">
                    <h4>{faq.question}</h4>
                    <div className="accordion-icon">
                      {expandedFaq === index ? "−" : "+"}
                    </div>
                  </div>
                  <motion.div
                    className="faq-content"
                    initial={false}
                    animate={{ height: expandedFaq === index ? "auto" : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p>{faq.answer}</p>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="shipping-section cta-section">
          <div className="container">
            <div className="cta-container">
              <div className="cta-content">
                <h2>Need Personalized Shipping Solutions?</h2>
                <p>
                  Our premium support team is available 24/7 to assist with
                  special shipping requirements and custom orders.
                </p>
                <div className="cta-buttons">
                  <button className="btn-primary">Contact Support</button>
                  <button className="btn-secondary">Track My Order</button>
                </div>
              </div>
              <div className="cta-image">
                <Image
                  src="/images/premium-support.jpg"
                  alt="Premium Support"
                  width={500}
                  height={350}
                  objectFit="cover"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ShippingPage;
