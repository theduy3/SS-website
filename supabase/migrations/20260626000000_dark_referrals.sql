-- Dark referrals: each row captures one AI-referred page request.
-- No IP, no cookie, no PII — only host + path + timestamp.
-- Logging sits outside the Law 25 consent gate (aggregate analytics, GEO-02).

create table if not exists public.dark_referrals (
  id            bigint generated always as identity primary key,
  ai_source     text        not null,  -- normalized label: chatgpt, perplexity, …
  referrer_host text        not null,  -- raw matched host from Referer header
  path          text        not null,  -- pathname only, no query string (D-07)
  utm_source    text,                  -- nullable: utm_source= value if present
  created_at    timestamptz not null default now()
);

alter table public.dark_referrals enable row level security;
-- RLS enabled (deny-by-default). No anon read or write policies.
-- All writes use service-role (getSupabaseAdmin()), which bypasses RLS.
-- getDarkReferrerCounts() also uses service-role for the aggregate read.
-- No GRANT to anon — unlike popups, there is no public read path here.
-- (Avoids the self-hosted anon-GRANT gotcha documented in project memory:
--  supabase-anon-grant-gotcha.md — irrelevant for service-role-only tables.)

create index on public.dark_referrals (created_at desc);
create index on public.dark_referrals (ai_source);
