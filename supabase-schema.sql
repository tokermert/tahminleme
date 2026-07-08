-- ==========================================
-- WC2026 Tahmin Yarışması - Supabase Schema
-- Supabase Dashboard > SQL Editor > yapıştır > Run
-- ==========================================

-- Oyuncular (auth yok, localStorage UUID ile)
create table players (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Odalar
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  admin_id text references players(id),
  created_at timestamptz default now()
);

-- Oda üyeleri
create table room_members (
  room_id uuid references rooms(id) on delete cascade,
  player_id text references players(id),
  name text not null default '',
  joined_at timestamptz default now(),
  primary key (room_id, player_id)
);

-- Maç tahminleri
create table predictions (
  room_id uuid references rooms(id) on delete cascade,
  player_id text references players(id),
  match_key text not null,
  prediction text not null check (prediction in ('1','X','2')),
  updated_at timestamptz default now(),
  primary key (room_id, player_id, match_key)
);

-- Grup sıralaması tahminleri
create table qualify_predictions (
  room_id uuid references rooms(id) on delete cascade,
  player_id text references players(id),
  group_letter text not null,
  first_team text not null,
  second_team text not null,
  updated_at timestamptz default now(),
  primary key (room_id, player_id, group_letter)
);

-- Maç sonuçları (global, tüm odalar ortak)
create table match_results (
  match_key text primary key,
  result text not null check (result in ('1','X','2')),
  updated_at timestamptz default now()
);

-- Grup sonuçları (global)
create table qualify_results (
  group_letter text primary key,
  first_team text not null,
  second_team text not null,
  updated_at timestamptz default now()
);

-- RLS kapat (arkadaş grubu oyunu, güvenlik kritik değil)
alter table players enable row level security;
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table predictions enable row level security;
alter table qualify_predictions enable row level security;
alter table match_results enable row level security;
alter table qualify_results enable row level security;

-- Herkese okuma/yazma izni (anon key ile)
create policy "public_all" on players for all using (true) with check (true);
create policy "public_all" on rooms for all using (true) with check (true);
create policy "public_all" on room_members for all using (true) with check (true);
create policy "public_all" on predictions for all using (true) with check (true);
create policy "public_all" on qualify_predictions for all using (true) with check (true);
create policy "public_all" on match_results for all using (true) with check (true);
create policy "public_all" on qualify_results for all using (true) with check (true);

-- Realtime aç (canlı güncelleme için)
alter publication supabase_realtime add table predictions;
alter publication supabase_realtime add table qualify_predictions;
alter publication supabase_realtime add table match_results;
alter publication supabase_realtime add table qualify_results;
alter publication supabase_realtime add table room_members;

-- Upsert için unique index
create unique index predictions_upsert on predictions (room_id, player_id, match_key);
create unique index qualify_upsert on qualify_predictions (room_id, player_id, group_letter);
