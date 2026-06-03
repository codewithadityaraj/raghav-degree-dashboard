/* ══════════════════════════════════════════════════
   UNI PROGRAM DASHBOARD — app.js
   Dynamic data from Google Sheets via local Python API
   ══════════════════════════════════════════════════ */

'use strict';

const API_BASE = '';

const SECTION_CONFIG = {
  tc: { dataset: 'tokenCohort', dimField: 'cohort', dimColumn: 'Cohort Name', selectId: 'select-sec-tc-cohort', allLabel: 'All Cohorts', perHeadField: 'Cohort Per Head Token', teamSizeField: 'Cohort Team Size', fields: { cohortTarget: 'Cohort Token Target', cohortAch: 'Cohort Token Achieved', achPct: 'Cohort Token Achievement %', revTarget: 'Cohort Token Revenue Target', revAch: 'Cohort Token Revenue Achieved', revPct: 'Cohort Token Revenue Achievement %' } },
  tm: { dataset: 'tokenMonthly', dimField: 'month', dimColumn: 'Month', selectId: 'select-sec-tm-month', allLabel: 'All Months', perHeadField: 'Month Per Head Token', teamSizeField: 'Month Team Size', fields: { cohortTarget: 'Month Token Target', cohortAch: 'Month Token Achieved', achPct: 'Month Token Achievement %', revTarget: 'Month Token Target Revenue', revAch: 'Month Token Revenue Achievement', revPct: 'Month Token Revenue Achievement %' } },
  fc: { dataset: 'fpCohort', dimField: 'cohort', dimColumn: 'Cohort Name', selectId: 'select-sec-fc-cohort', allLabel: 'All Cohorts', fields: { cohortTarget: 'Cohort Enrollment Target', cohortAch: 'Cohort Enrollment Acheived', achPct: 'Cohort Enrollment Acheivement %', revTarget: 'Cohort Enrollment Revenue Target', revAch: 'Cohort Enrollment Revenue Acheived', revPct: 'Cohort Enrollment Revenue Acheivement %' } },
  fm: { dataset: 'fpMonthly', dimField: 'month', dimColumn: 'Month', selectId: 'select-sec-fm-month', allLabel: 'All Months', fields: { cohortTarget: 'Month Enrollment Target', cohortAch: 'Month Enrollment Acheived', achPct: 'Month Enrollment Acheivement %', revTarget: 'Month Enrollment Revenue Target', revAch: 'Month Enrollment Revenue Acheived', revPct: 'Month Enrollment Revenue Acheivement %' } },
};

