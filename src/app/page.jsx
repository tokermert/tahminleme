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
  const [myRooms, setMyRooms] = useState([]);

  useEffect(() => {
    const saved = getPlayerName();
    if (saved) setName(saved);
    const pid = getPlayerId();
    if (pid) {
      supabase
        .from("room_members")
        .select("room_id, name, rooms(id, code, name)")
        .eq("player_id", pid)
        .then(({ data }) => {
          if (data) {
            const rooms = data.filter(d => d.rooms).map(d => ({ id: d.rooms.id, code: d.rooms.code, name: d.rooms.name }));
            setMyRooms(rooms);
          }
        });
    }
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

            {/* Odalarım */}
            {myRooms.length > 0 && (
              <div className="mt-6 pt-5 border-t border-pitch-700">
                <h2 className="text-[16px] font-black text-slate-300 mb-3">🏠 Odalarım</h2>
                <div className="space-y-2">
                  {myRooms.map(r => (
                    <button key={r.id} onClick={() => router.push(`/room/${r.code}`)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl bg-pitch-800 border border-pitch-700 cursor-pointer text-left hover:border-gold-400 transition-all">
                      <span className="text-2xl">⚽</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold text-white truncate">{r.name}</div>
                        <div className="text-[13px] text-slate-500 font-mono tracking-widest">{r.code}</div>
                      </div>
                      <span className="text-[14px] text-slate-500">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Oyun Özellikleri */}
            <div className="mt-8 pt-6 border-t border-pitch-700">
              <h2 className="text-[16px] font-black text-gold-400 mb-4">⚽ Oyun Özellikleri</h2>
              <div className="space-y-3">
                {[
                  ["🏟️", "Oda Sistemi", "Kendi tahmin odanı oluştur, arkadaşlarını 6 haneli kodla davet et. Sınırsız oda, sınırsız kişi."],
                  ["🌍", "72 Grup Maçı", "12 grubun tüm maçları bayraklarıyla hazır. Gerçek FIFA 2026 programı, Türkiye saatiyle."],
                  ["🎯", "1/X/2 Tahmin", "Her maç için ev sahibi / berabere / deplasman tahmini yap. Doğru tahmin 3 puan."],
                  ["📊", "Alt / Üst 2.5", "Her maç için toplam gol alt mı üst mü tahmin et. Doğru tahmin 1 puan."],
                  ["🏆", "Grup Sıralaması", "Her gruptan ilk 2'ye çıkacak takımları sıralı tahmin et. Doğru sıra 5 puan."],
                  ["⏰", "Zaman Kilidi", "Maç saati geldiğinde tahminler otomatik kilitlenir. Hile yok."],
                  ["⚡", "Canlı Güncelleme", "Biri tahmin girdiği an herkesin ekranında anında görünür."],
                  ["👑", "Admin Paneli", "Oda kurucusu sonuçları girer, puanlar otomatik hesaplanır."],
                  ["📈", "Detaylı İstatistik", "Grup bazlı doğru/yanlış, isabet yüzdesi, progress bar'lı sıralama."],
                  ["📤", "Kolay Paylaşım", "Tek tıkla oda kodu + link WhatsApp'a veya panoya kopyalanır."],
                ].map(([emoji, title, desc], i) => (
                  <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-pitch-800 border border-pitch-700">
                    <span className="text-xl flex-shrink-0 mt-0.5">{emoji}</span>
                    <div>
                      <div className="text-[14px] font-bold text-white">{title}</div>
                      <div className="text-[13px] text-slate-400 mt-0.5 leading-relaxed">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center text-[13px] text-slate-500">
                🎯 Maç = 3 puan &nbsp;•&nbsp; 📊 Alt/Üst = 1 puan &nbsp;•&nbsp; 🏆 Sıralama = 5 puan
              </div>
            </div>
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
