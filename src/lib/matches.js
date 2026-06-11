export const GROUPS = {
  A: ["Meksika", "Güney Kore", "Güney Afrika", "Çekya"],
  B: ["Kanada", "İsviçre", "Katar", "Bosna-Hersek"],
  C: ["Brezilya", "Fas", "İskoçya", "Haiti"],
  D: ["ABD", "Paraguay", "Avustralya", "Türkiye"],
  E: ["Almanya", "Ekvador", "Fildişi Sahili", "Curaçao"],
  F: ["Hollanda", "Japonya", "Tunus", "İsveç"],
  G: ["Belçika", "İran", "Mısır", "Yeni Zelanda"],
  H: ["İspanya", "Uruguay", "Suudi Arabistan", "Yeşil Burun Adaları"],
  I: ["Fransa", "Senegal", "Norveç", "Irak"],
  J: ["Arjantin", "Avusturya", "Cezayir", "Ürdün"],
  K: ["Portekiz", "Kolombiya", "Özbekistan", "DR Kongo"],
  L: ["İngiltere", "Hırvatistan", "Panama", "Gana"],
};

export const FLAGS = {
  Meksika:"🇲🇽","Güney Kore":"🇰🇷","Güney Afrika":"🇿🇦",Çekya:"🇨🇿",
  Kanada:"🇨🇦",İsviçre:"🇨🇭",Katar:"🇶🇦","Bosna-Hersek":"🇧🇦",
  Brezilya:"🇧🇷",Fas:"🇲🇦",İskoçya:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",Haiti:"🇭🇹",
  ABD:"🇺🇸",Paraguay:"🇵🇾",Avustralya:"🇦🇺",Türkiye:"🇹🇷",
  Almanya:"🇩🇪",Ekvador:"🇪🇨","Fildişi Sahili":"🇨🇮",Curaçao:"🇨🇼",
  Hollanda:"🇳🇱",Japonya:"🇯🇵",Tunus:"🇹🇳",İsveç:"🇸🇪",
  Belçika:"🇧🇪",İran:"🇮🇷",Mısır:"🇪🇬","Yeni Zelanda":"🇳🇿",
  İspanya:"🇪🇸",Uruguay:"🇺🇾","Suudi Arabistan":"🇸🇦","Yeşil Burun Adaları":"🇨🇻",
  Fransa:"🇫🇷",Senegal:"🇸🇳",Norveç:"🇳🇴",Irak:"🇮🇶",
  Arjantin:"🇦🇷",Avusturya:"🇦🇹",Cezayir:"🇩🇿",Ürdün:"🇯🇴",
  Portekiz:"🇵🇹",Kolombiya:"🇨🇴",Özbekistan:"🇺🇿","DR Kongo":"🇨🇩",
  İngiltere:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",Hırvatistan:"🇭🇷",Panama:"🇵🇦",Gana:"🇬🇭",
};

