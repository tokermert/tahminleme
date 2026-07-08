-- ==========================================
-- WC2026 - Alt/Üst güncellemesi
-- Supabase SQL Editor'a yapıştır → Run
-- ==========================================
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS ou text CHECK (ou IN ('alt', 'ust'));
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS ou text CHECK (ou IN ('alt', 'ust'));

-- Kupa tahmini tabloları
CREATE TABLE IF NOT EXISTS cup_predictions (
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  player_id text REFERENCES players(id),
  winner text,
  finalist1 text,
  finalist2 text,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (room_id, player_id)
);

CREATE TABLE IF NOT EXISTS cup_results (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  winner text,
  finalist1 text,
  finalist2 text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cup_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cup_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON cup_predictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON cup_results FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE cup_predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE cup_results;

-- Son 32 Turu tahminleri
CREATE TABLE IF NOT EXISTS knockout_predictions (
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  player_id text REFERENCES players(id),
  match_id text NOT NULL,
  winner text,
  method text CHECK (method IN ('90', 'extra', 'penalty')),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (room_id, player_id, match_id)
);

CREATE TABLE IF NOT EXISTS knockout_results (
  match_id text PRIMARY KEY,
  winner text NOT NULL,
  method text NOT NULL CHECK (method IN ('90', 'extra', 'penalty')),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knockout_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knockout_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON knockout_predictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON knockout_results FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE knockout_predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE knockout_results;
