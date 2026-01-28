'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Shield, Star, Zap, TrendingUp, Users, Award } from 'lucide-react';
import './become-agent.css';

export default function BecomeAgentPage() {
  const router = useRouter();

  const handleSubscribe = () => {
    router.push('/become-agent/subscribe');
  };

  const features = [
    { icon: TrendingUp, text: 'Access to exclusive agent discounts on all packages' },
    { icon: Zap, text: 'Priority customer support' },
    { icon: Shield, text: 'Dedicated agent dashboard' },
    { icon: Users, text: 'Real-time booking management' },
    { icon: Award, text: 'Commission tracking and invoicing' },
    { icon: Star, text: 'Marketing materials and resources' },
  ];

  return (
    <div className='become-agent-page'>
      <div className='become-agent-container'>
        {/* Premium Badge */}
        <div className='premium-badge'>
          <Star size={18} />
          <span>PREMIUM MEMBERSHIP</span>
        </div>

        <div className='become-agent-header'>
          <h1 className='become-agent-title'>
            Become an <span className='title-highlight'>Agent</span>
          </h1>
          <p className='become-agent-subtitle'>
            Join our network of travel agents and unlock exclusive benefits
          </p>
        </div>

        <div className='pricing-card-container'>
          <div className='pricing-card'>
            {/* Popular Badge */}
            <div className='popular-badge'>
              <TrendingUp size={14} />
              <span>Most Popular</span>
            </div>

            <div className='pricing-card-header'>
              <div className='pricing-card-title-wrapper'>
                <Shield size={24} className='title-icon' />
                <h2 className='pricing-card-title'>Agent Premium</h2>
              </div>
              <div className='pricing-card-price'>
                <span className='price-amount'>110</span>
                <span className='price-currency'>AED</span>
              </div>
              <p className='pricing-card-period'>per year</p>
              <div className='price-savings'>
                <span>Best value for travel professionals</span>
              </div>
            </div>

            <div className='pricing-card-features'>
              <div className='features-header'>
                <h3>What's Included</h3>
              </div>
              <ul className='features-list'>
                {features.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <li key={index} className='feature-item'>
                      <div className='feature-icon-wrapper'>
                        <IconComponent size={18} className='feature-icon' />
                      </div>
                      <span>{feature.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <button
              onClick={handleSubscribe}
              className='pricing-card-button'
            >
              <span>Subscribe Now</span>
              <Zap size={18} />
            </button>

            <div className='pricing-card-footer'>
              <p>✓ Secure payment via CCAvenue</p>
              <p>✓ Instant activation after payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
