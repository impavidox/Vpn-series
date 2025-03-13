import React from 'react';
import '../../styles/components/AnimatedBackground.css';

/**
 * Animated background component with floating orbs
 * Provides visual interest for the app background
 */
const AnimatedBackground = () => {
  return (
    <div className="background-animations" aria-hidden="true">
      <div className="bg-orb orb-cyan"></div>
      <div className="bg-orb orb-orange"></div>
      <div className="bg-orb orb-yellow"></div>
    </div>
  );
};

export default AnimatedBackground;