// Maç programı: match_key → UTC kickoff time
// Türkiye saati = UTC + 3
export const SCHEDULE = {
  // June 11
  "A:Meksika-Güney Afrika": "2026-06-11T19:00:00Z",
  "A:Güney Kore-Çekya": "2026-06-12T02:00:00Z",
  // June 12
  "B:Kanada-Bosna-Hersek": "2026-06-12T19:00:00Z",
  "D:ABD-Paraguay": "2026-06-13T01:00:00Z",
  // June 13
  "B:İsviçre-Katar": "2026-06-13T19:00:00Z",
  "C:Brezilya-Fas": "2026-06-13T22:00:00Z",
  "C:İskoçya-Haiti": "2026-06-14T01:00:00Z",
  // June 14
  "D:Avustralya-Türkiye": "2026-06-14T04:00:00Z",
  "E:Almanya-Curaçao": "2026-06-14T17:00:00Z",
  "F:Hollanda-Japonya": "2026-06-14T20:00:00Z",
  "E:Ekvador-Fildişi Sahili": "2026-06-14T23:00:00Z",
  "F:Tunus-İsveç": "2026-06-15T02:00:00Z",
  // June 15
  "H:İspanya-Yeşil Burun Adaları": "2026-06-15T16:00:00Z",
  "G:Belçika-Mısır": "2026-06-15T19:00:00Z",
  "H:Uruguay-Suudi Arabistan": "2026-06-15T22:00:00Z",
  "G:İran-Yeni Zelanda": "2026-06-16T01:00:00Z",
  // June 16
  "I:Fransa-Senegal": "2026-06-16T19:00:00Z",
  "I:Norveç-Irak": "2026-06-16T22:00:00Z",
  "J:Arjantin-Cezayir": "2026-06-17T01:00:00Z",
  // June 17
  "J:Avusturya-Ürdün": "2026-06-17T04:00:00Z",
  "K:Portekiz-DR Kongo": "2026-06-17T17:00:00Z",
  "L:İngiltere-Hırvatistan": "2026-06-17T20:00:00Z",
  "L:Panama-Gana": "2026-06-17T23:00:00Z",
  "K:Kolombiya-Özbekistan": "2026-06-18T02:00:00Z",
  // June 18
  "A:Güney Afrika-Çekya": "2026-06-18T16:00:00Z",
  "B:İsviçre-Bosna-Hersek": "2026-06-18T19:00:00Z",
  "B:Kanada-Katar": "2026-06-18T22:00:00Z",
  "A:Meksika-Güney Kore": "2026-06-19T01:00:00Z",
  // June 19
  "D:ABD-Avustralya": "2026-06-19T19:00:00Z",
  "C:Fas-İskoçya": "2026-06-19T22:00:00Z",
  "C:Brezilya-Haiti": "2026-06-20T00:30:00Z",
  "D:Paraguay-Türkiye": "2026-06-20T03:00:00Z",
  // June 20
  "F:Hollanda-İsveç": "2026-06-20T17:00:00Z",
  "E:Almanya-Fildişi Sahili": "2026-06-20T20:00:00Z",
  "E:Ekvador-Curaçao": "2026-06-21T00:00:00Z",
  // June 21
  "F:Japonya-Tunus": "2026-06-21T04:00:00Z",
  "H:İspanya-Suudi Arabistan": "2026-06-21T16:00:00Z",
  "G:Belçika-İran": "2026-06-21T19:00:00Z",
  "H:Uruguay-Yeşil Burun Adaları": "2026-06-21T22:00:00Z",
  "G:Mısır-Yeni Zelanda": "2026-06-22T01:00:00Z",
  // June 22
  "J:Arjantin-Avusturya": "2026-06-22T17:00:00Z",
  "I:Fransa-Irak": "2026-06-22T21:00:00Z",
  "I:Senegal-Norveç": "2026-06-23T00:00:00Z",
  "J:Cezayir-Ürdün": "2026-06-23T03:00:00Z",
  // June 23
  "K:Portekiz-Özbekistan": "2026-06-23T17:00:00Z",
  "L:İngiltere-Gana": "2026-06-23T20:00:00Z",
  "L:Hırvatistan-Panama": "2026-06-23T23:00:00Z",
  "K:Kolombiya-DR Kongo": "2026-06-24T02:00:00Z",
  // June 24
  "B:Kanada-İsviçre": "2026-06-24T19:00:00Z",
  "B:Katar-Bosna-Hersek": "2026-06-24T19:00:00Z",
  "C:Brezilya-İskoçya": "2026-06-24T22:00:00Z",
  "C:Fas-Haiti": "2026-06-24T22:00:00Z",
  "A:Meksika-Çekya": "2026-06-25T01:00:00Z",
  "A:Güney Kore-Güney Afrika": "2026-06-25T01:00:00Z",
  // June 25
  "E:Fildişi Sahili-Curaçao": "2026-06-25T20:00:00Z",
  "E:Almanya-Ekvador": "2026-06-25T20:00:00Z",
  "F:Japonya-İsveç": "2026-06-25T23:00:00Z",
  "F:Hollanda-Tunus": "2026-06-25T23:00:00Z",
  "D:ABD-Türkiye": "2026-06-26T02:00:00Z",
  "D:Paraguay-Avustralya": "2026-06-26T02:00:00Z",
  // June 26
  "I:Fransa-Norveç": "2026-06-26T19:00:00Z",
  "I:Senegal-Irak": "2026-06-26T19:00:00Z",
  "H:Suudi Arabistan-Yeşil Burun Adaları": "2026-06-27T00:00:00Z",
  "H:İspanya-Uruguay": "2026-06-27T00:00:00Z",
  "G:İran-Mısır": "2026-06-27T03:00:00Z",
  "G:Belçika-Yeni Zelanda": "2026-06-27T03:00:00Z",
  // June 27
  "L:İngiltere-Panama": "2026-06-27T21:00:00Z",
  "L:Hırvatistan-Gana": "2026-06-27T21:00:00Z",
  "K:Portekiz-Kolombiya": "2026-06-27T23:30:00Z",
  "K:Özbekistan-DR Kongo": "2026-06-27T23:30:00Z",
  "J:Avusturya-Cezayir": "2026-06-28T02:00:00Z",
  "J:Arjantin-Ürdün": "2026-06-28T02:00:00Z",
};

