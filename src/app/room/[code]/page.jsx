"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, getPlayerId, getPlayerName, setPlayerName } from "@/lib/supabase";
import { GROUPS, FLAGS, shortName, getMatches, matchKey, GROUP_KEYS, SCHEDULE, formatTR, isLocked, getSortedMatches, calculateScores, ALL_TEAMS, KNOCKOUT_R32, KNOCKOUT_R16, KNOCKOUT_QF, GOAL_TIME_SLOTS } from "@/lib/matches";

function JoinPrompt({ room, code, playerId }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const input = "w-full py-3 px-4 rounded-xl bg-pitch-700 border border-pitch-600 text-white text-[15px] font-medium placeholder:text-slate-500 outline-none focus:border-gold-400";

  async function handleJoin() {
    if (!name.trim()) return;
    setLoading(true);
    setPlayerName(name.trim());
    await supabase.from("players").upsert({ id: playerId, name: name.trim() }, { onConflict: "id" });
    await supabase.from("room_members").upsert({ room_id: room.id, player_id: playerId, name: name.trim() }, { onConflict: "room_id,player_id" });
    window.location.reload();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-5xl mb-4">⚽</div>
      <p className="text-[13px] font-black tracking-[3px] text-gold-400 uppercase">WC 2026 Tahmin</p>
      <h2 className="text-xl font-black text-white mt-2 mb-1">{room.name}</h2>
      <p className="text-[14px] text-slate-500 mb-6">Odaya katılmak için ismini gir</p>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="İsmin" className={`${input} mb-4`} maxLength={20} />
      <button onClick={handleJoin} disabled={loading || !name.trim()}
        className="w-full py-3 rounded-xl font-bold text-[15px] bg-gradient-to-r from-gold-400 to-gold-500 text-pitch-900 disabled:opacity-50 cursor-pointer">
        {loading ? "Katılıyorsun..." : "Odaya Katıl 🎯"}
      </button>
    </div>
  );
}

const COLORS = [
  { bg:"#3b82f6", ring:"#60a5fa", dark:"#1e3a5f" },
  { bg:"#f59e0b", ring:"#fbbf24", dark:"#5c3d0e" },
  { bg:"#10b981", ring:"#34d399", dark:"#0f3d2e" },
  { bg:"#ec4899", ring:"#f472b6", dark:"#5c1a3e" },
  { bg:"#8b5cf6", ring:"#a78bfa", dark:"#3b1f6e" },
  { bg:"#06b6d4", ring:"#22d3ee", dark:"#0e4a5c" },
  { bg:"#ef4444", ring:"#f87171", dark:"#5c1a1a" },
  { bg:"#84cc16", ring:"#a3e635", dark:"#2e5c0e" },
];

