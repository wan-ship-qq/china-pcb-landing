import * as THREE from 'https://esm.sh/three@0.160.0';
import { GLTFLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const fileInput = document.querySelector('#fileInput');
const fileName = document.querySelector('#fileName');
fileInput?.addEventListener('change', () => {
  const files = [...fileInput.files].map(f => f.name).join(', ');
  fileName.textContent = files || 'ZIP / RAR / GBR';
});

const quoteForm = document.querySelector('#quoteForm');
const formStatus = document.querySelector('#formStatus');
quoteForm?.addEventListener('submit', async (event) => {
  const action = quoteForm.getAttribute('action') || '';
  if (action.includes('YOUR_FORM_ID')) {
    event.preventDefault();
    formStatus.textContent = 'Форма ещё не подключена: нужен реальный endpoint Formspree/Getform.';
    formStatus.className = 'form-status error';
    return;
  }
  event.preventDefault();
  const button = quoteForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Отправляем...';
  formStatus.textContent = '';
  formStatus.className = 'form-status';
  try {
    const response = await fetch(action, {
      method: 'POST',
      body: new FormData(quoteForm),
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('send failed');
    quoteForm.reset();
    fileName.textContent = 'ZIP / RAR / GBR';
    formStatus.textContent = 'Заявка отправлена. Мы свяжемся с вами для расчёта.';
    formStatus.className = 'form-status ok';
  } catch (error) {
    formStatus.textContent = 'Не удалось отправить форму. Напишите напрямую в Telegram: @crptdvd';
    formStatus.className = 'form-status error';
  } finally {
    button.disabled = false;
    button.textContent = 'Отправить заявку';
  }
});

const canvas = document.querySelector('#pcbCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 1.2, 7.2);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const group = new THREE.Group();
group.rotation.x = -0.28;
scene.add(group);

const loader = new GLTFLoader();
const modelShell = new THREE.Group();
group.add(modelShell);

const platform = new THREE.Mesh(
  new THREE.CylinderGeometry(2.85, 2.85, 0.035, 96),
  new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.08 })
);
platform.position.y = -1.35;
group.add(platform);

const ring = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.CylinderGeometry(2.9, 2.9, 0.04, 96)),
  new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.28 })
);
ring.position.copy(platform.position);
group.add(ring);

loader.load(
  'assets/models/drone.glb',
  (gltf) => {
    const object = gltf.scene;
    modelShell.add(object);

    object.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.side = THREE.DoubleSide;
        child.material.metalness = Math.min(child.material.metalness ?? 0.2, 0.55);
        child.material.roughness = child.material.roughness ?? 0.48;
        child.material.needsUpdate = true;
      }
    });

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    const scale = 4.25 / maxAxis;

    object.position.sub(center);
    object.scale.setScalar(scale);
    object.rotation.x = -0.18;

    const scaledBox = new THREE.Box3().setFromObject(object);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    object.position.sub(scaledCenter);
  },
  undefined,
  () => {
    const fallback = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.18, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x101722, roughness: 0.45, metalness: 0.35 })
    );
    modelShell.add(fallback);
  }
);

scene.add(new THREE.AmbientLight(0x9fcfff, 1.4));
const key = new THREE.DirectionalLight(0x00d4ff, 2.1);
key.position.set(3, 4, 5);
scene.add(key);
const rim = new THREE.DirectionalLight(0x00ff88, 1.4);
rim.position.set(-3, -2, 4);
scene.add(rim);

let dragging = false;
let lastX = 0;
let lastY = 0;
let targetRotY = 0.12;
let targetRotX = -0.28;

function pointerPos(event) {
  const p = event.touches?.[0] || event;
  return { x: p.clientX, y: p.clientY };
}

canvas.addEventListener('pointerdown', (event) => {
  dragging = true;
  canvas.setPointerCapture?.(event.pointerId);
  const p = pointerPos(event);
  lastX = p.x;
  lastY = p.y;
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const p = pointerPos(event);
  const dx = p.x - lastX;
  const dy = p.y - lastY;
  lastX = p.x;
  lastY = p.y;
  targetRotY += dx * 0.01;
  targetRotX = Math.max(-1.05, Math.min(0.65, targetRotX + dy * 0.008));
});
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('pointerleave', () => { dragging = false; });

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function animate(t) {
  if (!dragging) targetRotY += 0.0022;
  group.rotation.x += (targetRotX - group.rotation.x) * 0.08;
  group.rotation.y += (targetRotY - group.rotation.y) * 0.08;
  group.position.y = Math.sin(t * 0.001) * 0.06;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightboxImage');
const lightboxTitle = document.querySelector('#lightboxTitle');
const lightboxClose = document.querySelector('.lightbox-close');
function closeLightbox() {
  lightbox?.classList.remove('open');
  lightbox?.setAttribute('aria-hidden', 'true');
  if (lightboxImage) lightboxImage.src = '';
}
document.querySelectorAll('.work-card[data-full]').forEach((card) => {
  card.addEventListener('click', () => {
    if (!lightbox || !lightboxImage) return;
    lightboxImage.src = card.dataset.full;
    lightboxImage.alt = card.querySelector('img')?.alt || card.dataset.title || 'Фото работы';
    if (lightboxTitle) lightboxTitle.textContent = card.dataset.title || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  });
});
lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLightbox();
});
