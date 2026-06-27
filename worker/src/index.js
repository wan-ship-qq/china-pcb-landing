const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['zip', 'rar', '7z', 'gerber', 'gbr', 'xlsx', 'xls', 'csv', 'pdf', 'txt']);
const TELEGRAM_API = 'https://api.telegram.org';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ ok: false, error: 'Method not allowed' }, 405, request, env);
    }

    try {
      assertConfig(env);

      const form = await request.formData();
      if ((form.get('website') || '').toString().trim()) {
        return jsonResponse({ ok: true }, 200, request, env);
      }

      await verifyTurnstile(form.get('cf-turnstile-response'), request, env);

      const fields = getFields(form);
      const files = form.getAll('file').filter((item) => item instanceof File && item.size > 0);

      validateFields(fields);
      validateFiles(files);

      await sendTelegramMessage(env, buildLeadMessage(fields, files));

      for (const file of files) {
        await sendTelegramDocument(env, file, buildFileCaption(fields, file));
      }

      return jsonResponse({ ok: true }, 200, request, env);
    } catch (error) {
      const status = error.status || 500;
      return jsonResponse({ ok: false, error: error.message || 'Send failed' }, status, request, env);
    }
  }
};

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = env.ALLOWED_ORIGIN || 'https://pcb-supply.ru';
  const allowOrigin = origin === allowedOrigin || origin === 'http://localhost:3000' ? origin : allowedOrigin;

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function jsonResponse(payload, status, request, env) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(request, env),
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertConfig(env) {
  if (!env.TELEGRAM_BOT_TOKEN) throw httpError('TELEGRAM_BOT_TOKEN is not configured', 500);
  if (!env.TELEGRAM_CHAT_ID) throw httpError('TELEGRAM_CHAT_ID is not configured', 500);
  if (!env.TURNSTILE_SECRET_KEY) throw httpError('TURNSTILE_SECRET_KEY is not configured', 500);
}

async function verifyTurnstile(token, request, env) {
  const turnstileToken = (token || '').toString();
  if (!turnstileToken) throw httpError('Turnstile token is missing', 400);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: turnstileToken,
      remoteip: request.headers.get('CF-Connecting-IP') || ''
    })
  });
  const result = await response.json();
  if (!result.success) throw httpError('Turnstile verification failed', 403);
}

function getFields(form) {
  return {
    name: clean(form.get('name')),
    email: clean(form.get('email')),
    phone: clean(form.get('phone')),
    comment: clean(form.get('comment')),
    source: clean(form.get('source')) || 'china-pcb-landing',
    consent: clean(form.get('consent'))
  };
}

function clean(value) {
  return (value || '').toString().trim();
}

function validateFields(fields) {
  if (!fields.name) throw httpError('Name is required', 400);
  if (!fields.email && !fields.phone) throw httpError('Contact is required', 400);
  if (!fields.consent) throw httpError('Consent is required', 400);
}

function validateFiles(files) {
  if (!files.length) throw httpError('File is required', 400);

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) throw httpError(`File ${file.name} is too large`, 400);
    if (!ALLOWED_EXTENSIONS.has(getExtension(file.name))) {
      throw httpError(`File ${file.name} has unsupported extension`, 400);
    }
  }
}

function getExtension(fileName = '') {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

function buildLeadMessage(fields, files) {
  const lines = [
    'Новая заявка PCB Supply',
    '',
    `Имя: ${fields.name}`,
    `Email: ${fields.email || '-'}`,
    `Контакт: ${fields.phone || '-'}`,
    `Источник: ${fields.source}`,
    '',
    `Файлы: ${files.map((file) => `${file.name} (${formatBytes(file.size)})`).join(', ')}`
  ];

  if (fields.comment) {
    lines.push('', `Комментарий: ${fields.comment}`);
  }

  return lines.join('\n');
}

function buildFileCaption(fields, file) {
  const contact = fields.phone || fields.email || fields.name;
  return `PCB Supply: ${fields.name} · ${contact}\n${file.name}`;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function sendTelegramMessage(env, text) {
  const response = await fetch(`${TELEGRAM_API}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text
    })
  });

  await assertTelegramOk(response);
}

async function sendTelegramDocument(env, file, caption) {
  const body = new FormData();
  body.append('chat_id', env.TELEGRAM_CHAT_ID);
  body.append('caption', caption.slice(0, 1024));
  body.append('document', file, file.name || 'pcb-file');

  const response = await fetch(`${TELEGRAM_API}/bot${env.TELEGRAM_BOT_TOKEN}/sendDocument`, {
    method: 'POST',
    body
  });

  await assertTelegramOk(response);
}

async function assertTelegramOk(response) {
  if (response.ok) return;
  const details = await response.text();
  throw httpError(`Telegram API error: ${details}`, 502);
}
