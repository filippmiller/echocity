# Railway Deployment Setup Guide

## Проблема: Environment variable not found: DATABASE_URL

Railway не может найти переменную окружения `DATABASE_URL`, которая необходима для Prisma.

## Решение: Настройка переменных окружения в Railway

### Шаг 1: Откройте Railway Dashboard

1. Перейдите на https://railway.app
2. Войдите в свой аккаунт
3. Выберите проект `echocity`

### Шаг 2: Добавьте переменные окружения

В настройках проекта (Settings → Variables) добавьте следующие переменные:

#### Обязательные переменные:

```env
DATABASE_URL=postgresql://postgres.renayyeveulagnhgocsd:Airbus3803802024@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://renayyeveulagnhgocsd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlbmF5eWV2ZXVsYWduaGdvY3NkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEyODY5NywiZXhwIjoyMDc4NzA0Njk3fQ.dCCA97LPdz8M2FvrhG_oZJ8n9Q1_yRFhJR-R2oqI9LQ
SUPABASE_USER_PHOTOS_BUCKET=user-photos
```

#### Опциональные переменные (для Yandex интеграции):

```env
YANDEX_CLIENT_ID=your-client-id
YANDEX_CLIENT_SECRET=your-client-secret
YANDEX_OAUTH_REDIRECT_URI=https://your-domain.railway.app/api/auth/yandex/callback
YANDEX_MAPS_API_KEY=your-maps-api-key
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=your-maps-api-key
```

### Шаг 3: Проверьте источник переменных

**Важно:** Убедитесь, что переменные окружения установлены на уровне **Service**, а не только на уровне проекта.

1. В Railway Dashboard выберите ваш сервис (service)
2. Перейдите в **Variables** tab
3. Добавьте все необходимые переменные

### Шаг 4: Перезапустите деплой

После добавления переменных окружения:
1. Railway автоматически перезапустит деплой
2. Или нажмите **Redeploy** вручную

## Альтернативное решение: Использование Railway PostgreSQL

Если вы хотите использовать встроенную базу данных Railway:

1. Добавьте PostgreSQL плагин в Railway
2. Railway автоматически создаст переменную `DATABASE_URL`
3. Обновите `DATABASE_URL` в переменных окружения

## Проверка

После настройки переменных окружения, проверьте логи Railway:

```bash
# В Railway Dashboard → Deployments → View Logs
# Должны увидеть:
# ✔ Generated Prisma Client
# ✔ Applied migrations
# ✓ Starting Next.js server
```

## Troubleshooting

### Проблема: Переменные не применяются

**Решение:**
- Убедитесь, что переменные добавлены на уровне Service, а не Project
- Проверьте, что нет опечаток в именах переменных
- Перезапустите деплой после добавления переменных

### Проблема: DATABASE_URL все еще не найдена

**Решение:**
- Проверьте, что переменная добавлена в правильном формате (без кавычек)
- Убедитесь, что используется правильный формат PostgreSQL connection string
- Проверьте логи Railway для деталей ошибки

## Источник переменных

Все значения переменных находятся в файле `supabase_keys.txt` в корне проекта (для разработки).

**⚠️ ВАЖНО:** В продакшене используйте отдельные credentials для безопасности!

