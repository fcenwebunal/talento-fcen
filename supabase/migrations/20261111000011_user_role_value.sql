-- «Usuario»: every new account starts here until the Facultad or an administrator gives it a role (2026-11-11).
-- Alone in its migration: Postgres cannot use a new enum value inside the transaction that adds it.
alter type public.user_role add value if not exists 'user' before 'student';
