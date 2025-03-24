import React from 'react';
import FeatureBox from './FeatureBox';

/**
 * Grid of feature boxes for the home page
 */
const FeatureGrid = () => {
  const features = [
    {
      icon: '🌎',
      iconBg: 'bg-gradient-to-r from-blue-400 to-cyan-300',
      title: 'Select Your Location',
      description: 'Customize your experience by choosing your current region'
    },
    {
      icon: '🎬',
      iconBg: 'bg-gradient-to-r from-rose-400 to-pink-500',
      title: 'Select Your Subscriptions',
      description: 'Choose from your active streaming services to find content across platforms'
    },
    {
      icon: '🔓',
      iconBg: 'bg-gradient-to-r from-emerald-400 to-green-500',
      title: 'Unlock Global Content',
      description: 'Discover exactly which country to connect through for accessing your desired content'
    }
  ];

  return (
    <div className="features-grid">
      {features.map((feature, index) => (
        <FeatureBox
          key={index}
          icon={feature.icon}
          iconColor={feature.iconColor}
          title={feature.title}
          description={feature.description}
        />
      ))}
    </div>
  );
};

export default FeatureGrid;