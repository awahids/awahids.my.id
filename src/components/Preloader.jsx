import React, { useEffect, useState } from 'react';
import gsap from 'gsap';

const Preloader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          gsap.to('.preloader', {
            autoAlpha: prefersReducedMotion ? 0 : 1,
            y: prefersReducedMotion ? '0%' : '-100%',
            duration: prefersReducedMotion ? 0.2 : 1,
            ease: prefersReducedMotion ? 'none' : 'expo.inOut',
            onComplete: onComplete
          });
        }, 500);
      }
      setProgress(current);
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="preloader">
      <div className="preloader-panel">
        <div className="pl-head">
          <div className="pl-title">
            <div className="pl-dot"></div>
            <span>System Initialization</span>
          </div>
          <div className="pl-ver">v2.4.0-STABLE</div>
        </div>
        <div className="pl-progress">
          <div className="pl-progress-fill" style={{ transform: `scaleX(${progress / 100})` }}></div>
        </div>
        <div className="pl-meta">
          <span>PORT: 3000</span>
          <span>{Math.round(progress)}% COMPLETE</span>
        </div>
        <div className="pl-logs">
          <div className="pl-log"><b>[OK]</b> Initializing core kernel...</div>
          <div className="pl-log"><b>[OK]</b> Loading asset manifest...</div>
          {progress > 50 && <div className="pl-log"><b>[OK]</b> Establishing secure handshake...</div>}
          {progress > 80 && <div className="pl-log"><b>[OK]</b> Ready for deployment.</div>}
        </div>
      </div>
    </div>
  );
};

export default Preloader;
