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
['dragleave', 'drop'].forEach((eventName) => {
  dropzone?.addEventListener(eventName, () => dropzone.classList.remove('is-dragover'));
});
