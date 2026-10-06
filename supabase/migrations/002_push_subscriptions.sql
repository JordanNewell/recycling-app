-- EcoScan Push Subscriptions Schema
-- Run this in the Supabase SQL Editor

-- ============================================
-- PUSH SUBSCRIPTIONS TABLE
-- One row per browser/device push endpoint
-- ============================================
create table public.push_subscriptions (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.push_subscriptions enable row level security;

create policy "Users can view own push subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own push subscriptions"
  on public.push_subscriptions for update
  using (auth.uid() = user_id);

create index idx_push_subscriptions_user_id on public.push_subscriptions(user_id);
