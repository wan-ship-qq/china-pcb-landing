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
action="https://formspree.io/f/YOUR_FORM_ID"
```

на свой endpoint Formspree.

Поля формы уже готовы для отправки файла и данных клиента.
