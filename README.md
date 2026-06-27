# China PCB Landing

Лендинг для заказа плат, PCBA и компонентов из Китая в Россию.

## Стиль
Industrial Dark Tech: тёмный фон, циан/зелёный акцент, инженерная сетка, терминальный UI.

## Запуск локально

```bash
python3 -m http.server 3000
```

Открыть: `http://localhost:3000`

## Настройка формы

Форма отправляет заявки на Cloudflare Worker:

```txt
https://shy-hall-053b.wannahi459.workers.dev
```

Worker принимает `multipart/form-data`, проверяет Cloudflare Turnstile и отправляет заявку в Telegram. Файлы пересылаются через `sendDocument`, поэтому их можно скачать прямо из Telegram.

Нужные секреты Worker:

```txt
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
TURNSTILE_SECRET_KEY
```

Деплой:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put TURNSTILE_SECRET_KEY
npm run worker:deploy
```

## Фото работ

Загрузи реальные фото в `assets/works/` с именами `work-1.jpg` ... `work-6.jpg`. Лендинг автоматически покажет их вместо технологичных плейсхолдеров.

## Контакты

- Авито: https://www.avito.ru/moskva/predlozheniya_uslug/zakaz_pechatnyh_plat_na_jlcpcb._oplata_i_dostavka_7260492690
- Telegram: https://t.me/crptdvd
