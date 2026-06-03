"""
Local proxy server for UNI Program Dashboard.
Downloads the published Google Sheet workbook (xlsx), reads tabs by name, serves the static UI.
"""

from __future__ import annotations

import asyncio
import csv
import io
import threading
import time
from pathlib import Path
from typing import Optional
from urllib.request import Request, urlopen

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from openpyxl import load_workbook

BASE_DIR = Path(__file__).resolve().parent
CACHE_TTL_SECONDS = 300

WORKBOOK_URL = (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vSJT6jqlHH3w_wK8dAr3T0zEUKCknrquctgJISXRv0U6d9OeJEDmRZdA-DfEzjhQlZVMpGD8XpBL5hU"
    "/pub?output=xlsx"
)

# api key -> workbook tab name candidates (first match wins)
SHEET_TABS: dict[str, list[str]] = {
    "token-cohort": ["Uni Program Token Cohort"],
    "token-monthly": ["Uni Program Token Month"],
    "fp-cohort": ["Uni Program Full Payment Cohort"],
    "fp-monthly": ["Uni Program Full Payment Month"],
    "tl-token-cohort": ["TL Wise Cohort Token"],
    "tl-token-monthly": ["TL Wise Monthly Token"],
    "tl-fp-cohort": ["TL Wise Cohort Full"],
    "tl-fp-monthly": ["TL Wise Monthy Full"],
    "gm-token-cohort": ["GM Wise Cohort Token"],
    "gm-token-monthly": ["GM Wise Monthly Token"],
    "gm-fp-cohort": ["GM Wise Cohort Full"],
    "gm-fp-monthly": ["GM Wise Monthy Full"],
    "bda-token-cohort": ["BDA Wise Cohort Token"],
    "bda-token-monthly": ["BDA Wise Monthly Token"],
    "bda-fp-cohort": ["BDA Wise Cohort Full"],
    "bda-fp-monthly": ["BDA Wise Monthy Full"],
}

_workbook_cache: Optional[object] = None
_workbook_cache_at: float = 0.0
_rows_cache: dict[str, tuple[float, list[dict[str, str]]]] = {}
_workbook_lock = threading.Lock()


def _normalize_name(name: str) -> str:
    return (name or "").strip().lower()


def _resolve_sheet_name(sheet_names: list[str], candidates: list[str]) -> Optional[str]:
    by_norm = {_normalize_name(name): name for name in sheet_names}
    for candidate in candidates:
        match = by_norm.get(_normalize_name(candidate))
        if match:
            return match
    for candidate in candidates:
        needle = _normalize_name(candidate)
        for name in sheet_names:
            norm = _normalize_name(name)
            if norm.startswith(needle) or needle.startswith(norm):
                return name
    return None


def _clear_workbook_cache() -> None:
    global _workbook_cache, _workbook_cache_at, _rows_cache
    with _workbook_lock:
        _workbook_cache = None
        _workbook_cache_at = 0.0
        _rows_cache = {}


def _load_workbook(*, force_refresh: bool = False):
    global _workbook_cache, _workbook_cache_at, _rows_cache
    now = time.time()
    with _workbook_lock:
        if force_refresh:
            _workbook_cache = None
            _workbook_cache_at = 0.0
            _rows_cache = {}
        elif _workbook_cache is not None and now - _workbook_cache_at < CACHE_TTL_SECONDS:
            return _workbook_cache

        request = Request(WORKBOOK_URL, headers={"User-Agent": "UniProgramDashboard/1.0"})
        with urlopen(request, timeout=120) as response:
            payload = response.read()

        _workbook_cache = load_workbook(io.BytesIO(payload), read_only=True, data_only=True)
        _workbook_cache_at = now
        _rows_cache = {}
        return _workbook_cache


def _worksheet_to_csv(worksheet) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    for row in worksheet.iter_rows(values_only=True):
        writer.writerow(["" if cell is None else cell for cell in row])
    return buffer.getvalue()


def _parse_csv(text: str) -> list[dict[str, str]]:
    """Parse CSV; when headers repeat (e.g. two 'Program Name' cols), keep the first."""
    text = text.lstrip("\ufeff")
    raw_reader = csv.reader(io.StringIO(text))
    try:
        header_row = next(raw_reader)
    except StopIteration:
        return []

    headers = [h.strip() for h in header_row]
    rows: list[dict[str, str]] = []
    for line in raw_reader:
        if not any((cell or "").strip() for cell in line):
            continue
        cleaned: dict[str, str] = {}
        for idx, header in enumerate(headers):
            if not header:
                continue
            val = (line[idx].strip() if idx < len(line) else "")
            if header not in cleaned:
                cleaned[header] = val
        if any(cleaned.values()):
            rows.append(cleaned)
    return rows


