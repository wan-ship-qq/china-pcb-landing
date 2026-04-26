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
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 3.2, 7);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const group = new THREE.Group();
scene.add(group);

const layerData = [
  { y: .72, color: 0x00ff88, wire: false, name: 'solder mask' },
  { y: .34, color: 0xd9942b, wire: true, name: 'copper top' },
  { y: 0, color: 0x162235, wire: false, name: 'substrate' },
  { y: -.34, color: 0xd9942b, wire: true, name: 'copper bottom' },
  { y: -.72, color: 0x00d4ff, wire: true, name: 'silkscreen' }
];

layerData.forEach((l, idx) => {
  const geo = new THREE.BoxGeometry(4.7, .035, 3.05, 1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ color: l.color, transparent: true, opacity: l.wire ? .38 : .72, wireframe: l.wire });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = l.y;
  mesh.rotation.x = -.18;
  group.add(mesh);

  for (let i = 0; i < 14; i++) {
    const padGeo = new THREE.CylinderGeometry(.035 + (i % 3) * .012, .035 + (i % 3) * .012, .01, 20);
    const padMat = new THREE.MeshBasicMaterial({ color: idx % 2 ? 0x00d4ff : 0x00ff88, transparent: true, opacity: .74 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = Math.PI / 2;
    pad.position.set(-2 + (i % 7) * .66, l.y + .035, -1 + Math.floor(i / 7) * 1.7);
    group.add(pad);
  }
});

const edges = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(4.9, 1.65, 3.2)),
  new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: .22 })
);
edges.rotation.x = -.18;
group.add(edges);

scene.add(new THREE.AmbientLight(0xffffff, 1));

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function animate(t) {
  group.rotation.y = Math.sin(t * 0.00045) * 0.45;
  group.rotation.z = Math.sin(t * 0.0003) * 0.06;
  group.children.forEach((obj, i) => {
    if (obj.isMesh && obj.geometry.type === 'BoxGeometry') {
      obj.position.y += Math.sin(t * 0.0012 + i) * 0.0008;
    }
  });
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
