const CACHE_TTL_MS = 5 * 60 * 1000;

const SHEETS = {
  tokenCohort:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=262950175&single=true&output=csv",
  tokenMonthly:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=654588083&single=true&output=csv",
  fpCohort:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=1691431588&single=true&output=csv",
  fpMonthly:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=1412605711&single=true&output=csv",
  tlTokenCohort:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=1306601082&single=true&output=csv",
  tlTokenMonthly:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=86980914&single=true&output=csv",
  tlFpCohort:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=1400812786&single=true&output=csv",
  tlFpMonthly:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=748961899&single=true&output=csv",
  gmTokenCohort:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=267153274&single=true&output=csv",
  gmTokenMonthly:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=100212730&single=true&output=csv",
  gmFpCohort:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=1622927752&single=true&output=csv",
  gmFpMonthly:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=1051256120&single=true&output=csv",
  bdaTokenCohort:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=312446060&single=true&output=csv",
  bdaTokenMonthly:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=454256125&single=true&output=csv",
  bdaFpCohort:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=1252658296&single=true&output=csv",
  bdaFpMonthly:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTcztb-A37i4VXvWKnATdaFrGPZGf5tQlsYIDgdb7CViBh_TpL0kdst-OVwlEBxISLK1fHob_G86ffr/pub?gid=1981205156&single=true&output=csv",
};

const cache = new Map();

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(body),
  };
}

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}

function parseCsv(text) {
  const cleanedText = (text || "").replace(/^\uFEFF/, "");
  const lines = cleanedText.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      const val = (cols[idx] || "").trim();
      if (!(header in row)) row[header] = val;
    });
    if (Object.values(row).some(Boolean)) rows.push(row);
  }
  return rows;
}

async function fetchSheet(key) {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.ts < CACHE_TTL_MS) return cached.rows;

  const url = SHEETS[key];
  if (!url) throw new Error(`Unknown dataset: ${key}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${key}: ${res.status}`);
  const rows = parseCsv(await res.text());
  cache.set(key, { ts: now, rows });
  return rows;
}

async function loadDashboard() {
  const [
    tokenCohort,
    tokenMonthly,
    fpCohort,
    fpMonthly,
    tlTokenCohort,
    tlTokenMonthly,
    tlFpCohort,
    tlFpMonthly,
    gmTokenCohort,
    gmTokenMonthly,
    gmFpCohort,
    gmFpMonthly,
    bdaTokenCohort,
    bdaTokenMonthly,
    bdaFpCohort,
    bdaFpMonthly,
  ] = await Promise.all([
    fetchSheet("tokenCohort"),
    fetchSheet("tokenMonthly"),
    fetchSheet("fpCohort"),
    fetchSheet("fpMonthly"),
    fetchSheet("tlTokenCohort"),
    fetchSheet("tlTokenMonthly"),
    fetchSheet("tlFpCohort"),
    fetchSheet("tlFpMonthly"),
    fetchSheet("gmTokenCohort"),
    fetchSheet("gmTokenMonthly"),
    fetchSheet("gmFpCohort"),
    fetchSheet("gmFpMonthly"),
    fetchSheet("bdaTokenCohort"),
    fetchSheet("bdaTokenMonthly"),
    fetchSheet("bdaFpCohort"),
    fetchSheet("bdaFpMonthly"),
  ]);

  const programs = [...new Set(tokenCohort.map((r) => (r["Program Name"] || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  return {
    programs,
    tokenCohort,
    tokenMonthly,
    fpCohort,
    fpMonthly,
    tlTokenCohort,
    tlTokenMonthly,
    tlFpCohort,
    tlFpMonthly,
    gmTokenCohort,
    gmTokenMonthly,
    gmFpCohort,
    gmFpMonthly,
    bdaTokenCohort,
    bdaTokenMonthly,
    bdaFpCohort,
    bdaFpMonthly,
    fetchedAt: Date.now() / 1000,
  };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return response(200, { ok: true });

    const routeRaw = event.queryStringParameters?.route || "";
    const route = routeRaw.replace(/^\/+|\/+$/g, "");

    if (!route || route === "dashboard") {
      const payload = await loadDashboard();
      return response(200, payload);
    }

    if (route === "health") {
      return response(200, { status: "ok", cache_ttl_seconds: CACHE_TTL_MS / 1000 });
    }

    if (route === "refresh") {
      cache.clear();
      return response(200, { status: "ok", message: "Cache cleared" });
    }

    return response(404, { error: `Unknown endpoint: /api/${route}` });
  } catch (err) {
    return response(502, { error: err.message || "Unexpected error" });
  }
};

