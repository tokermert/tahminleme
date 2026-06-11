-- ==========================================
-- WC2026 - Alt/Üst güncellemesi
-- Supabase SQL Editor'a yapıştır → Run
-- ==========================================
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS ou text CHECK (ou IN ('alt', 'ust'));
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS ou text CHECK (ou IN ('alt', 'ust'));
