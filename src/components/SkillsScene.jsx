import React, { useEffect, useRef } from 'react';
import { createSkillsScene } from '../lib/skillsScene';

const SkillsScene = ({ isMobile }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isMobile || !canvasRef.current) return;
    let scene;
    try {
      scene = createSkillsScene(canvasRef.current);
    } catch {
      scene = { dispose: () => {} };
    }
    return scene.dispose;
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <canvas
      ref={canvasRef}
      className="skills-scene-canvas"
      aria-hidden="true"
    />
  );
};

export default SkillsScene;