def _get_sheet_rows(key: str, *, force_refresh: bool = False) -> list[dict[str, str]]:
    if key not in SHEET_TABS:
        raise HTTPException(status_code=404, detail=f"Unknown dataset: {key}")

    now = time.time()
    if not force_refresh:
        cached = _rows_cache.get(key)
        if cached and (now - cached[0]) < CACHE_TTL_SECONDS:
            return cached[1]

    candidates = SHEET_TABS[key]
    workbook = _load_workbook(force_refresh=force_refresh)
    tab_name = _resolve_sheet_name(workbook.sheetnames, candidates)
    if not tab_name:
        raise HTTPException(status_code=404, detail=f"Workbook tab not found for {key}")

    csv_text = _worksheet_to_csv(workbook[tab_name])
    rows = _parse_csv(csv_text)
    _rows_cache[key] = (now, rows)
    return rows


async def _fetch_sheet(key: str) -> list[dict[str, str]]:
    return await asyncio.to_thread(_get_sheet_rows, key)


app = FastAPI(title="UNI Program Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "cache_ttl_seconds": CACHE_TTL_SECONDS}


@app.post("/api/refresh")
async def refresh_cache():
    await asyncio.to_thread(_clear_workbook_cache)
    return {"status": "ok", "message": "Cache cleared"}


@app.get("/api/data/{dataset}")
async def get_dataset(dataset: str):
    rows = await _fetch_sheet(dataset)
    return {"dataset": dataset, "rows": rows, "count": len(rows)}


@app.get("/api/dashboard")
async def get_dashboard():
    (
        token_cohort,
        token_monthly,
        fp_cohort,
        fp_monthly,
        tl_token_cohort,
        tl_token_monthly,
        tl_fp_cohort,
        tl_fp_monthly,
        gm_token_cohort,
        gm_token_monthly,
        gm_fp_cohort,
        gm_fp_monthly,
        bda_token_cohort,
        bda_token_monthly,
        bda_fp_cohort,
        bda_fp_monthly,
    ) = await asyncio.gather(
        _fetch_sheet("token-cohort"),
        _fetch_sheet("token-monthly"),
        _fetch_sheet("fp-cohort"),
        _fetch_sheet("fp-monthly"),
        _fetch_sheet("tl-token-cohort"),
        _fetch_sheet("tl-token-monthly"),
        _fetch_sheet("tl-fp-cohort"),
        _fetch_sheet("tl-fp-monthly"),
        _fetch_sheet("gm-token-cohort"),
        _fetch_sheet("gm-token-monthly"),
        _fetch_sheet("gm-fp-cohort"),
        _fetch_sheet("gm-fp-monthly"),
        _fetch_sheet("bda-token-cohort"),
        _fetch_sheet("bda-token-monthly"),
        _fetch_sheet("bda-fp-cohort"),
        _fetch_sheet("bda-fp-monthly"),
    )

    programs = sorted(
        {r.get("Program Name", "") for r in token_cohort if r.get("Program Name")},
        key=str.casefold,
    )

    return {
        "programs": programs,
        "tokenCohort": token_cohort,
        "tokenMonthly": token_monthly,
        "fpCohort": fp_cohort,
        "fpMonthly": fp_monthly,
        "tlTokenCohort": tl_token_cohort,
        "tlTokenMonthly": tl_token_monthly,
        "tlFpCohort": tl_fp_cohort,
        "tlFpMonthly": tl_fp_monthly,
        "gmTokenCohort": gm_token_cohort,
        "gmTokenMonthly": gm_token_monthly,
        "gmFpCohort": gm_fp_cohort,
        "gmFpMonthly": gm_fp_monthly,
        "bdaTokenCohort": bda_token_cohort,
        "bdaTokenMonthly": bda_token_monthly,
        "bdaFpCohort": bda_fp_cohort,
        "bdaFpMonthly": bda_fp_monthly,
        "fetchedAt": time.time(),
    }


@app.get("/")
async def index():
    return FileResponse(BASE_DIR / "index.html")


app.mount("/", StaticFiles(directory=BASE_DIR), name="static")
