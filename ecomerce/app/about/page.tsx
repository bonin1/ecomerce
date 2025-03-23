import React from 'react'
import './about.scss'
import Link from 'next/link'

const AboutPage = () => {
  return (
    <div className="about-container">
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="subtitle">Est. 2015</span>
          <h1>Our Story</h1>
          <p>Crafting exceptional experiences through quality products</p>
        </div>
      </section>

      <section className="about-mission">
        <div className="about-section-container">
          <div className="section-heading">
            <span className="overline">Our Mission</span>
            <h2>Redefining Quality in Every Detail</h2>
          </div>
          <div className="mission-content">
            <p>Founded with a passion for excellence, we're committed to bringing curated, high-quality products that enhance everyday life. What started as a small dream has evolved into a destination trusted by thousands of customers worldwide.</p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="about-story">
        <div className="about-section-container">
          <div className="about-story-content">
            <div className="about-story-image">
              <div className="image-placeholder">
                <span className="material-icon">store</span>
              </div>
            </div>
            <div className="about-story-text">
              <span className="overline">Our Journey</span>
              <h2>From Vision to Reality</h2>
              <p>Our journey began with a simple vision: to provide thoughtfully designed products that stand the test of time. We believe in exceptional customer service, sustainable practices, and building long-lasting relationships with our community.</p>
              <p>Every product in our collection is carefully selected, ensuring that we only offer items that meet our exacting standards for quality, design, and functionality.</p>
              <ul className="feature-list">
                <li><span>Exceptional Quality</span></li>
                <li><span>Sustainable Practices</span></li>
                <li><span>Customer-First Approach</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-values">
        <div className="about-section-container">
          <div className="section-heading">
            <span className="overline">What Drives Us</span>
            <h2>Our Core Values</h2>
          </div>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">
                <span className="material-icon">star</span>
              </div>
              <h3>Excellence</h3>
              <p>We never compromise on the quality of our products, ensuring you receive only the best.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <span className="material-icon">handshake</span>
              </div>
              <h3>Integrity</h3>
              <p>Building trust through transparent business practices and honest communication.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <span className="material-icon">eco</span>
              </div>
              <h3>Sustainability</h3>
              <p>Committed to eco-friendly practices that minimize our environmental footprint.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <span className="material-icon">lightbulb</span>
              </div>
              <h3>Innovation</h3>
              <p>Constantly evolving and adapting to bring you innovative solutions and products.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-team">
        <div className="about-section-container">
          <div className="section-heading">
            <span className="overline">The People</span>
            <h2>Meet Our Team</h2>
          </div>
          <div className="team-grid">
            {[
              {role: 'Founder & CEO', desc: 'Visionary leader with 15+ years in retail'},
              {role: 'Creative Director', desc: 'Award-winning designer with an eye for detail'},
              {role: 'Head of Operations', desc: 'Supply chain expert ensuring smooth delivery'},
              {role: 'Customer Experience', desc: 'Dedicated to exceptional service standards'}
            ].map((member, index) => (
              <div key={index} className="team-member">
                <div className="team-member-image">
                  <div className="image-placeholder">
                    <span className="material-icon">person</span>
                  </div>
                </div>
                <h3>Team Member {index + 1}</h3>
                <p className="team-role">{member.role}</p>
                <p className="team-desc">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats">
        <div className="about-section-container">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">8+</span>
              <span className="stat-label">Years of Excellence</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">10k+</span>
              <span className="stat-label">Happy Customers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Curated Products</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Customer Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="about-contact">
        <div className="about-section-container">
          <div className="contact-content">
            <h2>Let's Connect</h2>
            <p>Have questions or feedback? Our team is here to help you find exactly what you're looking for.</p>
            <Link href="/contact" className="contact-button">Get In Touch</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
