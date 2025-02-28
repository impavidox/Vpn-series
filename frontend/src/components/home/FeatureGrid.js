import React from 'react';
import FeatureBox from './FeatureBox';

/**
 * Grid of feature boxes for the home page
 */
const FeatureGrid = () => {
  const features = [
    {
      icon: '🔍',
      iconColor: 'cyan',
      title: 'Global Search',
      description: 'Find content across multiple streaming platforms worldwide'
    },
    {
      icon: '🎭',
      iconColor: 'orange',
      title: 'Hidden Gems',
      description: 'Discover exclusive regional content not available at home'
    },
    {
      icon: '📊',
      iconColor: 'yellow',
      title: 'Trending Analysis',
      description: 'See what\'s popular in different countries right now'
    },
    {
      icon: '🔐',
      iconColor: 'green',
      title: 'Legal Access',
      description: 'Learn how to access region-locked content without hassle'
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