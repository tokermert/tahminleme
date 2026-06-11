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

export const GROUP_KEYS = Object.keys(GROUPS);

// Puan hesaplama
export function calculateScores(members, predictions, qualifyPreds, matchResults, qualifyResults) {
  const scores = {};
  members.forEach(m => {
    scores[m.player_id] = { name: m.name, mc: 0, mw: 0, mt: 0, qc: 0, qt: 0, pts: 0 };
  });

  // Maç puanları
  Object.entries(matchResults).forEach(([key, result]) => {
    members.forEach(m => {
      const pred = predictions[`${m.player_id}:${key}`];
      if (pred) {
        scores[m.player_id].mt++;
        if (pred === result) {
          scores[m.player_id].mc++;
          scores[m.player_id].pts += 3;
        } else {
          scores[m.player_id].mw++;
        }
      }
    });
  });

  // Grup sıralaması puanları
  Object.entries(qualifyResults).forEach(([group, qr]) => {
    if (qr.first_team && qr.second_team) {
      members.forEach(m => {
        const qp = qualifyPreds[`${m.player_id}:${group}`];
        if (qp) {
          if (qp.first_team) {
            scores[m.player_id].qt++;
            if (qp.first_team === qr.first_team) {
              scores[m.player_id].qc++;
              scores[m.player_id].pts += 5;
            }
          }
          if (qp.second_team) {
            scores[m.player_id].qt++;
            if (qp.second_team === qr.second_team) {
              scores[m.player_id].qc++;
              scores[m.player_id].pts += 5;
            }
          }
        }
      });
    }
  });

  return scores;
}
