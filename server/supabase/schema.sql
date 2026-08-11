-- ============================================================
-- Gig Insured — Supabase PostgreSQL Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- 1. WORKERS
-- ─────────────────────────────────────────────
create table if not exists workers (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null default '',
  mobile                 text not null unique,
  city                   text not null default '',
  zone                   text not null default '',
  platform               text not null default 'Zomato' check (platform in ('Zomato', 'Swiggy')),
  worker_id              text not null unique,
  avg_weekly_income      numeric default 0 check (avg_weekly_income >= 0),
  kyc_status             text default 'pending' check (kyc_status in ('pending', 'verified', 'rejected')),
  zone_risk_score        numeric default 50 check (zone_risk_score >= 0 and zone_risk_score <= 100),
  weather_exposure_score numeric default 50 check (weather_exposure_score >= 0 and weather_exposure_score <= 100),
  upi_id                 text not null default '',
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

create index if not exists idx_workers_mobile on workers(mobile);
create index if not exists idx_workers_city   on workers(city);
create index if not exists idx_workers_zone   on workers(zone);

-- ─────────────────────────────────────────────
-- 2. POLICIES
-- ─────────────────────────────────────────────
create table if not exists policies (
  id                    uuid primary key default gen_random_uuid(),
  worker_id             uuid not null references workers(id) on delete cascade,
  tier                  text not null default 'Standard' check (tier in ('Basic', 'Standard', 'Premium')),
  weekly_premium        numeric not null check (weekly_premium >= 0),
  weekly_benefit_cap    numeric not null check (weekly_benefit_cap >= 0),
  coverage_period_start timestamptz default now(),
  coverage_period_end   timestamptz not null,
  status                text default 'Active' check (status in ('Active', 'Disruption Detected', 'Payout Initiated', 'Expired', 'Cancelled')),
  auto_renew            boolean default true,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index if not exists idx_policies_worker_status on policies(worker_id, status);
create index if not exists idx_policies_status        on policies(status);

-- ─────────────────────────────────────────────
-- 3. TRIGGER EVENTS
-- ─────────────────────────────────────────────
create table if not exists trigger_events (
  id                       uuid primary key default gen_random_uuid(),
  zone                     text not null,
  disruption_type          text not null check (disruption_type in ('rain', 'heat', 'flood', 'AQI', 'curfew', 'strike')),
  data_snapshot            jsonb not null default '{}',
  confirmed_at             timestamptz,
  observation_window_start timestamptz default now(),
  signals_used             text[] default '{}',
  status                   text default 'pending' check (status in ('pending', 'confirmed', 'false-positive')),
  timestamp                timestamptz default now() not null,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

create index if not exists idx_trigger_zone_type_status on trigger_events(zone, disruption_type, status);
create index if not exists idx_trigger_timestamp        on trigger_events(timestamp desc);

-- ─────────────────────────────────────────────
-- 4. CLAIMS
-- ─────────────────────────────────────────────
create table if not exists claims (
  id               uuid primary key default gen_random_uuid(),
  worker_id        uuid not null references workers(id) on delete cascade,
  policy_id        uuid not null references policies(id),
  trigger_event_id uuid not null references trigger_events(id),
  hours_lost       numeric not null check (hours_lost >= 0 and hours_lost <= 24),
  payout_amount    numeric not null check (payout_amount >= 0),
  fraud_risk_score numeric default 0 check (fraud_risk_score >= 0 and fraud_risk_score <= 100),
  claim_state      text default 'Detected' check (claim_state in ('Detected', 'Scoring', 'Auto-Approved', 'Under-Review', 'Blocked', 'Paid', 'Appealed', 'Payout-Failed')),
  reason           text,
  transaction_ref  text,
  otp_verification_required boolean default false,
  resolved_at      timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_claims_worker_state  on claims(worker_id, claim_state);
create index if not exists idx_claims_state         on claims(claim_state);
create index if not exists idx_claims_trigger       on claims(trigger_event_id);
create index if not exists idx_claims_created_at    on claims(created_at desc);

-- ─────────────────────────────────────────────
-- 5. FRAUD FLAGS
-- ─────────────────────────────────────────────
create table if not exists fraud_flags (
  id          uuid primary key default gen_random_uuid(),
  claim_id    uuid not null references claims(id) on delete cascade,
  signal_type text not null check (signal_type in ('gps-spoofing', 'fake-weather', 'coordinated-ring', 'duplicate')),
  details     jsonb not null default '{}',
  severity    text default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists idx_fraud_flags_claim    on fraud_flags(claim_id);
create index if not exists idx_fraud_flags_severity on fraud_flags(severity);

-- ─────────────────────────────────────────────
-- 6. ZONE CONFIGS
-- ─────────────────────────────────────────────
create table if not exists zone_configs (
  id                 uuid primary key default gen_random_uuid(),
  zone_name          text not null unique,
  city               text not null,
  geo_boundary       jsonb default '{"type":"Polygon","coordinates":[]}',
  trigger_thresholds jsonb default '{"rainMmPerHour":35,"heatTempCelsius":42,"aqiThreshold":350,"floodWaterLevelCm":15}',
  premium_band       jsonb default '{"Basic":25,"Standard":45,"Premium":75}',
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create index if not exists idx_zone_configs_city on zone_configs(city);

-- ─────────────────────────────────────────────
-- Automatic updated_at trigger function
-- ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_workers_updated_at       before update on workers       for each row execute function set_updated_at();
create or replace trigger trg_policies_updated_at      before update on policies      for each row execute function set_updated_at();
create or replace trigger trg_trigger_events_updated_at before update on trigger_events for each row execute function set_updated_at();
create or replace trigger trg_claims_updated_at        before update on claims        for each row execute function set_updated_at();
create or replace trigger trg_fraud_flags_updated_at   before update on fraud_flags   for each row execute function set_updated_at();
create or replace trigger trg_zone_configs_updated_at  before update on zone_configs  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────
-- Seed: Default Zone Configs (Bengaluru)
-- ─────────────────────────────────────────────
insert into zone_configs (zone_name, city, trigger_thresholds, premium_band) values
  ('Indiranagar',    'Bengaluru', '{"rainMmPerHour":20,"heatTempCelsius":40,"aqiThreshold":300,"floodWaterLevelCm":12}', '{"Basic":25,"Standard":45,"Premium":75}'),
  ('Koramangala',    'Bengaluru', '{"rainMmPerHour":25,"heatTempCelsius":40,"aqiThreshold":300,"floodWaterLevelCm":10}', '{"Basic":30,"Standard":50,"Premium":85}'),
  ('Whitefield',     'Bengaluru', '{"rainMmPerHour":30,"heatTempCelsius":42,"aqiThreshold":350,"floodWaterLevelCm":15}', '{"Basic":35,"Standard":55,"Premium":90}'),
  ('HSR Layout',     'Bengaluru', '{"rainMmPerHour":20,"heatTempCelsius":40,"aqiThreshold":280,"floodWaterLevelCm":10}', '{"Basic":28,"Standard":48,"Premium":80}'),
  ('Electronic City','Bengaluru', '{"rainMmPerHour":30,"heatTempCelsius":42,"aqiThreshold":350,"floodWaterLevelCm":15}', '{"Basic":30,"Standard":50,"Premium":85}')
on conflict (zone_name) do nothing;
