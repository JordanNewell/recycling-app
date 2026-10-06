-- EcoScan Badge Unlock -> Push Webhook
-- Run this in the Supabase SQL Editor AFTER replacing <SERVICE_ROLE_KEY>
-- (Dashboard -> Settings -> API -> service_role secret) with the real key.
-- The key is embedded server-side only; it is never exposed to clients.
--
-- Fires on every new row in user_badges and calls the send-push edge
-- function, which enriches the badge name and notifies all of the user's
-- registered devices. Requires the send-push function to be deployed.
--
-- Alternative: Dashboard -> Database -> Webhooks -> hook on user_badges
-- (INSERT) pointing at the send-push function URL. This SQL does the same
-- thing without leaving the SQL editor.

create extension if not exists pg_net;

create or replace function public.notify_badge_unlocked()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'https://cwruvcrjlnafgksssxpi.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'user_badges',
      'record', jsonb_build_object('user_id', NEW.user_id, 'badge_id', NEW.badge_id)
    )
  );
  return NEW;
end;
$$;

drop trigger if exists badge_push_trigger on public.user_badges;

create trigger badge_push_trigger
  after insert on public.user_badges
  for each row
  execute function public.notify_badge_unlocked();
