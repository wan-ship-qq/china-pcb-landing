import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

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

const texture = new THREE.TextureLoader().load('assets/pcb-board.jpg');
texture.colorSpace = THREE.SRGBColorSpace;
texture.anisotropy = 8;

const boardWidth = 5.25;
const boardHeight = 3.55;
const boardDepth = 0.12;

const top = new THREE.Mesh(
  new THREE.PlaneGeometry(boardWidth, boardHeight, 32, 20),
  new THREE.MeshStandardMaterial({ map: texture, roughness: 0.42, metalness: 0.18 })
);
top.position.z = boardDepth / 2 + 0.003;
group.add(top);

const body = new THREE.Mesh(
  new THREE.BoxGeometry(boardWidth, boardHeight, boardDepth),
  new THREE.MeshStandardMaterial({ color: 0x070b0f, roughness: 0.72, metalness: 0.22 })
);
body.position.z = 0;
group.add(body);

const edge = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(boardWidth, boardHeight, boardDepth + 0.01)),
  new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.35 })
);
group.add(edge);

const glow = new THREE.Mesh(
  new THREE.PlaneGeometry(boardWidth * 1.08, boardHeight * 1.12),
  new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.055, side: THREE.DoubleSide })
);
glow.position.z = -0.08;
group.add(glow);

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