export default function RoomPage({ params }) {
  const { code } = params;
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [qualifyPreds, setQualifyPreds] = useState({});
  const [matchResults, setMatchResults] = useState({});
  const [qualifyResults, setQualifyResults] = useState({});
  const [cupPreds, setCupPreds] = useState({});
  const [cupResult, setCupResult] = useState(null);
  const [koPreds, setKoPreds] = useState({});
  const [koResults, setKoResults] = useState({});
  const [view, setView] = useState("matches");
  const [koRound, setKoRound] = useState("R32");
  const [activeGroup, setActiveGroup] = useState("A");
  const [loading, setLoading] = useState(true);
  const [shareMsg, setShareMsg] = useState("");

  const playerId = typeof window !== "undefined" ? getPlayerId() : null;
  const playerName = typeof window !== "undefined" ? getPlayerName() : null;
  const isAdmin = room?.admin_id === playerId;

  // Renk atama (üyelik sırasına göre)
  function pc(pid) {
    const idx = members.findIndex(m => m.player_id === pid);
    return COLORS[idx % COLORS.length] || COLORS[0];
  }

  // ── Veri yükleme ──
  const loadAll = useCallback(async (roomId) => {
    const [predRes, qpRes, mrRes, qrRes, cpRes, crRes] = await Promise.all([
      supabase.from("predictions").select("*").eq("room_id", roomId),
      supabase.from("qualify_predictions").select("*").eq("room_id", roomId),
      supabase.from("match_results").select("*"),
      supabase.from("qualify_results").select("*"),
      supabase.from("cup_predictions").select("*").eq("room_id", roomId),
      supabase.from("cup_results").select("*").eq("id", 1).single(),
    ]);

    const pMap = {};
    (predRes.data || []).forEach(r => {
      pMap[`${r.player_id}:${r.match_key}`] = r.prediction;
      if (r.ou) pMap[`ou:${r.player_id}:${r.match_key}`] = r.ou;
    });
    setPredictions(pMap);

    const qMap = {};
    (qpRes.data || []).forEach(r => { qMap[`${r.player_id}:${r.group_letter}`] = r; });
    setQualifyPreds(qMap);

    const mMap = {};
    (mrRes.data || []).forEach(r => { mMap[r.match_key] = { result: r.result, ou: r.ou }; });
    setMatchResults(mMap);

    const qrMap = {};
    (qrRes.data || []).forEach(r => { qrMap[r.group_letter] = r; });
    setQualifyResults(qrMap);

    const cpMap = {};
    (cpRes.data || []).forEach(r => { cpMap[r.player_id] = r; });
    setCupPreds(cpMap);

    setCupResult(crRes.data || null);

    // Knockout
    const [koP, koR] = await Promise.all([
      supabase.from("knockout_predictions").select("*").eq("room_id", roomId),
      supabase.from("knockout_results").select("*"),
    ]);
    const kpMap = {};
    (koP.data || []).forEach(r => { kpMap[`${r.player_id}:${r.match_id}`] = r; });
    setKoPreds(kpMap);
    const krMap = {};
    (koR.data || []).forEach(r => { krMap[r.match_id] = r; });
    setKoResults(krMap);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: rm } = await supabase.from("rooms").select("*").eq("code", code).single();
      if (!rm) { router.push("/"); return; }
      setRoom(rm);

      const { data: mb } = await supabase.from("room_members").select("*").eq("room_id", rm.id).order("joined_at");
      setMembers(mb || []);

      await loadAll(rm.id);
      setLoading(false);

      // Realtime
      const channel = supabase.channel(`room-${rm.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "predictions", filter: `room_id=eq.${rm.id}` }, (p) => {
          setPredictions(prev => {
            const next = { ...prev, [`${p.new.player_id}:${p.new.match_key}`]: p.new.prediction };
            if (p.new.ou) next[`ou:${p.new.player_id}:${p.new.match_key}`] = p.new.ou;
            return next;
          });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "qualify_predictions", filter: `room_id=eq.${rm.id}` }, (p) => {
          setQualifyPreds(prev => ({ ...prev, [`${p.new.player_id}:${p.new.group_letter}`]: p.new }));
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "match_results" }, (p) => {
          setMatchResults(prev => ({ ...prev, [p.new.match_key]: { result: p.new.result, ou: p.new.ou } }));
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "qualify_results" }, (p) => {
          setQualifyResults(prev => ({ ...prev, [p.new.group_letter]: p.new }));
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${rm.id}` }, () => {
          supabase.from("room_members").select("*").eq("room_id", rm.id).order("joined_at").then(r => setMembers(r.data || []));
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "cup_predictions", filter: `room_id=eq.${rm.id}` }, (p) => {
          setCupPreds(prev => ({ ...prev, [p.new.player_id]: p.new }));
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "cup_results" }, (p) => {
          setCupResult(p.new);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "knockout_predictions", filter: `room_id=eq.${rm.id}` }, (p) => {
          setKoPreds(prev => ({ ...prev, [`${p.new.player_id}:${p.new.match_id}`]: p.new }));
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "knockout_results" }, (p) => {
          setKoResults(prev => ({ ...prev, [p.new.match_id]: p.new }));
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
    init();
  }, [code, router, loadAll]);

  // ── Aksiyonlar ──
  async function savePrediction(mk, value) {
    if (!room) return;
    const mr = matchResults[mk];
    if (mr?.result) return; // Sonuç girildiyse tahmin değiştirilemez
    if (isLocked(SCHEDULE[mk])) return; // Maç saati geçtiyse kilitli
    await supabase.from("predictions").upsert(
      { room_id: room.id, player_id: playerId, match_key: mk, prediction: value, updated_at: new Date().toISOString() },
      { onConflict: "room_id,player_id,match_key" }
    );
  }

  async function saveOU(mk, value) {
    if (!room) return;
    const mr = matchResults[mk];
    if (mr?.result) return;
    if (isLocked(SCHEDULE[mk])) return;
    // ou'yu mevcut prediction satırına ekle
    const { data: existing } = await supabase.from("predictions")
      .select("prediction").eq("room_id", room.id).eq("player_id", playerId).eq("match_key", mk).single();
    await supabase.from("predictions").upsert(
      { room_id: room.id, player_id: playerId, match_key: mk, prediction: existing?.prediction || "", ou: value, updated_at: new Date().toISOString() },
      { onConflict: "room_id,player_id,match_key" }
    );
  }

  async function saveResult(mk, value) {
    if (!isAdmin) return;
    const existing = matchResults[mk];
    if (existing?.result === value) {
      await supabase.from("match_results").delete().eq("match_key", mk);
      setMatchResults(prev => { const n = { ...prev }; delete n[mk]; return n; });
    } else {
      await supabase.from("match_results").upsert(
        { match_key: mk, result: value, ou: existing?.ou || null, updated_at: new Date().toISOString() },
        { onConflict: "match_key" }
      );
    }
  }

  async function saveOUResult(mk, value) {
    if (!isAdmin) return;
    const existing = matchResults[mk];
    const newOU = existing?.ou === value ? null : value;
    await supabase.from("match_results").upsert(
      { match_key: mk, result: existing?.result || "", ou: newOU, updated_at: new Date().toISOString() },
      { onConflict: "match_key" }
    );
  }

  async function saveQualifyPred(group, first, second) {
    if (!room) return;
    const qr = qualifyResults[group];
    if (qr?.first_team && qr?.second_team) return; // Sonuç girildiyse değiştirilemez
    await supabase.from("qualify_predictions").upsert(
      { room_id: room.id, player_id: playerId, group_letter: group, first_team: first || "", second_team: second || "", updated_at: new Date().toISOString() },
      { onConflict: "room_id,player_id,group_letter" }
    );
  }

  async function saveQualifyResult(group, pos, team) {
    if (!isAdmin) return;
    const cur = qualifyResults[group] || { first_team: "", second_team: "" };
    const updated = { group_letter: group, first_team: cur.first_team || "", second_team: cur.second_team || "" };
    if (pos === "first") {
      updated.first_team = cur.first_team === team ? "" : team;
      if (updated.second_team === team) updated.second_team = "";
    } else {
      updated.second_team = cur.second_team === team ? "" : team;
      if (updated.first_team === team) updated.first_team = "";
    }
    if (!updated.first_team && !updated.second_team) {
      await supabase.from("qualify_results").delete().eq("group_letter", group);
      setQualifyResults(prev => { const n = { ...prev }; delete n[group]; return n; });
    } else {
      await supabase.from("qualify_results").upsert(
        { ...updated, updated_at: new Date().toISOString() },
        { onConflict: "group_letter" }
      );
    }
  }

  async function saveCupPred(field, team) {
    if (!room) return;
    if (cupResult?.winner) return; // Sonuç girildiyse kilitli
    const cur = cupPreds[playerId] || {};
    const updated = { ...cur, room_id: room.id, player_id: playerId };
    if (field === "winner") {
      updated.winner = cur.winner === team ? null : team;
    } else if (field === "finalist1") {
      updated.finalist1 = cur.finalist1 === team ? null : team;
      if (updated.finalist2 === team) updated.finalist2 = null;
    } else {
      updated.finalist2 = cur.finalist2 === team ? null : team;
      if (updated.finalist1 === team) updated.finalist1 = null;
    }
    await supabase.from("cup_predictions").upsert(
      { ...updated, updated_at: new Date().toISOString() },
      { onConflict: "room_id,player_id" }
    );
  }

  async function saveCupResult(field, team) {
    if (!isAdmin) return;
    const cur = cupResult || {};
    const updated = { id: 1, ...cur };
    if (field === "winner") {
      updated.winner = cur.winner === team ? null : team;
    } else if (field === "finalist1") {
      updated.finalist1 = cur.finalist1 === team ? null : team;
      if (updated.finalist2 === team) updated.finalist2 = null;
    } else {
      updated.finalist2 = cur.finalist2 === team ? null : team;
      if (updated.finalist1 === team) updated.finalist1 = null;
    }
    await supabase.from("cup_results").upsert(
      { ...updated, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
  }

  async function saveKoPred(matchId, field, value) {
    if (!room) return;
    const match = [...KNOCKOUT_R32, ...KNOCKOUT_R16, ...KNOCKOUT_QF].find(m => m.id === matchId);
    if (match && isLocked(match.date)) return;
    const cur = koPreds[`${playerId}:${matchId}`] || {};
    const updated = {
      room_id: room.id, player_id: playerId, match_id: matchId,
      winner: cur.winner || null, method: cur.method || null,
      ou: cur.ou || null, first_goal: cur.first_goal || null,
      goal_time: cur.goal_time || null,
      penalty_yn: cur.penalty_yn || null, red_card_yn: cur.red_card_yn || null,
      var_yn: cur.var_yn || null,
      updated_at: new Date().toISOString()
    };
    updated[field] = value;
    await supabase.from("knockout_predictions").upsert(updated, { onConflict: "room_id,player_id,match_id" });
  }

  async function saveKoResult(matchId, field, value) {
    if (!isAdmin) return;
    const cur = koResults[matchId] || {};
    const updated = {
      match_id: matchId,
      winner: cur.winner || null, method: cur.method || null,
      ou: cur.ou || null, first_goal: cur.first_goal || null,
      goal_time: cur.goal_time || null,
      penalty_yn: cur.penalty_yn || null, red_card_yn: cur.red_card_yn || null,
      var_yn: cur.var_yn || null,
      updated_at: new Date().toISOString()
    };
    updated[field] = cur[field] === value ? null : value;
    await supabase.from("knockout_results").upsert(updated, { onConflict: "match_id" });
  }

  function handleShare() {
    const url = `${window.location.origin}/room/${code}`;
    const text = `⚽ WC 2026 Tahmin Yarışması\n🎟️ Oda: ${room.name}\n📋 Kod: ${code}\n👉 ${url}`;
    if (navigator.share) {
      navigator.share({ title: "WC 2026 Tahmin", text, url });
    } else {
      navigator.clipboard.writeText(text);
      setShareMsg("Kopyalandı!");
      setTimeout(() => setShareMsg(""), 2000);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">⚽</div>
        <div className="text-gold-400 font-bold tracking-widest text-[15px]">YÜKLENİYOR...</div>
      </div>
    </div>
  );

  // Odaya katılmamış kullanıcı
  const isMember = members.some(m => m.player_id === playerId);

  if (!isMember) return <JoinPrompt room={room} code={code} playerId={playerId} />;

  // ── Skor hesaplama ──
  const scores = calculateScores(members, predictions, qualifyPreds, matchResults, qualifyResults);
  // Kupa puanları ekle
  if (cupResult?.winner) {
    members.forEach(m => {
      const cp = cupPreds[m.player_id];
      if (!scores[m.player_id]) return;
      if (cp?.winner === cupResult.winner) scores[m.player_id].pts += 20;
    });
  }
  if (cupResult?.finalist1 && cupResult?.finalist2) {
    const finalists = [cupResult.finalist1, cupResult.finalist2];
    members.forEach(m => {
      const cp = cupPreds[m.player_id];
      if (!scores[m.player_id] || !cp) return;
      const bothCorrect = cp.finalist1 && cp.finalist2 && finalists.includes(cp.finalist1) && finalists.includes(cp.finalist2);
      if (bothCorrect) scores[m.player_id].pts += 10;
    });
  }
  // Knockout puanları (R32 + R16 + QF)
  [...KNOCKOUT_R32, ...KNOCKOUT_R16, ...KNOCKOUT_QF].forEach(match => {
    const kr = koResults[match.id];
    if (!kr) return;
    members.forEach(m => {
      const kp = koPreds[`${m.player_id}:${match.id}`];
      if (!scores[m.player_id] || !kp) return;
      if (kr.winner && kp.winner === kr.winner) scores[m.player_id].pts += 2;
      if (kr.method && kp.method === kr.method) {
        const methodPts = kr.method === "90" ? 3 : kr.method === "extra" ? 4 : 5;
        scores[m.player_id].pts += methodPts;
      }
      if (kr.ou && kp.ou === kr.ou) scores[m.player_id].pts += 1;
      if (kr.first_goal && kp.first_goal === kr.first_goal) scores[m.player_id].pts += 10;
      if (kr.goal_time && kp.goal_time === kr.goal_time) scores[m.player_id].pts += 10;
      if (kr.penalty_yn && kp.penalty_yn === kr.penalty_yn) scores[m.player_id].pts += 5;
      if (kr.red_card_yn && kp.red_card_yn === kr.red_card_yn) scores[m.player_id].pts += 5;
      if (kr.var_yn && kp.var_yn === kr.var_yn) scores[m.player_id].pts += 5;
    });
  });
  const sorted = [...members].sort((a, b) => (scores[b.player_id]?.pts || 0) - (scores[a.player_id]?.pts || 0));

  return (
    <div className="pb-8">
      {/* ── HEADER ── */}
      <div className="pt-4 pb-4 px-5" style={{ background:"linear-gradient(180deg,#162033,#0b1120)" }}>
        <button onClick={() => router.push("/")} style={{ fontSize:14, color:"#64748b", background:"none", border:"none", cursor:"pointer", marginBottom:8, display:"flex", alignItems:"center", gap:4 }}>
          ← Lobiye Dön
        </button>
        <div className="text-center">
          <p className="text-[13px] font-black tracking-[3px] text-gold-400 uppercase">FIFA World Cup 2026</p>
          <h1 className="text-xl font-black text-white mt-1">{room.name}</h1>
          <div className="flex items-center justify-center gap-3 mt-3">
          <span className="text-[14px] text-slate-500 font-mono tracking-widest bg-pitch-700 px-3 py-1 rounded-lg">{code}</span>
          <button onClick={handleShare} className="text-[14px] bg-pitch-700 px-3 py-1 rounded-lg text-gold-400 font-bold cursor-pointer">
            {shareMsg || "📤 Paylaş"}
          </button>
        </div>
        </div>
      </div>

      {/* ── SKOR KARTLARI ── */}
      <div className="px-4 mt-4 mb-5 flex flex-col gap-2">
        {sorted.map((m, i) => {
          const v = scores[m.player_id] || { mc:0, mw:0, qc:0, pts:0 };
          const c = pc(m.player_id);
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`;
          const isMe = m.player_id === playerId;
          return (
            <div key={m.player_id} style={{
              display:"flex", alignItems:"center", gap:14,
              padding:"14px 18px", borderRadius:14,
              background:`linear-gradient(135deg, ${c.dark}, #111827)`,
              border:`1.5px solid ${c.bg}${isMe?"80":"40"}`,
            }}>
              <div style={{ fontSize:26, flexShrink:0 }}>{medal}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:16, fontWeight:900, color:c.ring }}>
                  {m.name} {isMe && <span style={{ fontSize:14, color:"#475569" }}>(sen)</span>}
                </div>
                <div style={{ fontSize:14, color:"#94a3b8", marginTop:2 }}>
                  ✅ {v.mc} &nbsp; ❌ {v.mw} &nbsp; 📊 {v.oc} &nbsp; 🏆 {v.qc}
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:34, fontWeight:900, color:"#fff", lineHeight:1 }}>{v.pts}</div>
                <div style={{ fontSize:14, color:c.ring, fontWeight:700 }}>PUAN</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── NAV ── */}
      <div className="flex gap-1.5 px-4 mb-4">
        {[["matches","🎯 Maçlar"],["qualify","🏆 Sıralama"],["knockout","⚔️ Knockout"],["qf","🏆 Ç.Final"],["cup","🏅 Kupa"],["scoreboard","📊 Detay"]].map(([v,label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            flex:1, padding:"12px 6px", border:"none", borderRadius:10, cursor:"pointer",
            background:view===v?"linear-gradient(135deg,#c9a84c,#a67c2e)":"#1e293b",
            color:view===v?"#0b1120":"#94a3b8", fontWeight:700, fontSize:14,
          }}>{label}</button>
        ))}
      </div>

      {/* ── GRUP TABS ── */}
      {view !== "scoreboard" && view !== "cup" && view !== "knockout" && view !== "qf" && (
        <div className="flex flex-wrap gap-1.5 px-4 mb-5 justify-center">
          {GROUP_KEYS.map(g => (
            <button key={g} onClick={() => setActiveGroup(g)} style={{
              width:"calc(25% - 6px)", padding:"10px 0", borderRadius:10, cursor:"pointer",
              border:activeGroup===g?"2px solid #c9a84c":"1px solid #1e293b",
              background:activeGroup===g?"#c9a84c18":"#1e293b",
              color:activeGroup===g?"#c9a84c":"#64748b", fontWeight:800, fontSize:15, textAlign:"center",
            }}>{g}</button>
          ))}
        </div>
      )}

      {/* ═══ MATCHES ═══ */}
      {view === "matches" && (
        <div className="px-4">
          <div style={{ padding:"14px 18px", borderRadius:"14px 14px 0 0", background:"linear-gradient(135deg,#1e293b,#0f172a)", borderBottom:"2px solid #c9a84c30", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:16, fontWeight:900, color:"#c9a84c" }}>GRUP {activeGroup}</span>
            <span style={{ fontSize:18 }}>{GROUPS[activeGroup].map(t => FLAGS[t]).join(" ")}</span>
          </div>
          <div style={{ background:"#111827", border:"1px solid #1e293b", borderTop:"none", borderRadius:"0 0 14px 14px", overflow:"hidden" }}>
            {getSortedMatches(activeGroup, GROUPS[activeGroup]).map(([t1, t2], idx, arr) => {
              const mk = matchKey(activeGroup, t1, t2);
              const mr = matchResults[mk] || {};
              const result = mr.result;
              const ouResult = mr.ou;
              const kickoff = SCHEDULE[mk];
              const locked = !!result || isLocked(kickoff);
              return (
                <div key={mk} style={{ padding:18, borderBottom:idx<arr.length-1?"1px solid #1e293b30":"none", background:result?"#041a0a":"transparent" }}>
                  {/* Date + Time */}
                  <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:8, marginBottom:10 }}>
                    <span style={{ fontSize:14, color: locked?"#ef4444":"#c9a84c", fontWeight:700 }}>
                      {locked && !result ? "🔒 " : "🕐 "}{formatTR(kickoff)}
                    </span>
                    {locked && !result && <span style={{ fontSize:12, color:"#ef4444", background:"#ef444420", padding:"2px 8px", borderRadius:6 }}>KİLİTLİ</span>}
                  </div>
                  {/* VS */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginBottom:16 }}>
                    <div style={{ flex:1, textAlign:"center" }}>
                      <span style={{ fontSize:32, display:"block", marginBottom:4 }}>{FLAGS[t1]}</span>
                      <span style={{ fontSize:14, fontWeight:700 }}>{shortName(t1)}</span>
                    </div>
                    <span style={{ fontSize:14, fontWeight:900, color:"#475569", background:"#1e293b", borderRadius:20, padding:"4px 12px", letterSpacing:2 }}>VS</span>
                    <div style={{ flex:1, textAlign:"center" }}>
                      <span style={{ fontSize:32, display:"block", marginBottom:4 }}>{FLAGS[t2]}</span>
                      <span style={{ fontSize:14, fontWeight:700 }}>{shortName(t2)}</span>
                    </div>
                  </div>

                  {/* Admin Sonuç + Alt/Üst */}
                  {isAdmin && (
                    <div style={{ marginBottom:14, padding:"10px 12px", borderRadius:10, background:"#0a1628", border:"1px solid #1e293b" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                        <span style={{ fontSize:14, fontWeight:800, color:"#475569" }}>SONUÇ</span>
                        <div style={{ display:"flex", gap:6, flex:1, justifyContent:"center" }}>
                          {["1","X","2"].map(v => (
                            <button key={v} onClick={() => saveResult(mk, v)} style={{
                              padding:"6px 14px", borderRadius:8, cursor:"pointer",
                              border:result===v?"2px solid #16a34a":"1px solid #334155",
                              background:result===v?"#16a34a":"transparent",
                              color:result===v?"#fff":"#64748b", fontSize:14, fontWeight:result===v?700:500,
                            }}>{v==="1"?shortName(t1):v==="2"?shortName(t2):"X"}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:14, fontWeight:800, color:"#475569" }}>A/Ü</span>
                        <div style={{ display:"flex", gap:6, flex:1, justifyContent:"center" }}>
                          {["alt","ust"].map(v => (
                            <button key={v} onClick={() => saveOUResult(mk, v)} style={{
                              padding:"6px 14px", borderRadius:8, cursor:"pointer",
                              border:ouResult===v?"2px solid #16a34a":"1px solid #334155",
                              background:ouResult===v?"#16a34a":"transparent",
                              color:ouResult===v?"#fff":"#64748b", fontSize:14, fontWeight:ouResult===v?700:500,
                            }}>{v==="alt"?"⬇ Alt":"⬆ Üst"}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Non-admin result display */}
                  {!isAdmin && result && (
                    <div style={{ textAlign:"center", marginBottom:12, padding:"6px", borderRadius:8, background:"#16a34a20", border:"1px solid #16a34a40" }}>
                      <span style={{ fontSize:14, fontWeight:700, color:"#4ade80" }}>
                        Sonuç: {result==="1"?t1:result==="2"?t2:"Berabere"}{ouResult ? ` • ${ouResult==="alt"?"⬇ Alt":"⬆ Üst"}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Player predictions */}
                  {members.map(member => {
                    const pred = predictions[`${member.player_id}:${mk}`];
                    const ouPred = predictions[`ou:${member.player_id}:${mk}`];
                    const ok = result && pred === result;
                    const no = result && pred && pred !== result;
                    const ouOk = ouResult && ouPred === ouResult;
                    const ouNo = ouResult && ouPred && ouPred !== ouResult;
                    const c = pc(member.player_id);
                    const isMe = member.player_id === playerId;
                    return (
                      <div key={member.player_id} style={{
                        padding:"10px 12px", borderRadius:10, marginBottom:6,
                        background:ok?"#041a0a":no?"#1a0505":"#0f172a",
                        border:`1px solid ${ok?"#16a34a40":no?"#ef444440":c.bg+"30"}`,
                      }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                          <div style={{ width:8, height:8, borderRadius:4, background:c.bg, flexShrink:0 }}/>
                          <span style={{ fontSize:14, fontWeight:800, color:c.ring, minWidth:48 }}>{member.name}</span>
                          <div style={{ display:"flex", gap:6, flex:1, justifyContent:"center" }}>
                            {["1","X","2"].map(v => (
                              <button key={v} disabled={!isMe || locked} onClick={() => savePrediction(mk, v)} style={{
                                padding:"6px 14px", borderRadius:8, border:"none",
                                cursor:isMe && !locked?"pointer":"default",
                                opacity:!isMe && !pred ? 0.4 : 1,
                                background:pred===v?"#c9a84c":"#1e293b",
                                color:pred===v?"#000":"#64748b", fontWeight:pred===v?800:500, fontSize:14,
                              }}>{v}</button>
                            ))}
                          </div>
                          {ok && <span style={{ fontSize:16 }}>✅</span>}
                          {no && <span style={{ fontSize:16 }}>❌</span>}
                        </div>
                        {/* Alt/Üst row */}
                        <div style={{ display:"flex", alignItems:"center", gap:10, paddingLeft:18 }}>
                          <span style={{ fontSize:12, color:"#475569", fontWeight:600, minWidth:48 }}>Alt/Üst</span>
                          <div style={{ display:"flex", gap:6, flex:1, justifyContent:"center" }}>
                            {["alt","ust"].map(v => (
                              <button key={v} disabled={!isMe || locked} onClick={() => saveOU(mk, v)} style={{
                                padding:"4px 12px", borderRadius:6, border:"none",
                                cursor:isMe && !locked?"pointer":"default",
                                opacity:!isMe && !ouPred ? 0.4 : 1,
                                background:ouPred===v?(v==="alt"?"#6366f1":"#ec4899"):"#1e293b",
                                color:ouPred===v?"#fff":"#64748b", fontWeight:ouPred===v?700:500, fontSize:13,
                              }}>{v==="alt"?"⬇ Alt":"⬆ Üst"}</button>
                            ))}
                          </div>
                          {ouOk && <span style={{ fontSize:14 }}>✅</span>}
                          {ouNo && <span style={{ fontSize:14 }}>❌</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ QUALIFY ═══ */}
      {view === "qualify" && (
        <div className="px-4">
          <div style={{ padding:"14px 18px", borderRadius:"14px 14px 0 0", background:"linear-gradient(135deg,#2a1f00,#0f172a)", borderBottom:"2px solid #c9a84c30" }}>
            <span style={{ fontSize:16, fontWeight:900, color:"#c9a84c" }}>GRUP {activeGroup} — SIRALAMASI</span>
          </div>
          <div style={{ background:"#111827", border:"1px solid #1e293b", borderTop:"none", borderRadius:"0 0 14px 14px", padding:18 }}>
            {/* Takımlar */}
            <div style={{ display:"flex", justifyContent:"center", gap:18, marginBottom:22 }}>
              {GROUPS[activeGroup].map(t => (
                <div key={t} style={{ textAlign:"center" }}>
                  <span style={{ fontSize:28 }}>{FLAGS[t]}</span>
                  <div style={{ fontSize:14, color:"#94a3b8", marginTop:4 }}>{shortName(t)}</div>
                </div>
              ))}
            </div>

            {/* Admin sonuç girişi */}
            {isAdmin && (
              <div style={{ marginBottom:22, padding:16, borderRadius:12, background:"#0a1628", border:"1px solid #1e293b" }}>
                <div style={{ fontSize:14, fontWeight:800, color:"#16a34a", marginBottom:12 }}>🏆 GERÇEK SONUÇ</div>
                {["first","second"].map(pos => {
                  const qr = qualifyResults[activeGroup] || {};
                  const val = pos === "first" ? qr.first_team : qr.second_team;
                  return (
                    <div key={pos} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <span style={{ fontSize:15, fontWeight:900, color:pos==="first"?"#c9a84c":"#94a3b8", background:pos==="first"?"#c9a84c20":"#1e293b", borderRadius:8, padding:"4px 10px" }}>
                        {pos==="first"?"1.":"2."}
                      </span>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {GROUPS[activeGroup].map(t => (
                          <button key={t} onClick={() => saveQualifyResult(activeGroup, pos, t)} style={{
                            padding:"6px 12px", borderRadius:8, cursor:"pointer",
                            border:val===t?"2px solid #16a34a":"1px solid #334155",
                            background:val===t?"#16a34a20":"transparent",
                            color:val===t?"#4ade80":"#64748b", fontSize:14, fontWeight:val===t?700:400,
                          }}>{FLAGS[t]} {shortName(t)}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Oyuncu tahminleri */}
            {members.map(member => {
              const qp = qualifyPreds[`${member.player_id}:${activeGroup}`] || {};
              const qr = qualifyResults[activeGroup] || {};
              const hasResult = qr.first_team && qr.second_team;
              const c = pc(member.player_id);
              const isMe = member.player_id === playerId;
              return (
                <div key={member.player_id} style={{ marginBottom:12, padding:16, borderRadius:12, background:`${c.bg}08`, border:`1px solid ${c.bg}30` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                    <div style={{ width:10, height:10, borderRadius:5, background:c.bg }}/>
                    <span style={{ fontSize:16, fontWeight:900, color:c.ring }}>{member.name}</span>
                    {hasResult && qp.first_team && qp.second_team && (
                      <span style={{ fontSize:14, marginLeft:"auto" }}>
                        {qp.first_team===qr.first_team && qp.second_team===qr.second_team
                          ? <span style={{color:"#4ade80", fontWeight:700}}>✅ 10p</span>
                          : <span style={{color:"#f87171", fontWeight:700}}>❌ 0p</span>
                        }
                      </span>
                    )}
                  </div>
                  {["first","second"].map(pos => {
                    const sel = pos === "first" ? qp.first_team : qp.second_team;
                    return (
                      <div key={pos} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                        <span style={{ fontSize:15, fontWeight:800, color:pos==="first"?"#c9a84c":"#64748b", minWidth:24 }}>
                          {pos==="first"?"1.":"2."}
                        </span>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {GROUPS[activeGroup].map(t => {
                            const a = sel === t;
                            return (
                              <button key={t} disabled={!isMe || hasResult} onClick={() => {
                                const cur = { first: qp.first_team || null, second: qp.second_team || null };
                                if (pos === "first") {
                                  cur.first = cur.first === t ? null : t;
                                  if (cur.second === t) cur.second = null;
                                } else {
                                  cur.second = cur.second === t ? null : t;
                                  if (cur.first === t) cur.first = null;
                                }
                                saveQualifyPred(activeGroup, cur.first, cur.second);
                              }} style={{
                                padding:"5px 10px", borderRadius:8,
                                cursor:isMe&&!hasResult?"pointer":"default",
                                opacity:!isMe && !sel ? 0.4 : 1,
                                border:a?`2px solid ${c.bg}`:"1px solid #334155",
                                background:a?`${c.bg}20`:"transparent",
                                color:a?c.ring:"#64748b", fontSize:14, fontWeight:a?700:400,
                              }}>{FLAGS[t]} {shortName(t)}</button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ═══ KNOCKOUT ═══ */}
      {view === "knockout" && (() => {
        const KO_MATCHES = koRound === "R32" ? KNOCKOUT_R32 : KNOCKOUT_R16;
        const roundLabel = koRound === "R32" ? "SON 32" : "SON 16";
        return (
        <div className="px-4">
          <div style={{ display:"flex", gap:6, marginBottom:12 }}>
            {[["R32","Son 32"],["R16","Son 16"]].map(([v,label]) => (
              <button key={v} onClick={() => setKoRound(v)} style={{
                flex:1, padding:"10px", borderRadius:10, cursor:"pointer",
                border:koRound===v?"2px solid #c9a84c":"1px solid #1e293b",
                background:koRound===v?"#c9a84c18":"#1e293b",
                color:koRound===v?"#c9a84c":"#64748b", fontWeight:800, fontSize:15,
              }}>{label}</button>
            ))}
          </div>
          <div style={{ borderRadius:14, overflow:"hidden", border:"1px solid #1e293b", background:"#111827" }}>
            <div style={{ padding:"14px 18px", background:"linear-gradient(135deg,#2d1b00,#0f172a)", borderBottom:"2px solid #c9a84c30" }}>
              <span style={{ fontSize:16, fontWeight:900, color:"#c9a84c" }}>⚔️ {roundLabel}</span>
              <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>Kazanan 2p • 90dk 3p • Uzatma 4p • Penaltı 5p • A/Ü 1p • İlk Gol 10p</div>
            </div>
            {KO_MATCHES.map((match, idx) => {
              const kr = koResults[match.id] || {};
              const locked = !!kr.winner || isLocked(match.date);
              const METHODS = [["90","90 dk",3],["extra","Uzatma",4],["penalty","Penaltı",5]];
              return (
                <div key={match.id} style={{ padding:18, borderBottom:idx<KO_MATCHES.length-1?"1px solid #1e293b30":"none", background:kr.winner?"#041a0a":"transparent" }}>
                  <div style={{ textAlign:"center", marginBottom:10 }}>
                    <span style={{ fontSize:14, color:locked&&!kr.winner?"#ef4444":"#c9a84c", fontWeight:700 }}>
                      {locked&&!kr.winner?"🔒 ":"🕐 "}{formatTR(match.date)}
                    </span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginBottom:14 }}>
                    <div style={{ flex:1, textAlign:"center" }}>
                      <span style={{ fontSize:32, display:"block", marginBottom:4 }}>{FLAGS[match.home]}</span>
                      <span style={{ fontSize:14, fontWeight:700 }}>{shortName(match.home)}</span>
                    </div>
                    <span style={{ fontSize:14, fontWeight:900, color:"#475569", background:"#1e293b", borderRadius:20, padding:"4px 12px" }}>VS</span>
                    <div style={{ flex:1, textAlign:"center" }}>
                      <span style={{ fontSize:32, display:"block", marginBottom:4 }}>{FLAGS[match.away]}</span>
                      <span style={{ fontSize:14, fontWeight:700 }}>{shortName(match.away)}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{ marginBottom:14, padding:"10px 12px", borderRadius:10, background:"#0a1628", border:"1px solid #1e293b" }}>
                      {[["KİM?","winner",[match.home,match.away]],["NASIL?","method_btn",METHODS],["A/Ü","ou_btn",["alt","ust"]],["İLK G","first_goal",[match.home,match.away]]].map(([label,type,opts]) => (
                        <div key={label} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                          <span style={{ fontSize:14, fontWeight:800, color:"#475569", minWidth:44 }}>{label}</span>
                          {type==="method_btn" ? opts.map(([v,lbl]) => (
                            <button key={v} onClick={() => saveKoResult(match.id,"method",v)} style={{ padding:"5px 10px", borderRadius:8, cursor:"pointer", border:kr.method===v?"2px solid #16a34a":"1px solid #334155", background:kr.method===v?"#16a34a":"transparent", color:kr.method===v?"#fff":"#64748b", fontSize:13, fontWeight:kr.method===v?700:400 }}>{lbl}</button>
                          )) : type==="ou_btn" ? opts.map(v => (
                            <button key={v} onClick={() => saveKoResult(match.id,"ou",v)} style={{ padding:"5px 12px", borderRadius:8, cursor:"pointer", border:kr.ou===v?"2px solid #16a34a":"1px solid #334155", background:kr.ou===v?"#16a34a":"transparent", color:kr.ou===v?"#fff":"#64748b", fontSize:13, fontWeight:kr.ou===v?700:400 }}>{v==="alt"?"⬇ Alt":"⬆ Üst"}</button>
                          )) : opts.map(t => (
                            <button key={t} onClick={() => saveKoResult(match.id,type,t)} style={{ padding:"5px 12px", borderRadius:8, cursor:"pointer", border:kr[type]===t?"2px solid #16a34a":"1px solid #334155", background:kr[type]===t?"#16a34a":"transparent", color:kr[type]===t?"#fff":"#64748b", fontSize:14, fontWeight:kr[type]===t?700:400 }}>{FLAGS[t]||""} {shortName(t)}</button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {!isAdmin && kr.winner && (
                    <div style={{ textAlign:"center", marginBottom:12, padding:"6px", borderRadius:8, background:"#16a34a20", border:"1px solid #16a34a40" }}>
                      <span style={{ fontSize:14, fontWeight:700, color:"#4ade80" }}>
                        {FLAGS[kr.winner]} {kr.winner} — {kr.method==="90"?"90dk":kr.method==="extra"?"Uzatma":"Penaltı"}
                        {kr.ou?` • ${kr.ou==="alt"?"⬇":"⬆"}`:""}{kr.first_goal?` • İlk: ${FLAGS[kr.first_goal]}`:""}
                      </span>
                    </div>
                  )}
                  {members.map(member => {
                    const kp = koPreds[`${member.player_id}:${match.id}`] || {};
                    const c = pc(member.player_id);
                    const isMe = member.player_id === playerId;
                    const hasR = !!kr.winner;
                    return (
                      <div key={member.player_id} style={{ padding:"10px 12px", borderRadius:10, marginBottom:6, background:hasR&&kp.winner===kr.winner?"#041a0a":"#0f172a", border:`1px solid ${hasR&&kp.winner===kr.winner?"#16a34a40":c.bg+"30"}` }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                          <div style={{ width:8, height:8, borderRadius:4, background:c.bg }}/>
                          <span style={{ fontSize:14, fontWeight:800, color:c.ring, flex:1 }}>{member.name}</span>
                          {hasR && <span style={{ fontSize:13 }}>
                            {kp.winner===kr.winner?"✅":"❌"}
                            {kr.method&&kp.method?(kp.method===kr.method?"✅":"❌"):""}
                            {kr.ou&&kp.ou?(kp.ou===kr.ou?"✅":"❌"):""}
                            {kr.first_goal&&kp.first_goal?(kp.first_goal===kr.first_goal?"✅":"❌"):""}
                          </span>}
                        </div>
                        {[
                          ["Kim?","winner",[match.home,match.away],"#c9a84c"],
                          ["Nasıl?","method",METHODS,null],
                          ["A/Ü","ou",[["alt","⬇ Alt"],["ust","⬆ Üst"]],null],
                          ["İlk G","first_goal",[match.home,match.away],"#f97316"],
                        ].map(([label,field,opts,activeColor]) => (
                          <div key={field} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5, paddingLeft:16 }}>
                            <span style={{ fontSize:13, color:"#475569", fontWeight:600, minWidth:42 }}>{label}</span>
                            {field==="method" ? opts.map(([v,lbl,pts]) => (
                              <button key={v} disabled={!isMe||locked} onClick={() => saveKoPred(match.id,"method",v)} style={{ padding:"4px 8px", borderRadius:6, border:"none", cursor:isMe&&!locked?"pointer":"default", opacity:!isMe&&!kp.method?0.4:1, background:kp.method===v?(v==="90"?"#6366f1":v==="extra"?"#f59e0b":"#ec4899"):"#1e293b", color:kp.method===v?"#fff":"#64748b", fontSize:12, fontWeight:kp.method===v?700:400 }}>{lbl}</button>
                            )) : field==="ou" ? opts.map(([v,lbl]) => (
                              <button key={v} disabled={!isMe||locked} onClick={() => saveKoPred(match.id,"ou",v)} style={{ padding:"4px 10px", borderRadius:6, border:"none", cursor:isMe&&!locked?"pointer":"default", opacity:!isMe&&!kp.ou?0.4:1, background:kp.ou===v?(v==="alt"?"#6366f1":"#ec4899"):"#1e293b", color:kp.ou===v?"#fff":"#64748b", fontSize:13, fontWeight:kp.ou===v?700:400 }}>{lbl}</button>
                            )) : opts.map(t => (
                              <button key={t} disabled={!isMe||locked} onClick={() => saveKoPred(match.id,field,t)} style={{ padding:"4px 10px", borderRadius:6, border:"none", cursor:isMe&&!locked?"pointer":"default", opacity:!isMe&&!kp[field]?0.4:1, background:kp[field]===t?(activeColor||"#c9a84c"):"#1e293b", color:kp[field]===t?"#fff":"#64748b", fontSize:13, fontWeight:kp[field]===t?700:400 }}>{FLAGS[t]||""} {shortName(t)}</button>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        );
      })()}

      {/* ═══ QUARTER FINALS ═══ */}
      {view === "qf" && (
        <div className="px-4">
          <div style={{ borderRadius:14, overflow:"hidden", border:"1px solid #1e293b", background:"#111827" }}>
            <div style={{ padding:"14px 18px", background:"linear-gradient(135deg,#1b2d00,#0f172a)", borderBottom:"2px solid #c9a84c30" }}>
              <span style={{ fontSize:16, fontWeight:900, color:"#c9a84c" }}>🏆 ÇEYREK FİNAL</span>
              <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>Kazanan 2p • Nasıl 3/4/5p • A/Ü 1p • Dakika 10p • İlk Gol / Penaltı / Kırmızı / VAR 5p</div>
            </div>
            {KNOCKOUT_QF.map((match, idx) => {
              const kr = koResults[match.id] || {};
              const locked = isLocked(match.date);
              const METHODS = [["90","90 dk"],["extra","Uzatma"],["penalty","Penaltı"]];
              return (
                <div key={match.id} style={{ padding:18, borderBottom:idx<KNOCKOUT_QF.length-1?"1px solid #1e293b30":"none", background:kr.winner?"#041a0a":"transparent" }}>
                  <div style={{ textAlign:"center", marginBottom:10 }}>
                    <span style={{ fontSize:14, color:locked?"#ef4444":"#c9a84c", fontWeight:700 }}>
                      {locked?"🔒 ":"🕐 "}{formatTR(match.date)}
                    </span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginBottom:14 }}>
                    <div style={{ flex:1, textAlign:"center" }}>
                      <span style={{ fontSize:36, display:"block", marginBottom:4 }}>{FLAGS[match.home]}</span>
                      <span style={{ fontSize:15, fontWeight:700 }}>{shortName(match.home)}</span>
                    </div>
                    <span style={{ fontSize:15, fontWeight:900, color:"#475569", background:"#1e293b", borderRadius:20, padding:"5px 14px" }}>VS</span>
                    <div style={{ flex:1, textAlign:"center" }}>
                      <span style={{ fontSize:36, display:"block", marginBottom:4 }}>{FLAGS[match.away]}</span>
                      <span style={{ fontSize:15, fontWeight:700 }}>{shortName(match.away)}</span>
                    </div>
                  </div>

                  {/* Admin */}
                  {isAdmin && (
                    <div style={{ marginBottom:14, padding:"12px", borderRadius:10, background:"#0a1628", border:"1px solid #1e293b" }}>
                      {[
                        ["KİM?","winner",[match.home,match.away]],
                        ["NASIL?","method_btn",METHODS],
                        ["A/Ü","ou_btn",[["alt","⬇ Alt"],["ust","⬆ Üst"]]],
                        ["DAKİKA","goal_time_btn",GOAL_TIME_SLOTS],
                        ["İLK G","first_goal",[match.home,match.away]],
                        ["PENALTI","penalty_yn_btn",[["evet","✅ Olur"],["hayir","❌ Olmaz"]]],
                        ["KIRMIZI","red_card_yn_btn",[["evet","✅ Olur"],["hayir","❌ Olmaz"]]],
                        ["VAR","var_yn_btn",[["evet","✅ Gider"],["hayir","❌ Gitmez"]]],
                      ].map(([label,type,opts]) => (
                        <div key={label} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6, flexWrap:"wrap" }}>
                          <span style={{ fontSize:14, fontWeight:800, color:"#475569", minWidth:50 }}>{label}</span>
                          {type==="method_btn" ? opts.map(([v,lbl]) => (
                            <button key={v} onClick={() => saveKoResult(match.id,"method",v)} style={{ padding:"5px 10px", borderRadius:8, cursor:"pointer", border:kr.method===v?"2px solid #16a34a":"1px solid #334155", background:kr.method===v?"#16a34a":"transparent", color:kr.method===v?"#fff":"#64748b", fontSize:13, fontWeight:kr.method===v?700:400 }}>{lbl}</button>
                          )) : type==="ou_btn" ? opts.map(([v,lbl]) => (
                            <button key={v} onClick={() => saveKoResult(match.id,"ou",v)} style={{ padding:"5px 12px", borderRadius:8, cursor:"pointer", border:kr.ou===v?"2px solid #16a34a":"1px solid #334155", background:kr.ou===v?"#16a34a":"transparent", color:kr.ou===v?"#fff":"#64748b", fontSize:13, fontWeight:kr.ou===v?700:400 }}>{lbl}</button>
                          )) : type==="goal_time_btn" ? opts.map(([v,lbl]) => (
                            <button key={v} onClick={() => saveKoResult(match.id,"goal_time",v)} style={{ padding:"5px 8px", borderRadius:8, cursor:"pointer", border:kr.goal_time===v?"2px solid #16a34a":"1px solid #334155", background:kr.goal_time===v?"#16a34a":"transparent", color:kr.goal_time===v?"#fff":"#64748b", fontSize:12, fontWeight:kr.goal_time===v?700:400 }}>{lbl}</button>
                          )) : type==="penalty_yn_btn" ? opts.map(([v,lbl]) => (
                            <button key={v} onClick={() => saveKoResult(match.id,"penalty_yn",v)} style={{ padding:"5px 10px", borderRadius:8, cursor:"pointer", border:kr.penalty_yn===v?"2px solid #16a34a":"1px solid #334155", background:kr.penalty_yn===v?"#16a34a":"transparent", color:kr.penalty_yn===v?"#fff":"#64748b", fontSize:13, fontWeight:kr.penalty_yn===v?700:400 }}>{lbl}</button>
                          )) : type==="red_card_yn_btn" ? opts.map(([v,lbl]) => (
                            <button key={v} onClick={() => saveKoResult(match.id,"red_card_yn",v)} style={{ padding:"5px 10px", borderRadius:8, cursor:"pointer", border:kr.red_card_yn===v?"2px solid #16a34a":"1px solid #334155", background:kr.red_card_yn===v?"#16a34a":"transparent", color:kr.red_card_yn===v?"#fff":"#64748b", fontSize:13, fontWeight:kr.red_card_yn===v?700:400 }}>{lbl}</button>
                          )) : type==="var_yn_btn" ? opts.map(([v,lbl]) => (
                            <button key={v} onClick={() => saveKoResult(match.id,"var_yn",v)} style={{ padding:"5px 10px", borderRadius:8, cursor:"pointer", border:kr.var_yn===v?"2px solid #16a34a":"1px solid #334155", background:kr.var_yn===v?"#16a34a":"transparent", color:kr.var_yn===v?"#fff":"#64748b", fontSize:13, fontWeight:kr.var_yn===v?700:400 }}>{lbl}</button>
                          )) : opts.map(t => (
                            <button key={t} onClick={() => saveKoResult(match.id,type,t)} style={{ padding:"5px 12px", borderRadius:8, cursor:"pointer", border:kr[type]===t?"2px solid #16a34a":"1px solid #334155", background:kr[type]===t?"#16a34a":"transparent", color:kr[type]===t?"#fff":"#64748b", fontSize:14, fontWeight:kr[type]===t?700:400 }}>{FLAGS[t]||""} {shortName(t)}</button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {!isAdmin && kr.winner && (
                    <div style={{ textAlign:"center", marginBottom:12, padding:"8px", borderRadius:8, background:"#16a34a20", border:"1px solid #16a34a40" }}>
                      <span style={{ fontSize:14, fontWeight:700, color:"#4ade80" }}>
                        {FLAGS[kr.winner]} {kr.winner} — {kr.method==="90"?"90dk":kr.method==="extra"?"Uzatma":"Penaltı"}
                        {kr.ou?` • ${kr.ou==="alt"?"⬇":"⬆"}`:""}{kr.goal_time?` • ${kr.goal_time}'`:""}
                      </span>
                    </div>
                  )}

                  {/* Oyuncular */}
                  {members.map(member => {
                    const kp = koPreds[`${member.player_id}:${match.id}`] || {};
                    const c = pc(member.player_id);
                    const isMe = member.player_id === playerId;
                    const hasR = !!kr.winner;
                    return (
                      <div key={member.player_id} style={{ padding:"10px 12px", borderRadius:10, marginBottom:6, background:hasR&&kp.winner===kr.winner?"#041a0a":"#0f172a", border:`1px solid ${hasR&&kp.winner===kr.winner?"#16a34a40":c.bg+"30"}` }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                          <div style={{ width:8, height:8, borderRadius:4, background:c.bg }}/>
                          <span style={{ fontSize:14, fontWeight:800, color:c.ring, flex:1 }}>{member.name}</span>
                          {hasR && <span style={{ fontSize:13 }}>
                            {kp.winner===kr.winner?"✅":"❌"}
                            {kr.method&&kp.method?(kp.method===kr.method?"✅":"❌"):""}
                            {kr.ou&&kp.ou?(kp.ou===kr.ou?"✅":"❌"):""}
                            {kr.goal_time&&kp.goal_time?(kp.goal_time===kr.goal_time?"✅":"❌"):""}
                            {kr.first_goal&&kp.first_goal?(kp.first_goal===kr.first_goal?"✅":"❌"):""}
                            {kr.penalty_yn&&kp.penalty_yn?(kp.penalty_yn===kr.penalty_yn?"✅":"❌"):""}
                            {kr.red_card_yn&&kp.red_card_yn?(kp.red_card_yn===kr.red_card_yn?"✅":"❌"):""}
                            {kr.var_yn&&kp.var_yn?(kp.var_yn===kr.var_yn?"✅":"❌"):""}
                          </span>}
                        </div>
                        {[
                          ["Kim?","winner",[match.home,match.away],"#c9a84c"],
                          ["Nasıl?","method",[["90","90dk"],["extra","Uzatma"],["penalty","Penaltı"]],null],
                          ["A/Ü","ou",[["alt","⬇ Alt"],["ust","⬆ Üst"]],null],
                          ["Dakika","goal_time",GOAL_TIME_SLOTS,"#8b5cf6"],
                          ["İlk G","first_goal",[match.home,match.away],"#f97316"],
                          ["Penaltı","penalty_yn",[["evet","✅ Olur"],["hayir","❌ Olmaz"]],"#ef4444"],
                          ["Kırmızı","red_card_yn",[["evet","✅ Olur"],["hayir","❌ Olmaz"]],"#ef4444"],
                          ["VAR","var_yn",[["evet","✅ Gider"],["hayir","❌ Gitmez"]],"#3b82f6"],
                        ].map(([label,field,opts,activeColor]) => (
                          <div key={field} style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5, paddingLeft:16, flexWrap:"wrap" }}>
                            <span style={{ fontSize:13, color:"#475569", fontWeight:600, minWidth:44 }}>{label}</span>
                            {(field==="method"||field==="ou"||field==="goal_time"||field==="penalty_yn"||field==="red_card_yn"||field==="var_yn") ? opts.map(([v,lbl]) => (
                              <button key={v} disabled={!isMe||locked} onClick={() => saveKoPred(match.id,field,v)} style={{
                                padding:"4px 8px", borderRadius:6, border:"none", cursor:isMe&&!locked?"pointer":"default",
                                opacity:!isMe&&!kp[field]?0.4:1,
                                background:kp[field]===v?(field==="method"?(v==="90"?"#6366f1":v==="extra"?"#f59e0b":"#ec4899"):field==="ou"?(v==="alt"?"#6366f1":"#ec4899"):(activeColor||"#8b5cf6")):"#1e293b",
                                color:kp[field]===v?"#fff":"#64748b", fontSize:12, fontWeight:kp[field]===v?700:400,
                              }}>{lbl}</button>
                            )) : opts.map(t => (
                              <button key={t} disabled={!isMe||locked} onClick={() => saveKoPred(match.id,field,t)} style={{
                                padding:"4px 10px", borderRadius:6, border:"none", cursor:isMe&&!locked?"pointer":"default",
                                opacity:!isMe&&!kp[field]?0.4:1,
                                background:kp[field]===t?(activeColor||"#c9a84c"):"#1e293b",
                                color:kp[field]===t?"#fff":"#64748b", fontSize:13, fontWeight:kp[field]===t?700:400,
                              }}>{FLAGS[t]||""} {shortName(t)}</button>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ CUP ═══ */}
      {view === "cup" && (
        <div className="px-4">
          <div style={{ borderRadius:14, overflow:"hidden", border:"1px solid #1e293b", background:"#111827" }}>
            <div style={{ padding:"14px 18px", background:"linear-gradient(135deg,#3b1f00,#0f172a)", borderBottom:"2px solid #c9a84c30" }}>
              <span style={{ fontSize:16, fontWeight:900, color:"#c9a84c" }}>🏅 KUPAY​I KİM KAZANIR?</span>
            </div>
            <div style={{ padding:18 }}>

              {/* Admin sonuç girişi */}
              {isAdmin && (
                <div style={{ marginBottom:22, padding:16, borderRadius:12, background:"#0a1628", border:"1px solid #1e293b" }}>
                  <div style={{ fontSize:14, fontWeight:800, color:"#16a34a", marginBottom:14 }}>🏆 GERÇEK SONUÇ</div>
                  {[
                    ["winner", "🏆 Şampiyon", cupResult?.winner],
                    ["finalist1", "⭐ Finalist 1", cupResult?.finalist1],
                    ["finalist2", "⭐ Finalist 2", cupResult?.finalist2],
                  ].map(([field, label, val]) => (
                    <div key={field} style={{ marginBottom:10 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:"#94a3b8", marginBottom:6 }}>{label}</div>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        {ALL_TEAMS.map(t => (
                          <button key={t} onClick={() => saveCupResult(field, t)} style={{
                            padding:"4px 8px", borderRadius:6, cursor:"pointer", fontSize:13,
                            border:val===t?"2px solid #16a34a":"1px solid #334155",
                            background:val===t?"#16a34a20":"transparent",
                            color:val===t?"#4ade80":"#64748b", fontWeight:val===t?700:400,
                          }}>{FLAGS[t]} {shortName(t)}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Oyuncu tahminleri */}
              {members.map(member => {
                const cp = cupPreds[member.player_id] || {};
                const c = pc(member.player_id);
                const isMe = member.player_id === playerId;
                const hasResult = !!cupResult?.winner;
                return (
                  <div key={member.player_id} style={{
                    marginBottom:12, padding:16, borderRadius:12,
                    background:`${c.bg}08`, border:`1px solid ${c.bg}30`,
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                      <div style={{ width:10, height:10, borderRadius:5, background:c.bg }}/>
                      <span style={{ fontSize:16, fontWeight:900, color:c.ring }}>{member.name}</span>
                    </div>

                    {[
                      ["winner", "🏆 Şampiyon (20p)", cp.winner],
                      ["finalist1", "⭐ Finalist 1", cp.finalist1],
                      ["finalist2", "⭐ Finalist 2", cp.finalist2],
                    ].map(([field, label, val]) => {
                      const finalistsKnown = cupResult?.finalist1 && cupResult?.finalist2;
                      const finalists = finalistsKnown ? [cupResult.finalist1, cupResult.finalist2] : [];
                      const bothFinalistsCorrect = finalistsKnown && cp.finalist1 && cp.finalist2 && finalists.includes(cp.finalist1) && finalists.includes(cp.finalist2);
                      let isCorrect, isWrong;
                      if (field === "winner") {
                        isCorrect = hasResult && val === cupResult?.winner;
                        isWrong = hasResult && val && val !== cupResult?.winner;
                      } else {
                        // Finalistlerde tek tek değil, ikisi birden gösterilir sadece finalist2'de
                        if (field === "finalist2" && finalistsKnown && cp.finalist1 && cp.finalist2) {
                          isCorrect = bothFinalistsCorrect;
                          isWrong = !bothFinalistsCorrect;
                        }
                      }
                      return (
                        <div key={field} style={{ marginBottom:10 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:"#94a3b8", marginBottom:4 }}>
                            {label}{field === "finalist2" ? " (ikisi birden = 10p)" : ""}
                            {isCorrect && <span style={{ color:"#4ade80", marginLeft:6 }}>✅</span>}
                            {isWrong && <span style={{ color:"#f87171", marginLeft:6 }}>❌</span>}
                          </div>
                          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                            {ALL_TEAMS.map(t => {
                              const a = val === t;
                              return (
                                <button key={t} disabled={!isMe || hasResult}
                                  onClick={() => saveCupPred(field, t)} style={{
                                  padding:"3px 7px", borderRadius:6, fontSize:12,
                                  cursor:isMe&&!hasResult?"pointer":"default",
                                  opacity:!isMe && !val ? 0.3 : 1,
                                  border:a?`2px solid ${c.bg}`:"1px solid #334155",
                                  background:a?`${c.bg}20`:"transparent",
                                  color:a?c.ring:"#64748b", fontWeight:a?700:400,
                                }}>{FLAGS[t]} {shortName(t)}</button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SCOREBOARD ═══ */}
      {view === "scoreboard" && (
        <div className="px-4">
          {sorted.map((m, i) => {
            const v = scores[m.player_id] || { mc:0, mw:0, mt:0, qc:0, qt:0, pts:0 };
            const c = pc(m.player_id);
            const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`;
            const pct = v.mt > 0 ? Math.round(v.mc / v.mt * 100) : 0;
            return (
              <div key={m.player_id} style={{ marginBottom:10, borderRadius:14, overflow:"hidden", border:`1.5px solid ${i===0?"#c9a84c50":"#1e293b"}`, background:i===0?"linear-gradient(135deg,#1a1500,#111827)":"#111827" }}>
                <div style={{ display:"flex", alignItems:"center", padding:18, gap:16 }}>
                  <div style={{ fontSize:36 }}>{medal}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:18, fontWeight:900, color:c.ring }}>{m.name}</div>
                    <div style={{ fontSize:14, color:"#94a3b8", marginTop:4 }}>
                      Maç: ✅ {v.mc} doğru • ❌ {v.mw} yanlış
                      {v.mt > 0 && <span style={{ color:pct>=50?"#4ade80":"#f87171" }}> • %{pct}</span>}
                    </div>
                    <div style={{ fontSize:14, color:"#94a3b8", marginTop:2 }}>Alt/Üst: 📊 {v.oc}/{v.ot} doğru • Grup: 🏆 {v.qc}/{v.qt} doğru</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:40, fontWeight:900, color:"#fff", lineHeight:1 }}>{v.pts}</div>
                    <div style={{ fontSize:14, color:"#c9a84c", fontWeight:700 }}>{v.mc}×3+{v.oc}×1+{v.qc}×10</div>
                  </div>
                </div>
                <div style={{ height:4, background:"#1e293b" }}>
                  <div style={{ height:4, background:`linear-gradient(90deg,${c.bg},${c.ring})`, width:`${Math.min(v.pts/150*100,100)}%`, borderRadius:2 }}/>
                </div>
              </div>
            );
          })}

          {/* Grup bazlı tablo */}
          <div style={{ marginTop:18, borderRadius:14, overflow:"hidden", border:"1px solid #1e293b", background:"#111827" }}>
            <div style={{ padding:"14px 18px", background:"#0f172a", fontWeight:900, fontSize:15, color:"#c9a84c" }}>GRUP BAZLI DETAY</div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#0f172a" }}>
                    <th style={{ padding:"10px 12px", textAlign:"left", color:"#64748b", fontSize:14 }}>Grup</th>
                    {members.map(m => (
                      <th key={m.player_id} style={{ padding:"10px 8px", textAlign:"center", color:pc(m.player_id).ring, fontWeight:700, fontSize:14, borderLeft:"1px solid #1e293b" }}>{m.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GROUP_KEYS.map(g => {
                    const gs = {};
                    members.forEach(m => { gs[m.player_id] = { c:0, w:0 }; });
                    getMatches(GROUPS[g]).forEach(([t1, t2]) => {
                      const mk2 = matchKey(g, t1, t2);
                      const res = matchResults[mk2]?.result;
                      if (res) members.forEach(m => {
                        const pred = predictions[`${m.player_id}:${mk2}`];
                        if (pred) { if (pred === res) gs[m.player_id].c++; else gs[m.player_id].w++; }
                      });
                    });
                    return (
                      <tr key={g} style={{ borderBottom:"1px solid #1e293b20" }}>
                        <td style={{ padding:"10px 12px", fontWeight:700, color:"#94a3b8", fontSize:14 }}>{GROUPS[g].map(t => FLAGS[t]).join("")} {g}</td>
                        {members.map(m => (
                          <td key={m.player_id} style={{ padding:"10px 8px", textAlign:"center", borderLeft:"1px solid #1e293b", fontSize:14 }}>
                            {gs[m.player_id].c > 0 && <span style={{ color:"#4ade80", fontWeight:700 }}>{gs[m.player_id].c}</span>}
                            {gs[m.player_id].c > 0 && gs[m.player_id].w > 0 && <span style={{ color:"#334155" }}> / </span>}
                            {gs[m.player_id].w > 0 && <span style={{ color:"#f87171", fontWeight:700 }}>{gs[m.player_id].w}</span>}
                            {gs[m.player_id].c === 0 && gs[m.player_id].w === 0 && <span style={{ color:"#334155" }}>—</span>}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop:24, textAlign:"center" }}>
            <div style={{ fontSize:14, color:"#475569", lineHeight:1.7 }}>
              🎯 Maç = <strong style={{ color:"#c9a84c" }}>3 puan</strong> &nbsp; 📊 Alt/Üst = <strong style={{ color:"#c9a84c" }}>1 puan</strong> &nbsp; 🏆 Sıra = <strong style={{ color:"#c9a84c" }}>10 puan</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
