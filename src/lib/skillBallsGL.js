/**
 * skillBallsGL — WebGL renderer for the skill balls (three.js, loaded lazily on
 * desktop only). Each ball is a lit sphere whose texture carries the brand
 * logo on its front and back, so it reads as a 3D ball rolling as it spins.
 *
 * The camera is orthographic and mapped 1:1 to CSS pixels, so physics
 * coordinates are used directly. Returns { render, resize, dispose } or null
 * when WebGL isn't available.
 */
import * as THREE from 'three';

const TEX_H = 256;
const TEX_W = TEX_H * 2; // equirectangular
const LOGO_SIZE = TEX_H * 0.36;

// Paint the ball: brand colour with the logo on the front (u = 0.25 faces the
// camera in three's sphere UVs) and on the back, so a full spin never shows a
// blank side.
const makeTexture = ({ color, logo, path }) => {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  const glyph = new Path2D(path);
  const scale = LOGO_SIZE / 24;
  ctx.fillStyle = logo;
  [0.25, 0.75].forEach((u) => {
    ctx.save();
    ctx.translate(TEX_W * u - LOGO_SIZE / 2, TEX_H / 2 - LOGO_SIZE / 2);
    ctx.scale(scale, scale);
    ctx.fill(glyph);
    ctx.restore();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

export const createSkillBallsGL = (canvas, items) => {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1000, 1000);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-0.5, 0.8, 1);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc8ff00, 0.9); // lime edge, the site accent
  rim.position.set(0.9, -0.6, 0.4);
  scene.add(rim);

  const geometry = new THREE.SphereGeometry(1, 40, 28);
  const textures = items.map(makeTexture);
  const meshes = items.map((item, i) => {
    const material = new THREE.MeshStandardMaterial({
      map: textures[i],
      roughness: 0.32,
      metalness: 0.08,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
  });

  const resize = (width, height) => {
    renderer.setSize(width, height, false);
    camera.left = 0;
    camera.right = width;
    camera.top = 0;
    camera.bottom = -height;
    camera.updateProjectionMatrix();
  };

  const render = (balls) => {
    balls.forEach((b, i) => {
      const mesh = meshes[i];
      mesh.visible = b.live;
      if (!b.live) return;
      mesh.position.set(b.x, -b.y, 0);
      mesh.scale.setScalar(b.r);
      // Roll around the depth axis, with a slight lean into the motion for depth.
      mesh.rotation.set(
        Math.max(-0.5, Math.min(0.5, b.vy * 0.00025)),
        Math.max(-0.5, Math.min(0.5, b.vx * 0.00025)),
        -b.angle
      );
    });
    renderer.render(scene, camera);
  };

  const dispose = () => {
    geometry.dispose();
    meshes.forEach((mesh) => mesh.material.dispose());
    textures.forEach((texture) => texture.dispose());
    renderer.dispose();
  };

  return { render, resize, dispose };
};
