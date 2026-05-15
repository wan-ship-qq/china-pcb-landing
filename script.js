
const menuToggle = document.querySelector('#menuToggle');
const mobileMenu = document.querySelector('#mobileMenu');
function closeMobileMenu() {
  mobileMenu?.classList.remove('is-open');
  mobileMenu?.setAttribute('aria-hidden', 'true');
  menuToggle?.setAttribute('aria-expanded', 'false');
}
menuToggle?.addEventListener('click', () => {
  const isOpen = mobileMenu?.classList.toggle('is-open');
  mobileMenu?.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMobileMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMobileMenu();
});

const WORKER_URL = 'https://shy-hall-053b.wannahi459.workers.dev';
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['zip', 'rar', '7z', 'gerber', 'gbr', 'xlsx', 'xls', 'csv', 'pdf', 'txt'];
const DEFAULT_FILE_LABEL = 'zip, rar, 7z, gerber, gbr, xlsx, xls, csv, pdf, txt';

const fileInput = document.querySelector('#fileInput');
const fileName = document.querySelector('#fileName');
function updateFileName() {
  const hasFiles = Boolean(fileInput?.files?.length);
  const files = [...(fileInput?.files || [])].map((file) => file.name).join(', ');
  if (fileName) {
    fileName.textContent = files || DEFAULT_FILE_LABEL;
    fileName.classList.toggle('has-file', hasFiles);
  }
}
fileInput?.addEventListener('change', updateFileName);

const quoteForm = document.querySelector('#pcb-form');
const formStatus = document.querySelector('#formStatus');
function setFormStatus(message, type = '') {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.className = `form-status${type ? ` ${type}` : ''}`;
}
function getFileExtension(fileName = '') {
  return fileName.split('.').pop()?.toLowerCase() || '';
}
quoteForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const files = [...(fileInput?.files || [])];
  const email = quoteForm.querySelector('[name="email"]')?.value.trim();
  const phone = quoteForm.querySelector('[name="phone"]')?.value.trim();
  const consent = quoteForm.querySelector('[name="consent"]');

  if (!files.length) {
    setFormStatus('Прикрепите файл для расчёта.', 'error');
    fileInput?.focus();
    return;
  }

  const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);
  if (oversizedFile) {
    setFormStatus(`Файл «${oversizedFile.name}» больше 20 MB. Загрузите файл меньшего размера.`, 'error');
    return;
  }

  const forbiddenFile = files.find((file) => !ALLOWED_EXTENSIONS.includes(getFileExtension(file.name)));
  if (forbiddenFile) {
    setFormStatus('Недопустимый формат файла. Разрешены: zip, rar, 7z, gerber, gbr, xlsx, xls, csv, pdf, txt.', 'error');
    return;
  }

  if (!consent?.checked) {
    setFormStatus('Подтвердите согласие на обработку контактных данных и файлов.', 'error');
    consent?.focus();
    return;
  }

  if (!email && !phone) {
    setFormStatus('Укажите email или контакт в Telegram / MAX / телефоне.', 'error');
    quoteForm.querySelector('[name="phone"]')?.focus();
    return;
  }

  const button = quoteForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Отправляем...';
  setFormStatus('');

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      body: new FormData(quoteForm)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    quoteForm.reset();
    updateFileName();
    setFormStatus('Заявка отправлена. Мы свяжемся с вами после проверки файлов.', 'ok');
  } catch (error) {
    setFormStatus('Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз. Если ошибка повторится — напишите нам в Telegram.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Отправить заявку';
  }
});

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

// Premium minimal motion: section reveal, PCB trace parallax, upload scan state
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) {
  const revealTargets = document.querySelectorAll('.section, .footer');
  revealTargets.forEach((el) => el.classList.add('reveal-init'));
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  revealTargets.forEach((el) => revealObserver.observe(el));

  const traces = document.querySelector('.pcb-traces');
  let raf = null;
  window.addEventListener('pointermove', (event) => {
    if (!traces) return;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const mx = (event.clientX / window.innerWidth - 0.5).toFixed(3);
      const my = (event.clientY / window.innerHeight - 0.5).toFixed(3);
      traces.style.setProperty('--mx', mx);
      traces.style.setProperty('--my', my);
    });
  }, { passive: true });
}

const dropzone = document.querySelector('.dropzone');
['dragenter', 'dragover'].forEach((eventName) => {
  dropzone?.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add('is-dragover');
  });
});
dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
dropzone?.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('is-dragover');

  if (!fileInput || !event.dataTransfer?.files?.length) return;

  fileInput.files = event.dataTransfer.files;
  updateFileName();
});

const mobileCta = document.querySelector('#mobileCta');
const hero = document.querySelector('#hero');
if (mobileCta && hero) {
  const toggleMobileCta = () => {
    const show = window.innerWidth <= 640 && window.scrollY > hero.offsetHeight * 0.65;
    mobileCta.classList.toggle('is-visible', show);
    mobileCta.setAttribute('aria-hidden', show ? 'false' : 'true');
  };
  window.addEventListener('scroll', toggleMobileCta, { passive: true });
  window.addEventListener('resize', toggleMobileCta);
  toggleMobileCta();
}

// FAQ accordion: each column works independently
const faqItems = document.querySelectorAll('.faq-list details');
faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    const columnItems = item.closest('.faq-column')?.querySelectorAll('details') || faqItems;
    columnItems.forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});


const modelStage = document.querySelector('#modelStage');
const modelLoad = document.querySelector('#modelLoad');
modelLoad?.addEventListener('click', async () => {
  if (!modelStage || modelStage.querySelector('model-viewer')) return;
  modelLoad.textContent = 'Загружаем 3D...';
  await import('https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js');
  const viewer = document.createElement('model-viewer');
  viewer.id = 'pcbModel';
  viewer.src = modelStage.dataset.model || 'assets/models/drone.glb';
  viewer.setAttribute('camera-controls', '');
  viewer.setAttribute('auto-rotate', '');
  viewer.setAttribute('auto-rotate-delay', '1200');
  viewer.setAttribute('rotation-per-second', '18deg');
  viewer.setAttribute('interaction-prompt', 'auto');
  viewer.setAttribute('shadow-intensity', '0.45');
  viewer.setAttribute('exposure', '1.35');
  viewer.setAttribute('tone-mapping', 'commerce');
  viewer.setAttribute('camera-orbit', '0deg 68deg auto');
  viewer.setAttribute('min-camera-orbit', 'auto 20deg auto');
  viewer.setAttribute('max-camera-orbit', 'auto 88deg auto');
  viewer.setAttribute('ar', 'false');
  modelStage.appendChild(viewer);
  modelStage.classList.add('is-3d');
});
