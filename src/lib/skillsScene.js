/**
 * skillsScene — Lightweight ambient WebGL particle field for the skills section.
 * Floating dot particles that drift slowly and respond to mouse parallax.
 * Returns { dispose } for cleanup.
 */
import * as THREE from 'three';

export const createSkillsScene = (canvas) => {
  if (!canvas || typeof window === 'undefined') return { dispose: () => {} };

  const W = canvas.clientWidth || canvas.offsetWidth || 800;
  const H = canvas.clientHeight || canvas.offsetHeight || 600;

  const getContext = () => {
    try {
      return (
        canvas.getContext('webgl2', { alpha: true, antialias: false }) ||
        canvas.getContext('webgl', { alpha: true, antialias: false }) ||
        canvas.getContext('experimental-webgl', { alpha: true, antialias: false })
      );
    } catch {
      return null;
    }
  };

  const context = getContext();
  if (!context) return { dispose: () => {} };

  // Renderer
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: false });
  } catch {
    return { dispose: () => {} };
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);

  // Scene + Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
  camera.position.z = 5;

  // Particles
  const COUNT = 280;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);

  const limeColor = new THREE.Color('#C8FF00');
  const whiteColor = new THREE.Color('#ffffff');

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

    const col = Math.random() > 0.3 ? whiteColor : limeColor;
    colors[i * 3]     = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Mouse parallax
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  const onMouseMove = (e) => {
    mouse.tx = ((e.clientX / window.innerWidth) - 0.5) * 0.6;
    mouse.ty = ((e.clientY / window.innerHeight) - 0.5) * -0.4;
  };

  window.addEventListener('mousemove', onMouseMove, { passive: true });

  // Resize
  const onResize = () => {
    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 600;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };

  window.addEventListener('resize', onResize, { passive: true });

  // Drift velocities for ambient float
  const velocities = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    velocities[i * 3]     = (Math.random() - 0.5) * 0.0005;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0008;
    velocities[i * 3 + 2] = 0;
  }

  let rafId;
  let alive = true;

  const tick = () => {
    if (!alive) return;
    rafId = requestAnimationFrame(tick);

    // Lerp mouse parallax
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    camera.position.x = mouse.x;
    camera.position.y = mouse.y;

    // Ambient drift — wrap particles
    const pos = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];

      // Wrap bounds
      if (pos[i * 3] > 7)  pos[i * 3] = -7;
      if (pos[i * 3] < -7) pos[i * 3] = 7;
      if (pos[i * 3 + 1] > 4)  pos[i * 3 + 1] = -4;
      if (pos[i * 3 + 1] < -4) pos[i * 3 + 1] = 4;
    }
    geo.attributes.position.needsUpdate = true;

    // Slow rotation
    points.rotation.z += 0.00015;

    renderer.render(scene, camera);
  };

  tick();

  const dispose = () => {
    alive = false;
    cancelAnimationFrame(rafId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', onResize);
    geo.dispose();
    mat.dispose();
    renderer.dispose();
  };

  return { dispose };
};