export function shortName(t) {
  return t.length > 8 ? t.slice(0, 6) + "." : t;
}

export function getMatches(teams) {
  const m = [];
  for (let i = 0; i < teams.length; i++)
    for (let j = i + 1; j < teams.length; j++)
      m.push([teams[i], teams[j]]);
  return m;
}

export function matchKey(group, t1, t2) {
  return `${group}:${t1}-${t2}`;
}

// Maçları kickoff zamanına göre sırala
export function getSortedMatches(group, teams) {
  const matches = getMatches(teams);
  return matches.sort((a, b) => {
    const ka = matchKey(group, a[0], a[1]);
    const kb = matchKey(group, b[0], b[1]);
    const ta = SCHEDULE[ka] || "9999";
    const tb = SCHEDULE[kb] || "9999";
    return ta.localeCompare(tb);
  });
}

export const GROUP_KEYS = Object.keys(GROUPS);

// Türkiye saatini formatla
export function formatTR(utcStr) {
  if (!utcStr) return "";
  const d = new Date(utcStr);
  const tr = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  const day = tr.getUTCDate();
  const months = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  const month = months[tr.getUTCMonth()];
  const h = String(tr.getUTCHours()).padStart(2, "0");
  const m = String(tr.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${h}:${m}`;
}

export function isLocked(utcStr) {
  if (!utcStr) return false;
  return Date.now() >= new Date(utcStr).getTime();
}

// Puan hesaplama
export function calculateScores(members, predictions, qualifyPreds, matchResults, qualifyResults) {
  const scores = {};
  members.forEach(m => {
    scores[m.player_id] = { name: m.name, mc: 0, mw: 0, mt: 0, oc: 0, ow: 0, ot: 0, qc: 0, qt: 0, pts: 0 };
  });

  Object.entries(matchResults).forEach(([key, mr]) => {
    const result = typeof mr === "object" ? mr.result : mr;
    const ouResult = typeof mr === "object" ? mr.ou : null;
    members.forEach(m => {
      const pid = m.player_id;
      // Maç sonucu tahmini (3 puan)
      const pred = predictions[`${pid}:${key}`];
      if (pred) {
        scores[pid].mt++;
        if (pred === result) { scores[pid].mc++; scores[pid].pts += 3; }
        else scores[pid].mw++;
      }
      // Alt/Üst tahmini (1 puan)
      const ouPred = predictions[`ou:${pid}:${key}`];
      if (ouPred && ouResult) {
        scores[pid].ot++;
        if (ouPred === ouResult) { scores[pid].oc++; scores[pid].pts += 1; }
        else scores[pid].ow++;
      }
    });
  });

  Object.entries(qualifyResults).forEach(([group, qr]) => {
    if (qr.first_team && qr.second_team) {
      members.forEach(m => {
        const qp = qualifyPreds[`${m.player_id}:${group}`];
        if (qp) {
          if (qp.first_team) {
            scores[m.player_id].qt++;
            if (qp.first_team === qr.first_team) { scores[m.player_id].qc++; scores[m.player_id].pts += 5; }
          }
          if (qp.second_team) {
            scores[m.player_id].qt++;
            if (qp.second_team === qr.second_team) { scores[m.player_id].qc++; scores[m.player_id].pts += 5; }
          }
        }
      });
    }
  });

  return scores;
}
