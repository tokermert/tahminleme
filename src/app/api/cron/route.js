export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const TEAM_MAP = {
  "Mexico":"Meksika","South Korea":"Güney Kore","South Africa":"Güney Afrika","Czech Republic":"Çekya","Czechia":"Çekya",
  "Canada":"Kanada","Switzerland":"İsviçre","Qatar":"Katar","Bosnia and Herzegovina":"Bosna-Hersek","Bosnia & Herzegovina":"Bosna-Hersek",
  "Brazil":"Brezilya","Morocco":"Fas","Scotland":"İskoçya","Haiti":"Haiti",
  "USA":"ABD","United States":"ABD","Paraguay":"Paraguay","Australia":"Avustralya","Turkey":"Türkiye","Türkiye":"Türkiye",
  "Germany":"Almanya","Ecuador":"Ekvador","Ivory Coast":"Fildişi Sahili","Cote D'Ivoire":"Fildişi Sahili","Curacao":"Curaçao","Curaçao":"Curaçao",
  "Netherlands":"Hollanda","Japan":"Japonya","Tunisia":"Tunus","Sweden":"İsveç",
  "Belgium":"Belçika","Iran":"İran","Egypt":"Mısır","New Zealand":"Yeni Zelanda",
  "Spain":"İspanya","Uruguay":"Uruguay","Saudi Arabia":"Suudi Arabistan","Cape Verde":"Yeşil Burun Adaları","Cabo Verde":"Yeşil Burun Adaları",
  "France":"Fransa","Senegal":"Senegal","Norway":"Norveç","Iraq":"Irak",
  "Argentina":"Arjantin","Austria":"Avusturya","Algeria":"Cezayir","Jordan":"Ürdün",
  "Portugal":"Portekiz","Colombia":"Kolombiya","Uzbekistan":"Özbekistan","DR Congo":"DR Kongo","Congo DR":"DR Kongo",
  "England":"İngiltere","Croatia":"Hırvatistan","Panama":"Panama","Ghana":"Gana",
};

const GROUPS = {
  A:["Meksika","Güney Kore","Güney Afrika","Çekya"],
  B:["Kanada","İsviçre","Katar","Bosna-Hersek"],
  C:["Brezilya","Fas","İskoçya","Haiti"],
  D:["ABD","Paraguay","Avustralya","Türkiye"],
  E:["Almanya","Ekvador","Fildişi Sahili","Curaçao"],
  F:["Hollanda","Japonya","Tunus","İsveç"],
  G:["Belçika","İran","Mısır","Yeni Zelanda"],
  H:["İspanya","Uruguay","Suudi Arabistan","Yeşil Burun Adaları"],
  I:["Fransa","Senegal","Norveç","Irak"],
  J:["Arjantin","Avusturya","Cezayir","Ürdün"],
  K:["Portekiz","Kolombiya","Özbekistan","DR Kongo"],
  L:["İngiltere","Hırvatistan","Panama","Gana"],
};

function makeMatchKey(team1TR, team2TR) {
  for (const [group, teams] of Object.entries(GROUPS)) {
    const i1 = teams.indexOf(team1TR);
    const i2 = teams.indexOf(team2TR);
    if (i1 >= 0 && i2 >= 0) {
      const [first, second] = i1 < i2 ? [team1TR, team2TR] : [team2TR, team1TR];
      return `${group}:${first}-${second}`;
    }
  }
  return null;
}

export async function GET(request) {
  const apiKey = process.env.FOOTBALL_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return Response.json({ error: "Supabase not configured" }, { status: 500 });
  if (!apiKey) return Response.json({ error: "No API key" }, { status: 500 });

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const res = await fetch("https://v3.football.api-sports.io/fixtures?league=1&season=2026", {
      headers: { "x-apisports-key": apiKey },
    });
    const data = await res.json();
    const fixtures = data.response || [];
    let updated = 0;

    for (const fix of fixtures) {
      const status = fix.fixture?.status?.short;
      if (!["FT","AET","PEN"].includes(status)) continue;

      const homeEN = fix.teams?.home?.name;
      const awayEN = fix.teams?.away?.name;
      const homeGoals = fix.goals?.home;
      const awayGoals = fix.goals?.away;
      if (homeGoals == null || awayGoals == null) continue;

      const homeTR = TEAM_MAP[homeEN];
      const awayTR = TEAM_MAP[awayEN];
      if (!homeTR || !awayTR) continue;

      const mk = makeMatchKey(homeTR, awayTR);
      if (!mk) continue;

      const [, teams] = mk.split(":");
      const [team1] = teams.split("-");
      let result;
      if (homeGoals > awayGoals) result = homeTR === team1 ? "1" : "2";
      else if (awayGoals > homeGoals) result = awayTR === team1 ? "1" : "2";
      else result = "X";

      const ou = (homeGoals + awayGoals) >= 3 ? "ust" : "alt";

      const { error } = await supabase.from("match_results").upsert(
        { match_key: mk, result, ou, updated_at: new Date().toISOString() },
        { onConflict: "match_key" }
      );
      if (!error) updated++;
    }

    return Response.json({ ok: true, checked: fixtures.length, updated, time: new Date().toISOString() });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
