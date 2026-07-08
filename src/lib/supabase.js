import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
);

export function getPlayerId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem("wc2026_player_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("wc2026_player_id", id);
  }
  return id;
}

export function getPlayerName() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("wc2026_player_name");
}

export function setPlayerName(name) {
  localStorage.setItem("wc2026_player_name", name);
}
