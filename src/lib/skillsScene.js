/**
 * skillsScene — ambient WebGL particle field for the skills section, driven by GSAP.
 *
 * three.js only draws; GSAP owns every value that moves:
 *   - entrance   particles start scattered and converge into the field
 *   - scroll     across the layer relay the camera dollies in, the field turns
 *                and the particles shift from white to lime (scrubbed)
 *   - pointer    camera parallax through gsap.quickTo
 * Rendering rides gsap.ticker and only runs while the section is on screen.
 * Returns { dispose } for cleanup.
 */
import * as THREE from 'three';
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion';

const COUNT = 280;
const BASE_OPACITY = 0.55;
const SCATTER = 2.8; // entrance spread, as a multiple of the resting field

export const createSkillsScene = (canvas) => {
  if (!canvas || typeof window === 'undefined') return { dispose: () => {} };

  const reduced = prefersReducedMotion();
  const section = canvas.closest('.s-skills') ?? canvas;
  const relay = section.querySelector('.skills-relay') ?? section;

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

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: false });
  } catch {
    return { dispose: () => {} };
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
  camera.position.z = 5;

  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const velocities = new Float32Array(COUNT * 2);
  const lime = new THREE.Color('#C8FF00');
  const white = new THREE.Color('#ffffff');

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

    const col = Math.random() > 0.3 ? white : lime;
    colors[i * 3]     = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;

    velocities[i * 2]     = (Math.random() - 0.5) * 0.0005;
    velocities[i * 2 + 1] = (Math.random() - 0.5) * 0.0008;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // material.color multiplies the vertex colours, so tinting it lime pulls the
  // white particles to lime while the lime ones stay lime.
  const mat = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: BASE_OPACITY,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Everything GSAP animates. render() reads it once per frame.
  const state = {
    spread: reduced ? 1 : SCATTER,
    reveal: reduced ? 1 : 0,
    dolly: 0,
    tint: 0,
    spin: 0,
    mx: 0,
    my: 0,
  };

  const render = () => {
    const pos = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     += velocities[i * 2];
      pos[i * 3 + 1] += velocities[i * 2 + 1];
      if (pos[i * 3] > 7) pos[i * 3] = -7;
      else if (pos[i * 3] < -7) pos[i * 3] = 7;
      if (pos[i * 3 + 1] > 4) pos[i * 3 + 1] = -4;
      else if (pos[i * 3 + 1] < -4) pos[i * 3 + 1] = 4;
    }
    geo.attributes.position.needsUpdate = true;

    state.spin += 0.00015;
    points.scale.setScalar(state.spread);
    points.rotation.z = state.spin + state.dolly * 0.5;
    mat.opacity = BASE_OPACITY * state.reveal;
    mat.color.copy(white).lerp(lime, state.tint);
    camera.position.set(state.mx, state.my, 5 - state.dolly * 1.6);

    renderer.render(scene, camera);
  };

  const onResize = () => {
    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 600;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (reduced) render();
  };
  window.addEventListener('resize', onResize, { passive: true });

  if (reduced) {
    render();
    return {
      dispose: () => {
        window.removeEventListener('resize', onResize);
        geo.dispose();
        mat.dispose();
        renderer.dispose();
      },
    };
  }

  let running = false;
  const setRunning = (next) => {
    if (next === running) return;
    running = next;
    if (running) gsap.ticker.add(render);
    else gsap.ticker.remove(render);
  };

  const xTo = gsap.quickTo(state, 'mx', { duration: 1.2, ease: 'power3' });
  const yTo = gsap.quickTo(state, 'my', { duration: 1.2, ease: 'power3' });
  const onPointerMove = (e) => {
    if (!running) return;
    xTo((e.clientX / window.innerWidth - 0.5) * 0.6);
    yTo((e.clientY / window.innerHeight - 0.5) * -0.4);
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  const ctx = gsap.context(() => {
    // Entrance: the scattered field converges as the section arrives.
    gsap.to(state, {
      spread: 1,
      reveal: 1,
      duration: 1.8,
      ease: 'expo.out',
      scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none none' },
    });

    // Across the relay: dolly in, turn, and shift white → lime with each layer.
    gsap.to(state, {
      dolly: 1,
      tint: 1,
      ease: 'none',
      scrollTrigger: { trigger: relay, start: 'top top', end: 'bottom bottom', scrub: 0.8 },
    });

    // Render only while the section is on screen.
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: ({ isActive }) => setRunning(isActive),
    });
  });

  // The canvas mounts lazily, possibly with the section already in view.
  const rect = section.getBoundingClientRect();
  setRunning(rect.top < window.innerHeight && rect.bottom > 0);

  const dispose = () => {
    setRunning(false);
    ctx.revert();
    gsap.killTweensOf(state); // the quickTo pointer tweens live outside ctx
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', onResize);
    geo.dispose();
    mat.dispose();
    renderer.dispose();
  };

  return { dispose };
};
