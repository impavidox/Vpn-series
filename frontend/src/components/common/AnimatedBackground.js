import React from 'react';
import '../../styles/AnimatedBackground.css';

/**
 * Animated background component with floating orbs
 * Reusable across multiple pages for consistent UI
 */
const AnimatedBackground = () => {
  return (
    <div className="background-animations">
      <div className="bg-orb orb-cyan"></div>
      <div className="bg-orb orb-orange"></div>
      <div className="bg-orb orb-yellow"></div>
    </div>
  );
};

export default AnimatedBackground;