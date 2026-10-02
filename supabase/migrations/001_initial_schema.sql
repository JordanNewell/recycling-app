-- EcoScan Initial Schema
-- Run this in the Supabase SQL Editor

-- ============================================
-- PROFILES TABLE
-- Auto-created via trigger when a user signs up
-- ============================================
create table public.profiles (
  id uuid not null references auth.users on delete cascade primary key,
  email text,
  name text,
  points integer default 0,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_scan_date date,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- RECYCLING ENTRIES TABLE
-- ============================================
create table public.recycling_entries (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  item text not null,
  material text not null,
  points integer not null default 10,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  address text,
  location_name text,
  created_at timestamptz default now() not null
);

alter table public.recycling_entries enable row level security;

create policy "Users can view own entries"
  on public.recycling_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.recycling_entries for insert
  with check (auth.uid() = user_id);

create index idx_recycling_entries_user_id on public.recycling_entries(user_id);
create index idx_recycling_entries_created_at on public.recycling_entries(created_at desc);

-- ============================================
-- BADGES TABLE
-- ============================================
create table public.badges (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  image_url text,
  criteria text not null unique
);

alter table public.badges enable row level security;

create policy "Badges are publicly readable"
  on public.badges for select
  using (true);

-- Seed badge data
insert into public.badges (name, description, image_url, criteria) values
  ('First Scan', 'Scan your first recyclable item', null, 'scan_1_item'),
  ('10 Items', 'Scan 10 recyclable items', null, 'scan_10_items'),
  ('50 Items', 'Scan 50 recyclable items', null, 'scan_50_items'),
  ('Week Warrior', 'Maintain a 7-day streak', null, 'streak_7_days'),
  ('100 Points', 'Earn 100 points', null, 'earn_100_points'),
  ('1000 Points', 'Earn 1000 points', null, 'earn_1000_points');

-- ============================================
-- USER BADGES TABLE
-- ============================================
create table public.user_badges (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  created_at timestamptz default now() not null,
  unique(user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "Users can view own badges"
  on public.user_badges for select
  using (auth.uid() = user_id);

create policy "Users can insert own badges"
  on public.user_badges for insert
  with check (auth.uid() = user_id);
