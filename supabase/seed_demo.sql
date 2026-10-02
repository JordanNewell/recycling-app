-- ============================================================
-- EcoScan DEMO SEED — populates the signed-up demo account
-- with points, a 9-day streak, two weeks of scan history,
-- and earned badges so the app looks alive in a pitch.
--
-- HOW TO USE
--   1. Run 001_initial_schema.sql first (fresh project).
--   2. Sign up in the app with the demo email (e.g. demo@ecoscan.app).
--   3. Replace 'demo@ecoscan.app' below with that email.
--   4. Paste this whole file into the Supabase SQL Editor and run.
--      (Safe to re-run: it deletes this user's demo rows first.)
-- ============================================================

do $$
declare
  demo_user uuid;
begin
  select id into demo_user from auth.users where email = 'demo@ecoscan.app';

  if demo_user is null then
    raise exception 'No auth user found for demo@ecoscan.app — sign up in the app first, then re-run.';
  end if;

  -- Clean any previous seed for this user
  delete from user_badges where user_id = demo_user;
  delete from recycling_entries where user_id = demo_user;

  -- Profile: 240 points, 9-day streak
  update profiles
  set points = 240,
      current_streak = 9,
      longest_streak = 12,
      last_scan_date = current_date
  where id = demo_user;

  -- Two weeks of scan history (points match the app's per-item values)
  insert into recycling_entries (user_id, item, material, points, address, location_name, created_at) values
    (demo_user, 'Water Bottle',        'PET Plastic (#1)', 10, '2401 Main St', 'Home',       now() - interval '13 days'),
    (demo_user, 'Cereal Box',          'Cardboard',        10, '88 Market St', 'Grocery',    now() - interval '12 days'),
    (demo_user, 'Soda Can',            'Aluminum',         15, '2401 Main St', 'Home',       now() - interval '11 days'),
    (demo_user, 'Pasta Sauce Jar',     'Glass',            10, '88 Market St', 'Grocery',    now() - interval '10 days'),
    (demo_user, 'Newspaper',           'Paper',             5, 'Downtown',     'Office',     now() - interval '9 days'),
    (demo_user, 'Detergent Bottle',    'PET Plastic (#1)', 10, '2401 Main St', 'Home',       now() - interval '8 days'),
    (demo_user, 'Beer Bottle',         'Glass',            10, 'Oak & 3rd',    'Park',       now() - interval '7 days'),
    (demo_user, 'Shipping Box',        'Cardboard',        10, '2401 Main St', 'Home',       now() - interval '6 days'),
    (demo_user, 'Aluminum Foil Ball',  'Aluminum',         15, '88 Market St', 'Grocery',    now() - interval '5 days'),
    (demo_user, 'Mail Envelope',       'Paper',             5, 'Downtown',     'Office',     now() - interval '4 days'),
    (demo_user, 'Gatorade Bottle',     'PET Plastic (#1)', 10, 'Elm School',   'Gym',        now() - interval '3 days'),
    (demo_user, 'Tuna Can',            'Aluminum',         15, '2401 Main St', 'Home',       now() - interval '2 days'),
    (demo_user, 'Wine Bottle',         'Glass',            10, '88 Market St', 'Grocery',    now() - interval '1 day'),
    (demo_user, 'Amazon Box',          'Cardboard',        10, '2401 Main St', 'Home',       now() - interval '6 hours'),
    (demo_user, 'Coffee Cup Sleeve',   'Paper',             5, 'Bean Cafe',    'Coffee shop', now());

  -- Badges this account has earned
  insert into user_badges (user_id, badge_id)
  select demo_user, b.id from badges b
  where b.criteria in ('scan_1_item', 'scan_10_items', 'streak_7_days', 'earn_100_points')
  on conflict do nothing;
end $$;
