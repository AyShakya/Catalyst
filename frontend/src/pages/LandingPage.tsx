import React from 'react';
import Hero from '../components/landing/Hero';
import ProductFlow from '../components/landing/ProductFlow';
import DemoVideo from '../components/landing/DemoVideo';
import Features from '../components/landing/Features';
import Footer from '../components/landing/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page bg-background">
      <Hero />
      <ProductFlow />
      <DemoVideo />
      <Features />
      <Footer />
    </div>
  );
};

export default LandingPage;
