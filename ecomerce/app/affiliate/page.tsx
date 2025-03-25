"use client";

import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/affiliate/header/header';
import toast from 'react-hot-toast';
import { apiClient } from '../utils/apiClient';
import './affiliate.scss';

const AffiliatePage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    website: '',
    socialMedia: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Intersection Observer for animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    sectionRefs.current.forEach(section => {
      if (section) observer.observe(section);
    });

    return () => {
      sectionRefs.current.forEach(section => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Replace with your actual API endpoint
      const response = await apiClient('/affiliate/apply', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      
      if (response.success) {
        toast.success('Your application has been submitted successfully!');
        setFormData({
          fullName: '',
          email: '',
          website: '',
          socialMedia: '',
          message: ''
        });
      } else {
        toast.error(response.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Application error:', error);
      toast.error('Failed to submit your application. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      title: 'Industry-Leading Commission',
      description: 'Earn up to 15% commission on every qualified sale, with tiered rates that increase as you drive more sales.',
      icon: 'bi-coin'
    },
    {
      title: '90-Day Cookie Duration',
      description: 'Our extended cookie window gives your referrals three full months to complete their purchase.',
      icon: 'bi-clock-history'
    },
    {
      title: 'Real-Time Analytics',
      description: 'Track clicks, conversions, and earnings in our intuitive, data-rich affiliate dashboard.',
      icon: 'bi-graph-up-arrow'
    },
    {
      title: 'Reliable Monthly Payments',
      description: 'Get paid on time via PayPal, direct deposit, or cryptocurrency with low minimum thresholds.',
      icon: 'bi-cash-stack'
    },
    {
      title: 'Premium Marketing Resources',
      description: 'Access exclusive banners, product images, and pre-written content optimized for conversions.',
      icon: 'bi-megaphone'
    },
    {
      title: 'Dedicated Partner Manager',
      description: 'Work directly with a personal affiliate manager to optimize your strategy and earnings.',
      icon: 'bi-headset'
    }
  ];

  const steps = [
    {
      number: 1,
      title: 'Apply to Join',
      description: 'Complete our simple application form with information about your platform and audience.'
    },
    {
      number: 2,
      title: 'Get Approved',
      description: 'Our team reviews applications within 48 hours and provides quick approval for qualified partners.'
    },
    {
      number: 3,
      title: 'Access Tools & Resources',
      description: 'Set up your account, grab your affiliate links, and access our comprehensive marketing materials.'
    },
    {
      number: 4,
      title: 'Start Earning',
      description: 'Promote StrikeTech products and earn competitive commissions on every qualified sale.'
    }
  ];

  return (
    <div className="affiliate-program-page">
      <Header />
      
      <main>
        <section 
          id="benefits-section" 
          className="benefits-section" 
          ref={el => sectionRefs.current[0] = el}>
          <div className="container">
            <h2>Why Partner With Us</h2>
            <p className="section-intro">
              Join the StrikeTech affiliate network and enjoy industry-leading benefits designed to maximize your earnings and provide everything you need for success.
            </p>
            
            <div className="benefits-grid">
              {benefits.map((benefit, index) => (
                <div className="benefit-card" key={index}>
                  <div className="benefit-icon">
                    <i className={`bi ${benefit.icon}`}></i>
                  </div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section 
          className="how-it-works" 
          ref={el => sectionRefs.current[1] = el}>
          <div className="container">
            <h2>How Our Program Works</h2>
            <p className="section-intro">
              Becoming a StrikeTech affiliate partner is simple. Follow these four easy steps to start earning commissions on your referrals.
            </p>
            <div className="steps-container">
              {steps.map((step) => (
                <div className="step-card" key={step.number}>
                  <div className="step-number">{step.number}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section 
          className="commission-structure" 
          ref={el => sectionRefs.current[2] = el}>
          <div className="container">
            <h2>Tiered Commission Structure</h2>
            <p className="section-intro">
              Our performance-based structure rewards you more as you drive higher sales volume. The more you sell, the higher your commission rate.
            </p>
            <div className="commission-table-container">
              <table className="commission-table">
                <thead>
                  <tr>
                    <th>Monthly Sales</th>
                    <th>Commission Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1-5 sales</td>
                    <td>10%</td>
                  </tr>
                  <tr>
                    <td>6-15 sales</td>
                    <td>12%</td>
                  </tr>
                  <tr>
                    <td>16-30 sales</td>
                    <td>14%</td>
                  </tr>
                  <tr>
                    <td>31+ sales</td>
                    <td>15%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="commission-note">
              *Commission rates are based on the number of qualified sales generated per calendar month. Rate increases are applied automatically.
            </p>
          </div>
        </section>

        <section 
          id="apply-section" 
          className="apply-section" 
          ref={el => sectionRefs.current[3] = el}>
          <div className="container">
            <h2>Apply to Become a Partner</h2>
            <p className="apply-intro">
              Ready to start earning? Complete the application below to join our exclusive affiliate network. Our team will review your information and respond within 48 hours.
            </p>
            
            <form className="affiliate-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input 
                  type="text" 
                  id="fullName" 
                  name="fullName" 
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="website">Website or Blog (if applicable)</label>
                <input 
                  type="url" 
                  id="website" 
                  name="website" 
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com" 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="socialMedia">Social Media Profiles</label>
                <input 
                  type="text" 
                  id="socialMedia" 
                  name="socialMedia" 
                  value={formData.socialMedia}
                  onChange={handleChange}
                  placeholder="@instagram, youtube.com/channel, etc." 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Tell us about your audience and promotion strategy</label>
                <textarea 
                  id="message" 
                  name="message" 
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe your audience demographics, size, and how you plan to promote StrikeTech products..."
                  rows={5} 
                  required
                ></textarea>
              </div>
              
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </section>

        <section 
          className="faq-section" 
          ref={el => sectionRefs.current[4] = el}>
          <div className="container">
            <h2>Frequently Asked Questions</h2>
            <p className="section-intro">
              Get answers to common questions about the StrikeTech affiliate program. If you don't find what you're looking for, please contact our affiliate team.
            </p>
            <div className="faqs">
              <div className="faq-item">
                <h3>When and how will I get paid?</h3>
                <p>We process payments on the 15th of each month for the previous month's earnings. Payment options include PayPal, direct bank transfer, and cryptocurrency. The minimum payout threshold is $50.</p>
              </div>
              
              <div className="faq-item">
                <h3>Which products can I promote?</h3>
                <p>You can promote any product in the StrikeTech catalog. Premium and limited edition items carry the same commission rates, giving you flexibility in your promotion strategy.</p>
              </div>
              
              <div className="faq-item">
                <h3>Is there a traffic requirement?</h3>
                <p>We don't require minimum traffic levels, but we do look for partners with engaged audiences relevant to our product categories. Quality of traffic is more important than quantity.</p>
              </div>
              
              <div className="faq-item">
                <h3>Can international affiliates join?</h3>
                <p>Yes! Our program welcomes affiliates from around the world. We offer multiple payment methods that work internationally, and our tracking system operates 24/7 across all time zones.</p>
              </div>
              
              <div className="faq-item">
                <h3>How is the 90-day cookie tracked?</h3>
                <p>When a visitor clicks your affiliate link, we place a tracking cookie that remains active for 90 days. You'll receive credit for any purchase they make within that period, even if they visit our site multiple times.</p>
              </div>
              
              <div className="faq-item">
                <h3>What marketing materials are available?</h3>
                <p>We provide a comprehensive resource library including high-converting banners, product images, comparison charts, review templates, email swipe copy, and social media content—all optimized for different platforms.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
    </div>
  );
};

export default AffiliatePage;
