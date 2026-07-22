import React, { useRef } from 'react';
import { useSpotlightGlow } from '../lib/useSpotlightGlow';

const SpotlightGlow = () => {
  const glowRef = useRef(null);
  useSpotlightGlow(glowRef);

  return <div className="spotlight-glow" ref={glowRef} aria-hidden="true" />;
};

export default SpotlightGlow;
