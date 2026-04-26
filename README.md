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

В `index.html` замени:

```html
action="https://formspree.io/f/mdayjyja"
```

на свой endpoint Formspree.

Поля формы готовы: имя, email, телефон/Telegram, комментарий и файлы. После подключения реального endpoint появится AJAX-отправка и сообщение об успехе/ошибке.

## Фото работ

Загрузи реальные фото в `assets/works/` с именами `work-1.jpg` ... `work-6.jpg`. Лендинг автоматически покажет их вместо технологичных плейсхолдеров.

## Контакты

- Авито: https://www.avito.ru/moskva/predlozheniya_uslug/zakaz_pechatnyh_plat_na_jlcpcb._oplata_i_dostavka_7260492690
- Telegram: https://t.me/crptdvd
