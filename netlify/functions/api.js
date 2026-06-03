const XLSX = require("xlsx");

const CACHE_TTL_MS = 5 * 60 * 1000;

const WORKBOOK_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJT6jqlHH3w_wK8dAr3T0zEUKCknrquctgJISXRv0U6d9OeJEDmRZdA-DfEzjhQlZVMpGD8XpBL5hU/pub?output=xlsx";

/** api key -> workbook tab name candidates (first match wins) */
const SHEET_TABS = {
  tokenCohort: ["Uni Program Token Cohort"],
  tokenMonthly: ["Uni Program Token Month"],
  fpCohort: ["Uni Program Full Payment Cohort"],
  fpMonthly: ["Uni Program Full Payment Month"],
  tlTokenCohort: ["TL Wise Cohort Token"],
  tlTokenMonthly: ["TL Wise Monthly Token"],
  tlFpCohort: ["TL Wise Cohort Full"],
  tlFpMonthly: ["TL Wise Monthy Full"],
  gmTokenCohort: ["GM Wise Cohort Token"],
  gmTokenMonthly: ["GM Wise Monthly Token"],
  gmFpCohort: ["GM Wise Cohort Full"],
  gmFpMonthly: ["GM Wise Monthy Full"],
  bdaTokenCohort: ["BDA Wise Cohort Token"],
  bdaTokenMonthly: ["BDA Wise Monthly Token"],
  bdaFpCohort: ["BDA Wise Cohort Full"],
  bdaFpMonthly: ["BDA Wise Monthy Full"],
};

let workbookCache = null;
let workbookCacheAt = 0;
const rowsCache = new Map();

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

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function resolveSheetName(workbook, candidates) {
  const names = workbook.SheetNames || [];
  const normalized = new Map(names.map((n) => [normalizeName(n), n]));
  for (const candidate of candidates) {
    const exact = normalized.get(normalizeName(candidate));
    if (exact) return exact;
  }
  for (const candidate of candidates) {
    const needle = normalizeName(candidate);
    const fuzzy = names.find(
      (n) => normalizeName(n).startsWith(needle) || needle.startsWith(normalizeName(n))
    );
    if (fuzzy) return fuzzy;
  }
  return null;
}

function clearWorkbookCache() {
  workbookCache = null;
  workbookCacheAt = 0;
  rowsCache.clear();
}

async function loadWorkbook(forceRefresh = false) {
  const now = Date.now();
  if (forceRefresh) clearWorkbookCache();
  if (workbookCache && now - workbookCacheAt < CACHE_TTL_MS) return workbookCache;

  const res = await fetch(WORKBOOK_URL, {
    headers: { "User-Agent": "NetlifyFunction/1.0" },
  });
  if (!res.ok) throw new Error(`Workbook fetch failed: ${res.status}`);

  const buffer = await res.arrayBuffer();
  workbookCache = XLSX.read(buffer, { type: "array" });
  workbookCacheAt = now;
  rowsCache.clear();
  return workbookCache;
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

function sheetToCsv(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Tab not found: ${sheetName}`);
  return XLSX.utils.sheet_to_csv(sheet);
}

async function fetchSheet(key) {
  const now = Date.now();
  const cached = rowsCache.get(key);
  if (cached && now - cached.ts < CACHE_TTL_MS) return cached.rows;

  const candidates = SHEET_TABS[key];
  if (!candidates) throw new Error(`Unknown dataset: ${key}`);

  const workbook = await loadWorkbook(false);
  const tabName = resolveSheetName(workbook, candidates);
  if (!tabName) throw new Error(`Workbook tab not found for ${key}`);

  const rows = parseCsv(sheetToCsv(workbook, tabName));
  rowsCache.set(key, { ts: now, rows });
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

  const programs = [...new Set(tokenCohort.map((r) => (r["Program Name"] || "").trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })
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
      clearWorkbookCache();
      return response(200, { status: "ok", message: "Cache cleared" });
    }

    return response(404, { error: `Unknown endpoint: /api/${route}` });
  } catch (err) {
    return response(502, { error: err.message || "Unexpected error" });
  }
};
