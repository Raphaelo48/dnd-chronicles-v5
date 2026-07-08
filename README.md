# 🐉 DnD Chronicles — Fullstack

Node.js + Express + PostgreSQL приложение, готовое к деплою на Railway.

## Структура проекта

```
dnd-chronicles/
├── server/
│   ├── index.js          ← Express сервер (точка входа)
│   ├── db.js             ← Подключение к PostgreSQL
│   ├── migrate.js        ← Создание таблиц при старте
│   └── routes/
│       ├── auth.js       ← /api/auth/*
│       ├── characters.js ← /api/characters/*
│       └── campaigns.js  ← /api/campaigns/*
├── public/               ← Фронтенд (статика)
│   ├── index.html
│   ├── css/
│   ├── js/
│   │   ├── api.js        ← HTTP-клиент для API
│   │   ├── auth.js
│   │   ├── campaigns.js
│   │   ├── character-creator.js
│   │   ├── character-sheet.js
│   │   ├── music-player.js
│   │   └── init.js
│   └── music/            ← Папка для треков
├── .env.example
├── railway.toml
└── package.json
```

## API эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| POST | /api/auth/logout | Выход |
| GET  | /api/auth/me | Текущий пользователь |
| GET  | /api/characters | Мои персонажи |
| POST | /api/characters | Создать персонажа |
| PATCH | /api/characters/:id | Обновить персонажа |
| DELETE | /api/characters/:id | Удалить персонажа |
| GET  | /api/campaigns | Все кампании |
| POST | /api/campaigns | Создать кампанию |
| POST | /api/campaigns/:id/join | Вступить |
| POST | /api/campaigns/:id/leave | Покинуть |
| POST | /api/campaigns/:id/kick | Исключить игрока (ДМ) |
| POST | /api/campaigns/:id/log | Добавить запись в журнал |
| DELETE | /api/campaigns/:id | Удалить кампанию (ДМ) |

---

## 🚀 Деплой на Railway (пошагово)

### Шаг 1 — Загрузи проект на GitHub

```bash
cd dnd-chronicles
git init
git add .
git commit -m "Initial commit"
# Создай репозиторий на github.com, затем:
git remote add origin https://github.com/ТВОЙ_ЮЗЕР/dnd-chronicles.git
git push -u origin main
```

### Шаг 2 — Создай проект на Railway

1. Зайди на [railway.app](https://railway.app) и залогинься
2. Нажми **New Project**
3. Выбери **Deploy from GitHub repo**
4. Выбери свой репозиторий `dnd-chronicles`
5. Railway автоматически определит Node.js и запустит `npm start`

### Шаг 3 — Добавь PostgreSQL базу данных

1. В проекте Railway нажми **+ New** (в левом меню)
2. Выбери **Database → Add PostgreSQL**
3. Railway создаст БД и **автоматически** добавит переменную `DATABASE_URL` в окружение сервиса

### Шаг 4 — Добавь переменные окружения

В Railway → твой сервис → вкладка **Variables**, добавь:

```
SESSION_SECRET = придумай-длинную-случайную-строку-например-abc123xyz789
NODE_ENV       = production
```

> `DATABASE_URL` Railway добавит сам — не нужно трогать.

### Шаг 5 — Получи публичный URL

1. В Railway → твой сервис → вкладка **Settings**
2. Раздел **Networking** → нажми **Generate Domain**
3. Получишь URL вида `dnd-chronicles.up.railway.app` 🎉

### Шаг 6 — Проверь деплой

Зайди на свой URL. При первом запуске сервер автоматически:
- Подключится к PostgreSQL
- Создаст все таблицы (users, characters, campaigns, session)
- Запустится на порту из Railway

---

## Локальная разработка

```bash
# 1. Установи зависимости
npm install

# 2. Создай .env файл
cp .env.example .env
# Заполни DATABASE_URL своей локальной БД

# 3. Запусти
npm run dev      # с авто-перезагрузкой (nodemon)
# или
npm start        # обычный запуск
```

Приложение будет доступно на http://localhost:3000

---

## Схема базы данных

```sql
-- Пользователи
users (id, name VARCHAR(10), email UNIQUE, password, is_dm, created_at)

-- Сессии (автоматически управляется express-session)
session (sid, sess, expire)

-- Персонажи (вся структура в JSONB)
characters (id, user_id → users.id, data JSONB, created_at, updated_at)

-- Кампании
campaigns (id, dm_id → users.id, name, desc, level, status,
           sessions, log JSONB, members JSONB, created_at, updated_at)
```
