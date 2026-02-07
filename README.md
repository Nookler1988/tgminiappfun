# Telegram Networking Mini App

## Что внутри
- React + Vite + TypeScript фронтенд
- Supabase Postgres схемы и RLS политики
- Edge Functions: `auth-telegram`, `match-run`, `match-consent`, `notifications-send`

## Быстрый старт
1. Создайте проект в Supabase.
2. Примените миграцию из `supabase/migrations/0001_init.sql`.
3. Примените `supabase/migrations/0002_rls_updates.sql`.
3. Создайте функцию роли админа (например, вставкой в `user_roles`).
4. Добавьте секреты Edge Functions:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TG_BOT_TOKEN`
5. Настройте крон на `match-run` каждую неделю в понедельник 10:00 локального времени.
6. Настройте крон на `notifications-send` (например, каждые 15 минут).
7. Заполните `.env` на основе `.env.example` и запустите `npm install` → `npm run dev`.

## Supabase CLI (опционально)
Если используете Supabase CLI, проект уже привязан в `supabase/config.toml`.
Команды:
- `npm run supabase:db:push`
- `npm run supabase:functions:deploy`

## Seed админа
Скрипт: `supabase/seed_admin.sql`
Подставьте реальный `user_id` из таблицы `public.users`.

## Telegram Bot
- Установите Mini App URL в настройках бота.
- Убедитесь, что Telegram Web App открывает страницу внутри Telegram.

## Роли
Сделайте первого пользователя админом:
```
insert into public.user_roles (user_id, role)
values ('<USER_UUID>', 'admin');
```