const LEADER_CONFIG = {
  'tl-tc': { dataset: 'tlTokenCohort', dimColumn: 'Cohort Name', dimState: 'cohort', target: 'TL Cohort Token Target', ach: 'TL Cohort Token Achievement', pct: 'TL Cohort Token Achievement %', color: 'color-token-cohort' },
  'tl-tm': { dataset: 'tlTokenMonthly', dimColumn: 'Month', dimState: 'month', target: 'TL Month Token Target', ach: 'TL Month Token Achievement', pct: 'TL Month Token Achievement %', color: 'color-token-monthly' },
  'tl-fc': { dataset: 'tlFpCohort', dimColumn: 'Cohort Name', dimState: 'cohort', target: 'Cohort Full Payment Target', ach: 'Cohort Full Payment Achieved', pct: 'Cohort Full Payment Achievement %', color: 'color-fp-cohort' },
  'tl-fm': { dataset: 'tlFpMonthly', dimColumn: 'Month', dimState: 'month', target: 'Month Full Payment Target', ach: 'Month Full Payment Achieved', pct: 'Month Full Payment Achievement %', color: 'color-fp-monthly' },
  'gm-tc': { dataset: 'gmTokenCohort', dimColumn: 'Cohort Name', dimState: 'cohort', target: 'GM Cohort Token Target', ach: 'GM Cohort Token Achievement', pct: 'GM Cohort Token Achievement %', color: 'color-token-cohort', nameColumns: ['GM NAME', 'GM Name'] },
  'gm-tm': { dataset: 'gmTokenMonthly', dimColumn: 'Month', dimState: 'month', target: 'GM Month Token Target', ach: 'GM Month Token Achievement', pct: 'GM Month Token Achievement %', color: 'color-token-monthly', nameColumns: ['GM NAME', 'GM Name'] },
  'gm-fc': { dataset: 'gmFpCohort', dimColumn: 'Cohort Name', dimState: 'cohort', target: 'GM Cohort Full Payment Target', ach: 'GM Cohort Full Payment Achieved', pct: 'GM Cohort Full Payment Achievement %', color: 'color-fp-cohort', nameColumns: ['GM NAME', 'GM Name'] },
  'gm-fm': { dataset: 'gmFpMonthly', dimColumn: 'Month', dimState: 'month', target: 'GM Month Full Payment Target', ach: 'GM Month Full Payment Achieved', pct: 'GM Month Full Payment Achievement %', color: 'color-fp-monthly', nameColumns: ['GM NAME', 'GM Name'] },
  'bda-tc': { dataset: 'bdaTokenCohort', dimColumn: 'Cohort Name', dimState: 'cohort', target: 'BDA Cohort Token Target', ach: 'BDA Cohort Token Achievement', pct: 'BDA Cohort Token Achievement %', color: 'color-token-cohort', nameColumns: ['BD MAIL', 'BDA MAIL', 'BD Mail'] },
  'bda-tm': { dataset: 'bdaTokenMonthly', dimColumn: 'Month', dimState: 'month', target: 'BDA Month Token Target', ach: 'BDA Month Token Achievement', pct: 'BDA Month Token Achievement %', color: 'color-token-monthly', nameColumns: ['BD MAIL', 'BDA MAIL', 'BD Mail'] },
  'bda-fc': { dataset: 'bdaFpCohort', dimColumn: 'Cohort Name', dimState: 'cohort', target: 'BDA Cohort Full Payment Target', ach: 'BDA Cohort Full Payment Achieved', pct: 'BDA Cohort Full Payment Achievement %', color: 'color-fp-cohort', nameColumns: ['BD MAIL', 'BDA MAIL', 'BD Mail'] },
  'bda-fm': { dataset: 'bdaFpMonthly', dimColumn: 'Month', dimState: 'month', target: 'BDA Month Full Payment Target', ach: 'BDA Month Full Payment Achieved', pct: 'BDA Month Full Payment Achievement %', color: 'color-fp-monthly', nameColumns: ['BD MAIL', 'BDA MAIL', 'BD Mail'] },
};

const LEADER_CHART_KEYS = [
  'tl-tc', 'tl-tm', 'tl-fc', 'tl-fm',
  'gm-tc', 'gm-tm', 'gm-fc', 'gm-fm',
  'bda-tc', 'bda-tm', 'bda-fc', 'bda-fm',
];

let sheetData = {
  tokenCohort: [], tokenMonthly: [], fpCohort: [], fpMonthly: [],
  tlTokenCohort: [], tlTokenMonthly: [], tlFpCohort: [], tlFpMonthly: [],
  gmTokenCohort: [], gmTokenMonthly: [], gmFpCohort: [], gmFpMonthly: [],
  bdaTokenCohort: [], bdaTokenMonthly: [], bdaFpCohort: [], bdaFpMonthly: [],
  programs: [],
};
let activeProgram = 'ALL';
let dataReady = false;

const sectionCohortFilters = { tc: 'ALL', fc: 'ALL' };
const sectionMonthFilters = { tm: 'ALL', fm: 'ALL' };
const leaderFilters = Object.fromEntries(LEADER_CHART_KEYS.map((k) => [k, 'ALL']));
const leaderCohortFilters = Object.fromEntries(LEADER_CHART_KEYS.filter((k) => k.endsWith('-tc') || k.endsWith('-fc')).map((k) => [k, 'ALL']));
const leaderMonthFilters = Object.fromEntries(LEADER_CHART_KEYS.filter((k) => k.endsWith('-tm') || k.endsWith('-fm')).map((k) => [k, 'ALL']));
const leaderSorts = {
  'tl-tc': 'pct-desc', 'tl-tm': 'pct-desc', 'tl-fc': 'ach-desc', 'tl-fm': 'ach-desc',
  'gm-tc': 'pct-desc', 'gm-tm': 'pct-desc', 'gm-fc': 'ach-desc', 'gm-fm': 'ach-desc',
  'bda-tc': 'pct-desc', 'bda-tm': 'pct-desc', 'bda-fc': 'ach-desc', 'bda-fm': 'ach-desc',
};

