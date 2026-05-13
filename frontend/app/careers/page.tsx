import React from 'react';
import { Metadata } from 'next';
import CareerList from '@/app/components/career/Career';

export const metadata: Metadata = {
  title: 'Careers - Join Our Team',
  description: 'Explore career opportunities and join our team. Find your next role and grow with us.',
};

const CareersPage = () => {
    return (
        <main>
            <div className="page-container">
                <div className="careers-hero">
                    <div className="careers-hero-content">
                        <h1>Join Our Team</h1>
                        <p>Discover opportunities to grow your career with us</p>
                    </div>
                </div>
                
                <section className="careers-section">
                <div className="career-container">
                    <div className="section-header">
                        <h2>Open Positions</h2>
                        <p>We're looking for talented individuals to join our team</p>
                    </div>
                    <CareerList />
                </div>
                </section>
            </div>
        </main>
    );
};

export default CareersPage;
