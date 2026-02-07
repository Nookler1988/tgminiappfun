-- Replace <USER_UUID> with a real user id from public.users
insert into public.user_roles (user_id, role)
values ('<USER_UUID>', 'admin');