function displayRaw(v) { if (v == null) return '—'; const s = String(v).trim(); return s || '—'; }
function fmtNumExact(n) { if (n == null || Number.isNaN(n)) return '—'; if (Number.isInteger(n)) return n.toLocaleString('en-IN'); return n.toLocaleString('en-IN', { maximumFractionDigits: 20 }); }
function formatPerHead(val) {
  const n = parseNum(val);
  if (!Number.isFinite(n)) return displayRaw(val);
  return n.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
function formatPctRounded(pctNum, decimals) {
  if (pctNum == null || !Number.isFinite(pctNum)) return '—';
  return pctNum.toFixed(decimals) + '%';
}
function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
function progressColor(p) { if (p >= 90) return 'accent-green'; if (p >= 70) return 'accent-amber'; return 'accent-red'; }
function trendClass(v) { return v >= 0 ? 'up' : 'down'; }
function trendLabel(v) { return (v >= 0 ? '↑' : '↓') + ' ' + Math.abs(v).toFixed(1) + '%'; }
function parseNum(val) { if (val == null || val === '') return 0; const cleaned = String(val).replace(/[%,₹,\s]/g, '').replace(/[^\d.-]/g, ''); const n = parseFloat(cleaned); return Number.isFinite(n) ? n : 0; }
function parsePct(val) { if (val == null || val === '') return null; const s = String(val).trim(); if (s.endsWith('%')) return parseFloat(s.replace('%', '')) || 0; const n = parseFloat(s); return Number.isFinite(n) ? n : null; }
function rowProgram(row) { return (row['Program Name'] || '').trim(); }
function rowDim(row, dimColumn) { return (row[dimColumn] || '').trim(); }
function rowTl(row) { return (row['TL NAME'] || '').trim(); }
function rowLeader(row, cfg) {
  const cols = (cfg && cfg.nameColumns) || ['TL NAME'];
  for (const col of cols) {
    const val = (row[col] || '').trim();
    if (val) return val;
  }
  return '';
}
function leaderAllLabel(chartKey, kind) {
  if (kind === 'person') return chartKey.startsWith('bda-') ? 'All BDAs' : chartKey.startsWith('gm-') ? 'All GMs' : 'All TLs';
  if (kind === 'cohort') return 'All Cohorts';
  return 'All Months';
}
function uniqueSorted(values) { return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: 'base' })); }
function escapeHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function setLoading(loading) { document.body.classList.toggle('is-loading', loading); }

