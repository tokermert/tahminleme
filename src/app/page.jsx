"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, getPlayerId, getPlayerName, setPlayerName } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState(null); // null | "create" | "join"
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = getPlayerName();
    if (saved) setName(saved);
  }, []);

  function genCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async function ensurePlayer() {
    const id = getPlayerId();
    setPlayerName(name);
    await supabase.from("players").upsert({ id, name }, { onConflict: "id" });
    return id;
  }

  async function handleCreate() {
    if (!name.trim() || !roomName.trim()) { setError("İsim ve oda adı gerekli"); return; }
    setLoading(true);
    setError("");
    try {
      const playerId = await ensurePlayer();
      const roomCode = genCode();
      const { data: room, error: e1 } = await supabase
        .from("rooms")
        .insert({ code: roomCode, name: roomName.trim(), admin_id: playerId })
        .select()
        .single();
      if (e1) throw e1;
      await supabase.from("room_members").insert({ room_id: room.id, player_id: playerId, name: name.trim() });
      router.push(`/room/${roomCode}`);
    } catch (e) {
      setError("Hata: " + e.message);
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!name.trim() || !code.trim()) { setError("İsim ve oda kodu gerekli"); return; }
    setLoading(true);
    setError("");
    try {
      const playerId = await ensurePlayer();
      const { data: room, error: e1 } = await supabase
        .from("rooms")
        .select()
        .eq("code", code.trim().toUpperCase())
        .single();
      if (e1 || !room) { setError("Oda bulunamadı"); setLoading(false); return; }
      await supabase.from("room_members").upsert(
        { room_id: room.id, player_id: playerId, name: name.trim() },
        { onConflict: "room_id,player_id" }
      );
      router.push(`/room/${room.code}`);
    } catch (e) {
      setError("Hata: " + e.message);
      setLoading(false);
    }
  }

  const btn = "w-full py-3 px-4 rounded-xl font-bold text-[15px] transition-all cursor-pointer disabled:opacity-50";
  const input = "w-full py-3 px-4 rounded-xl bg-pitch-700 border border-pitch-600 text-white text-[15px] font-medium placeholder:text-slate-500 outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="text-center pt-16 pb-8 px-6">
        <div className="text-6xl mb-4">⚽</div>
        <p className="text-[13px] font-black tracking-[4px] text-gold-400 uppercase">FIFA World Cup</p>
        <h1 className="text-3xl font-black mt-1" style={{ background:"linear-gradient(135deg,#fff 30%,#c9a84c)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          Tahmin Yarışması
        </h1>
        <p className="text-[14px] text-slate-500 mt-2 tracking-widest">🇺🇸 🇨🇦 🇲🇽 &nbsp; 2026</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-10">
        {!mode && (
          <div className="space-y-4 mt-4">
            <button onClick={() => setMode("create")} className={`${btn} bg-gradient-to-r from-gold-400 to-gold-500 text-pitch-900`}>
              🏟️ Yeni Oda Oluştur
            </button>
            <button onClick={() => setMode("join")} className={`${btn} bg-pitch-700 text-slate-300 border border-pitch-600`}>
              🎟️ Odaya Katıl
            </button>
          </div>
        )}

        {mode && (
          <div className="space-y-4 mt-2">
            <button onClick={() => { setMode(null); setError(""); }} className="text-[14px] text-slate-500 mb-2 cursor-pointer">
              ← Geri
            </button>

            <div>
              <label className="text-[14px] font-bold text-slate-400 mb-2 block">Senin İsmin</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Mert"
                className={input}
                maxLength={20}
              />
            </div>

            {mode === "create" && (
              <div>
                <label className="text-[14px] font-bold text-slate-400 mb-2 block">Oda Adı</label>
                <input
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="Ofis Ligi 2026"
                  className={input}
                  maxLength={30}
                />
              </div>
            )}

            {mode === "join" && (
              <div>
                <label className="text-[14px] font-bold text-slate-400 mb-2 block">Oda Kodu</label>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className={`${input} tracking-[4px] text-center text-lg`}
                  maxLength={6}
                />
              </div>
            )}

            {error && <p className="text-red-400 text-[14px] font-medium">{error}</p>}

            <button
              onClick={mode === "create" ? handleCreate : handleJoin}
              disabled={loading}
              className={`${btn} bg-gradient-to-r from-gold-400 to-gold-500 text-pitch-900 mt-2`}
            >
              {loading ? "Yükleniyor..." : mode === "create" ? "Odayı Oluştur 🚀" : "Katıl 🎯"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
