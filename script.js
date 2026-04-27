const fileInput = document.querySelector('#fileInput');
const fileName = document.querySelector('#fileName');
fileInput?.addEventListener('change', () => {
  const files = [...fileInput.files].map(f => f.name).join(', ');
  fileName.textContent = files || 'ZIP / RAR / 7Z / GBR / BOM / CPL';
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
  const email = quoteForm.querySelector('[name="fi-sender-email"]')?.value.trim();
  const contact = quoteForm.querySelector('[name="fi-text-contact"]')?.value.trim();
  if (!email && !contact) {
    formStatus.textContent = 'Укажите email или контакт в Telegram / MAX / телефоне.';
    formStatus.className = 'form-status error';
    quoteForm.querySelector('[name="fi-text-contact"]')?.focus();
    return;
  }
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
    fileName.textContent = 'ZIP / RAR / 7Z / GBR / BOM / CPL';
    formStatus.textContent = 'Заявка отправлена. Мы получили файлы и свяжемся с вами после проверки.';
    formStatus.className = 'form-status ok';
  } catch (error) {
    const text = encodeURIComponent('Здравствуйте! Хочу рассчитать производство PCB/PCBA.\n\nТип заказа: PCB / PCBA / компоненты\nКоличество:\nСрок:\nДоставка: авиа / авто-экспресс / авто\nФайлы: Gerber / BOM / CPL прикреплю сообщением\nКомментарий:');
    formStatus.innerHTML = `Не удалось отправить форму. <a href="https://t.me/crptdvd?text=${text}" target="_blank" rel="noreferrer">Отправить через Telegram</a>`;
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
dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
dropzone?.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('is-dragover');

  if (!fileInput || !event.dataTransfer?.files?.length) return;

  fileInput.files = event.dataTransfer.files;
  fileName.textContent = [...fileInput.files].map(f => f.name).join(', ');
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

// FAQ accordion: keep only the selected question open
const faqItems = document.querySelectorAll('.faq-list details');
faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    faqItems.forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});
