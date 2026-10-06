-- EcoScan: allow users to insert their own profile row
-- Run this in the Supabase SQL Editor (or via Management API).
--
-- AuthContext falls back to inserting a profile row when the
-- on_auth_user_created trigger did not fire. That fallback was blocked by
-- RLS because profiles had no INSERT policy. This policy permits inserting
-- only the caller's own row; the signup trigger (security definer) is
-- unaffected.

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