function fmtCroreExact(val) {
  if (val == null) return '—';
  const raw = String(val).trim();
  if (!raw) return '—';
  const cleaned = raw.replace(/[%,₹,\s]/g, '').replace(/[^\d.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return '—';
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num)) return '—';
  return '₹' + (num / 10000000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'Cr';
}

async function fetchDashboard(forceRefresh) {
  if (forceRefresh) await fetch(`${API_BASE}/api/refresh`, { method: 'POST' });
  const res = await fetch(`${API_BASE}/api/dashboard`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

function getDatasetRows(datasetKey) { return sheetData[datasetKey] || []; }
function filterRowsByProgram(rows) {
  if (!activeProgram || activeProgram === 'ALL') return rows;
  return rows.filter((r) => rowProgram(r) === activeProgram);
}

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function setProgress(id, pctVal, colorClass) { const el = document.getElementById(id); if (!el) return; el.style.width = clamp(pctVal, 0, 100) + '%'; el.className = `card-progress-fill ${colorClass}`; }
function setTrend(id, val) { const el = document.getElementById(id); if (!el) return; el.className = `trend-badge ${trendClass(val)}`; el.textContent = trendLabel(val); }

function populateSelect(selectId, values, allLabel) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const current = select.value;
  select.innerHTML = ['<option value="ALL">' + allLabel + '</option>'].concat(values.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`)).join('');
  if (current === 'ALL' || values.includes(current)) select.value = current;
  else select.value = 'ALL';
}

function getFilteredSectionRows(prefix) {
  const config = SECTION_CONFIG[prefix];
  let rows = filterRowsByProgram(getDatasetRows(config.dataset));
  const dimFilter = config.dimField === 'cohort' ? sectionCohortFilters[prefix] : sectionMonthFilters[prefix];
  if (dimFilter !== 'ALL') rows = rows.filter((r) => rowDim(r, config.dimColumn) === dimFilter);
  return rows;
}

/** Single program: max headcount across rows. All programs: max per program, then sum those maxes. */
function computeAggregateTeamSize(rows, teamSizeField) {
  if (!rows.length) return 0;

  if (activeProgram !== 'ALL') {
    const sizes = rows.map((row) => parseNum(row[teamSizeField])).filter((n) => Number.isFinite(n));
    return sizes.length ? Math.max(...sizes) : 0;
  }

  const maxByProgram = {};
  rows.forEach((row) => {
    const program = rowProgram(row);
    if (!program) return;
    const size = parseNum(row[teamSizeField]);
    if (!Number.isFinite(size)) return;
    if (maxByProgram[program] == null || size > maxByProgram[program]) {
      maxByProgram[program] = size;
    }
  });

  return Object.values(maxByProgram).reduce((acc, n) => acc + n, 0);
}

function aggregateRows(rows, fields) {
  let cohortTarget = 0; let cohortAch = 0; let revTarget = 0; let revAch = 0;
  rows.forEach((row) => { cohortTarget += parseNum(row[fields.cohortTarget]); cohortAch += parseNum(row[fields.cohortAch]); revTarget += parseNum(row[fields.revTarget]); revAch += parseNum(row[fields.revAch]); });
  const achPctNum = cohortTarget ? (cohortAch / cohortTarget) * 100 : 0;
  const revPctNum = revTarget ? (revAch / revTarget) * 100 : 0;
  return { cohortTarget: fmtNumExact(cohortTarget), cohortAch: fmtNumExact(cohortAch), achPct: fmtNumExact(achPctNum) + '%', revTarget: fmtCroreExact(revTarget), revAch: fmtCroreExact(revAch), revPct: fmtNumExact(revPctNum) + '%', achPctNum, revPctNum };
}

function metricsFromSingleRow(row, fields) {
  const achPctNum = parsePct(row[fields.achPct]);
  const revPctNum = parsePct(row[fields.revPct]);
  return { cohortTarget: displayRaw(row[fields.cohortTarget]), cohortAch: displayRaw(row[fields.cohortAch]), achPct: displayRaw(row[fields.achPct]), revTarget: fmtCroreExact(row[fields.revTarget]), revAch: fmtCroreExact(row[fields.revAch]), revPct: displayRaw(row[fields.revPct]), achPctNum: achPctNum != null ? achPctNum : 0, revPctNum: revPctNum != null ? revPctNum : 0 };
}

function renderCardsSection(prefix) {
  if (!dataReady) return;
  const config = SECTION_CONFIG[prefix];
  const rows = getFilteredSectionRows(prefix);

  // Sections tc and tm now have a reduced 3-card layout
  const isTokenSection = prefix === 'tc' || prefix === 'tm';

  if (!rows.length) {
    if (isTokenSection) {
      setText(`card-${prefix}-ach`, '—'); setText(`card-${prefix}-revach`, '—');
      setText(`card-${prefix}-avgtoken`, '—'); setText(`card-${prefix}-teamsize`, '—');
      setTrend(`trend-${prefix}-ach`, 0); setTrend(`trend-${prefix}-rev`, 0);
      setProgress(`prog-${prefix}-ach`, 0, 'accent-red'); setProgress(`prog-${prefix}-rev`, 0, 'accent-red');
    } else {
      ['tgt', 'ach', 'pct', 'revtgt', 'revach', 'revpct'].forEach((k) => setText(`card-${prefix}-${k}`, '—'));
      setTrend(`trend-${prefix}-ach`, 0); setTrend(`trend-${prefix}-rev`, 0);
      setProgress(`prog-${prefix}-ach`, 0, 'accent-red'); setProgress(`prog-${prefix}-pct`, 0, 'accent-red'); setProgress(`prog-${prefix}-rev`, 0, 'accent-red'); setProgress(`prog-${prefix}-revpct`, 0, 'accent-red');
    }
    return;
  }
  const metrics = rows.length === 1 ? metricsFromSingleRow(rows[0], config.fields) : aggregateRows(rows, config.fields);

  if (isTokenSection) {
    const perHeadField = config.perHeadField;
    const teamSizeField = config.teamSizeField;

    let perHeadValue = '—';
    if (rows.length === 1) {
      perHeadValue = formatPerHead(rows[0][perHeadField]);
    } else {
      const validPerHeadNums = rows
        .map((row) => parseNum(row[perHeadField]))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (validPerHeadNums.length) {
        const perHeadAvg = validPerHeadNums.reduce((acc, n) => acc + n, 0) / validPerHeadNums.length;
        perHeadValue = formatPerHead(perHeadAvg);
      }
    }

    const teamSize = computeAggregateTeamSize(rows, teamSizeField);

    setText(`card-${prefix}-ach`, metrics.cohortAch);
    setText(`card-${prefix}-revach`, metrics.revAch);
    setText(`card-${prefix}-avgtoken`, perHeadValue);
    setText(`card-${prefix}-teamsize`, teamSize > 0 ? fmtNumExact(teamSize) : '—');
    setTrend(`trend-${prefix}-ach`, metrics.achPctNum - 75); setTrend(`trend-${prefix}-rev`, metrics.revPctNum - 70);
    setProgress(`prog-${prefix}-ach`, metrics.achPctNum, progressColor(metrics.achPctNum));
    setProgress(`prog-${prefix}-rev`, metrics.revPctNum, progressColor(metrics.revPctNum));
  } else {
    setText(`card-${prefix}-tgt`, metrics.cohortTarget);
    setText(`card-${prefix}-ach`, metrics.cohortAch);
    setText(`card-${prefix}-pct`, formatPctRounded(metrics.achPctNum, 2));
    setText(`card-${prefix}-revtgt`, metrics.revTarget);
    setText(`card-${prefix}-revach`, metrics.revAch);
    setText(`card-${prefix}-revpct`, formatPctRounded(metrics.revPctNum, 2));
    setTrend(`trend-${prefix}-ach`, metrics.achPctNum - 75); setTrend(`trend-${prefix}-rev`, metrics.revPctNum - 70);
    setProgress(`prog-${prefix}-ach`, metrics.achPctNum, progressColor(metrics.achPctNum)); setProgress(`prog-${prefix}-pct`, metrics.achPctNum, progressColor(metrics.achPctNum)); setProgress(`prog-${prefix}-rev`, metrics.revPctNum, progressColor(metrics.revPctNum)); setProgress(`prog-${prefix}-revpct`, metrics.revPctNum, progressColor(metrics.revPctNum));
  }
}

function getLeaderBaseRows(chartKey) {
  const cfg = LEADER_CONFIG[chartKey];
  if (!cfg) return [];
  let rows = filterRowsByProgram(getDatasetRows(cfg.dataset)).filter((r) => rowLeader(r, cfg));
  const dimFilter = cfg.dimState === 'cohort' ? leaderCohortFilters[chartKey] : leaderMonthFilters[chartKey];
  if (dimFilter && dimFilter !== 'ALL') rows = rows.filter((r) => rowDim(r, cfg.dimColumn) === dimFilter);
  return rows;
}

function syncLeaderDropdowns(chartKey) {
  const cfg = LEADER_CONFIG[chartKey];
  if (!cfg) return;
  const allProgramRows = filterRowsByProgram(getDatasetRows(cfg.dataset)).filter((r) => rowLeader(r, cfg));
  const dimValues = uniqueSorted(allProgramRows.map((r) => rowDim(r, cfg.dimColumn)));
  if (cfg.dimState === 'cohort') {
    populateSelect(`select-${chartKey}-cohort`, dimValues, leaderAllLabel(chartKey, 'cohort'));
    leaderCohortFilters[chartKey] = document.getElementById(`select-${chartKey}-cohort`).value || 'ALL';
  } else {
    populateSelect(`select-${chartKey}-month`, dimValues, leaderAllLabel(chartKey, 'month'));
    leaderMonthFilters[chartKey] = document.getElementById(`select-${chartKey}-month`).value || 'ALL';
  }
  const filteredRows = getLeaderBaseRows(chartKey);
  const leaderValues = uniqueSorted(filteredRows.map((r) => rowLeader(r, cfg)));
  populateSelect(`select-${chartKey}`, leaderValues, leaderAllLabel(chartKey, 'person'));
  leaderFilters[chartKey] = document.getElementById(`select-${chartKey}`).value;
}

function buildLeaderListItems(rows, cfg, chartKey) {
  if (chartKey.startsWith('bda-')) {
    return rows.map((r) => {
      const pctFromSheet = parsePct(r[cfg.pct]);
      const target = parseNum(r[cfg.target]);
      const ach = parseNum(r[cfg.ach]);
      const pctNum = pctFromSheet != null ? pctFromSheet : (target ? (ach / target) * 100 : 0);
      return {
        name: rowLeader(r, cfg),
        target,
        ach,
        targetText: displayRaw(r[cfg.target]),
        achText: displayRaw(r[cfg.ach]),
        pctText: displayRaw(r[cfg.pct]) !== '—' ? displayRaw(r[cfg.pct]) : formatPctRounded(pctNum, 2),
        pctNum,
      };
    });
  }

  const map = {};
  rows.forEach((r) => {
    const name = rowLeader(r, cfg);
    if (!map[name]) map[name] = { name, target: 0, ach: 0, rowCount: 0, sheetPct: null };
    map[name].target += parseNum(r[cfg.target]);
    map[name].ach += parseNum(r[cfg.ach]);
    map[name].rowCount += 1;
    if (map[name].rowCount === 1) map[name].sheetPct = r[cfg.pct];
  });

  return Object.values(map).map((x) => {
    const pctNum = x.target ? (x.ach / x.target) * 100 : 0;
    const pctText =
      x.rowCount === 1 && displayRaw(x.sheetPct) !== '—' ? displayRaw(x.sheetPct) : formatPctRounded(pctNum, 2);
    return {
      name: x.name,
      target: x.target,
      ach: x.ach,
      targetText: fmtNumExact(x.target),
      achText: fmtNumExact(x.ach),
      pctText,
      pctNum: x.rowCount === 1 && parsePct(x.sheetPct) != null ? parsePct(x.sheetPct) : pctNum,
    };
  });
}

function renderLeaderList(chartKey) {
  const cfg = LEADER_CONFIG[chartKey];
  const listContainer = document.getElementById(`list-${chartKey}`);
  if (!cfg || !listContainer) return;
  let rows = getLeaderBaseRows(chartKey);
  const leaderFilter = leaderFilters[chartKey];
  if (leaderFilter && leaderFilter !== 'ALL') rows = rows.filter((r) => rowLeader(r, cfg) === leaderFilter);

  let list = buildLeaderListItems(rows, cfg, chartKey);

  const sortVal = leaderSorts[chartKey] || 'pct-desc';
  list.sort((a, b) => {
    if (sortVal === 'name-asc') return a.name.localeCompare(b.name);
    if (sortVal === 'ach-asc') return a.ach - b.ach;
    if (sortVal === 'ach-desc') return b.ach - a.ach;
    return b.pctNum - a.pctNum;
  });

  if (!list.length) {
    listContainer.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted);font-size:12px;">No records found</div>';
    return;
  }

  listContainer.innerHTML = list.map((item) => {
    const pctRaw = Number.isFinite(item.pctNum) ? item.pctNum : 0;
    const barWidth = clamp(pctRaw, 0, 100);
    const badgeClass = pctRaw >= 90 ? 'green' : pctRaw >= 70 ? 'amber' : 'red';
    return `<div class="leader-progress-row">
      <div class="leader-row-name-wrap"><span class="leader-row-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span></div>
      <div class="leader-row-bar-container"><div class="leader-slim-track-wrap"><div class="leader-slim-track"><div class="leader-slim-fill ${cfg.color}" style="width:${barWidth}%;transition:width .45s ease"></div></div><div class="leader-scale-row"><span>0</span><span>20</span><span>40</span><span>60</span><span>100</span></div></div></div>
      <div class="leader-row-values">${escapeHtml(item.achText)} / ${escapeHtml(item.targetText)} <span class="leader-row-pct-badge ${badgeClass}">${escapeHtml(item.pctText)}</span></div>
    </div>`;
  }).join('');
}

function populateProgramDropdown() {
  const select = document.getElementById('program-filter');
  if (!select) return;
  const programs = sheetData.programs || [];
  select.innerHTML =
    '<option value="ALL">All Programs</option>' +
    programs.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
  if (activeProgram === 'ALL' || programs.includes(activeProgram)) select.value = activeProgram;
  else if (programs.length) {
    activeProgram = 'ALL';
    select.value = 'ALL';
  }
}

function syncSectionDropdowns() {
  ['tc', 'fc'].forEach((prefix) => { const cfg = SECTION_CONFIG[prefix]; populateSelect(cfg.selectId, uniqueSorted(filterRowsByProgram(getDatasetRows(cfg.dataset)).map((r) => rowDim(r, cfg.dimColumn))), cfg.allLabel); sectionCohortFilters[prefix] = document.getElementById(cfg.selectId).value; });
  ['tm', 'fm'].forEach((prefix) => { const cfg = SECTION_CONFIG[prefix]; populateSelect(cfg.selectId, uniqueSorted(filterRowsByProgram(getDatasetRows(cfg.dataset)).map((r) => rowDim(r, cfg.dimColumn))), cfg.allLabel); sectionMonthFilters[prefix] = document.getElementById(cfg.selectId).value; });
}

/* ── LEADERSHIP BANNER RENDER ────────────────────── */
function getInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function renderLeadershipBanner() {
  const gmContainer = document.getElementById('banner-gm-names');
  const tlContainer = document.getElementById('banner-tl-names');
  if (!gmContainer || !tlContainer) return;

  // Derive GM names from gmTokenCohort rows
  const gmRows = filterRowsByProgram(getDatasetRows('gmTokenCohort'));
  const gmNameCols = ['GM NAME', 'GM Name'];
  const gmNames = [];
  gmRows.forEach((r) => {
    for (const col of gmNameCols) {
      const v = (r[col] || '').trim();
      if (v && !gmNames.includes(v)) { gmNames.push(v); break; }
    }
  });

  // Derive TL names from tlTokenCohort rows
  const tlRows = filterRowsByProgram(getDatasetRows('tlTokenCohort'));
  const tlNames = [];
  tlRows.forEach((r) => {
    const v = (r['TL NAME'] || '').trim();
    if (v && !tlNames.includes(v)) tlNames.push(v);
  });

  function buildChips(names, chipClass) {
    if (!names.length) {
      return `<span class="leader-name-chip placeholder ${chipClass}">Not assigned</span>`;
    }
    return names.map((name) => {
      const initials = getInitials(name);
      return `<span class="leader-name-chip ${chipClass}" data-initials="${escapeHtml(initials)}"><span>${escapeHtml(name)}</span></span>`;
    }).join('');
  }

  gmContainer.innerHTML = buildChips(gmNames, 'gm-chip');
  tlContainer.innerHTML = buildChips(tlNames, 'tl-chip');
}

function render() {
  renderCardsSection('tc'); renderCardsSection('tm'); renderCardsSection('fc'); renderCardsSection('fm');
  LEADER_CHART_KEYS.forEach(renderLeaderList);
  renderLeadershipBanner();
}

function updateLastUpdated() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  setText('last-updated-text', `Last updated: ${dateStr} ${timeStr}`);
}

function onProgramChange(val) {
  activeProgram = val;
  sectionCohortFilters.tc = 'ALL'; sectionCohortFilters.fc = 'ALL'; sectionMonthFilters.tm = 'ALL'; sectionMonthFilters.fm = 'ALL';
  LEADER_CHART_KEYS.forEach((k) => {
    leaderFilters[k] = 'ALL';
    if (k.endsWith('-tc') || k.endsWith('-fc')) leaderCohortFilters[k] = 'ALL';
    if (k.endsWith('-tm') || k.endsWith('-fm')) leaderMonthFilters[k] = 'ALL';
  });
  syncSectionDropdowns();
  LEADER_CHART_KEYS.forEach(syncLeaderDropdowns);
  render();
}

function onSectionCohortChange(prefix, value) { sectionCohortFilters[prefix] = value; renderCardsSection(prefix); }
function onSectionMonthChange(prefix, value) { sectionMonthFilters[prefix] = value; renderCardsSection(prefix); }

function onLeaderFilterChange(chartKey, value) { leaderFilters[chartKey] = value; renderLeaderList(chartKey); }
function onLeaderCohortFilterChange(chartKey, value) { leaderCohortFilters[chartKey] = value; syncLeaderDropdowns(chartKey); renderLeaderList(chartKey); }
function onLeaderMonthFilterChange(chartKey, value) { leaderMonthFilters[chartKey] = value; syncLeaderDropdowns(chartKey); renderLeaderList(chartKey); }
function onLeaderSortChange(chartKey, value) { leaderSorts[chartKey] = value; renderLeaderList(chartKey); }

function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  const isDarkMode = html.classList.contains('dark');
  localStorage.setItem('uni-theme', isDarkMode ? 'dark' : 'light');
  document.getElementById('theme-icon-sun').style.display = isDarkMode ? 'block' : 'none';
  document.getElementById('theme-icon-moon').style.display = isDarkMode ? 'none' : 'block';
  render();
}

function initTheme() {
  const saved = localStorage.getItem('uni-theme');
  if (saved === 'dark') {
    document.documentElement.classList.add('dark');
    document.getElementById('theme-icon-sun').style.display = 'block';
    document.getElementById('theme-icon-moon').style.display = 'none';
  }
}

async function loadData(forceRefresh) {
  setLoading(true);
  try {
    const payload = await fetchDashboard(forceRefresh);
    sheetData = {
      programs: payload.programs || [],
      tokenCohort: payload.tokenCohort || [], tokenMonthly: payload.tokenMonthly || [],
      fpCohort: payload.fpCohort || [], fpMonthly: payload.fpMonthly || [],
      tlTokenCohort: payload.tlTokenCohort || [], tlTokenMonthly: payload.tlTokenMonthly || [],
      tlFpCohort: payload.tlFpCohort || [], tlFpMonthly: payload.tlFpMonthly || [],
      gmTokenCohort: payload.gmTokenCohort || [], gmTokenMonthly: payload.gmTokenMonthly || [],
      gmFpCohort: payload.gmFpCohort || [], gmFpMonthly: payload.gmFpMonthly || [],
      bdaTokenCohort: payload.bdaTokenCohort || [], bdaTokenMonthly: payload.bdaTokenMonthly || [],
      bdaFpCohort: payload.bdaFpCohort || [], bdaFpMonthly: payload.bdaFpMonthly || [],
    };
    dataReady = true;
    populateProgramDropdown();
    syncSectionDropdowns();
    LEADER_CHART_KEYS.forEach(syncLeaderDropdowns);
    render();
    updateLastUpdated();
  } catch (err) {
    console.error(err);
    setText('last-updated-text', 'Failed to load data — is the server running?');
    dataReady = false;
  } finally {
    setLoading(false);
  }
}

function handleRefresh() {
  const btn = document.getElementById('refresh-btn');
  btn.classList.add('spinning');
  loadData(true).finally(() => btn.classList.remove('spinning'));
}

function init() { initTheme(); loadData(false); }
document.addEventListener('DOMContentLoaded', init);
