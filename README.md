# FastAPI Workshop — AI-Assisted Debugging with IBM Bob 2.0

> IBM Bob 2.0 Hackathon submission: **Build with purpose using IBM Bob 2.0**
> Theme track: developer workflow improvement — debugging, code review, testing, maintenance.

A tiny FastAPI application (health, sum, profile CRUD, search with pagination) used as a **real project to demonstrate a full Bob-driven triage workflow**: understand unfamiliar code → investigate failing CI → fix safely → regression-test → multi-agent review.

**IBM Bob IDE is the core of this solution.** All investigation, fixes, and verification were performed in Bob IDE Agent mode using the hackathon-provisioned account (`Region: us-east`).

## The Developer Problem

Manual triage of an unfamiliar red CI is expensive: read 11 files to build a mental model, map 9 tests to code, classify each failure as app-bug vs test-bug, fix without regressions, then prove impact. For onboarding / maintenance teams this takes hours and is error-prone (e.g. missing a latent off-by-one that current tests don't expose).

## What We Built with Bob 2.0

Five phased Bob workflow on this repo:

1. **Codebase Understanding** — Bob explored 2 folders, 11 files in parallel, produced Architecture / API / Tests / Data-flow report.
2. **Bug Investigation** — Bob ran `pytest tests/ -v`, diagnosed 3 failing tests + 1 latent app bug, classified each as Application vs Test bug with file:line + root cause.
3. **Bug Fixing** — Bob applied 3 targeted fixes with before/after diffs:
   - `app/main.py:20` `@app.get("/health", status_code=201)` → `200`
   - `app/main.py:82` `results[offset:offset+limit-1]` → `results[offset:offset+limit]`
   - `tests/test_profile.py:16` `["name"]` → `["username"]`, `tests/test_search.py:26` empty-query contract `total > 0` → `total == 0`
4. **Regression Testing** — Bob re-ran suite + added new regression test `test_search_pagination` (limit=3 returns exactly 3). Result: **10 passed, 0 failed**.
5. **Multi-Agent Analysis** — 4 parallel subagents (API Quality, Test Quality, Search & Pagination, Documentation) with isolated context, consolidated into improvement backlog.

Bob capabilities used: **Agent mode, parallel tasks, subagents, document understanding (README/CONTRIBUTING/pyproject), auto-approval in controlled scope, rollback + diff review, test execution via terminal.**

## Before vs After (measured)

| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Total tests | 9 | 10 | +1 regression test added |
| Passed | 6 | 10 | +4 |
| Failed | 3 | 0 | -3 |
| Pass rate | 66.7% | 100% | +33.3pp |

Verified locally: `pytest tests/ -v` → `10 passed in 0.88s` (1 non-blocking `StarletteDeprecationWarning` about `httpx` vs `httpx2`).

Fixed bugs:
- `/health` returned 201 instead of 200 (app bug)
- `["name"]` vs `["username"]` field mismatch (test bug)
- Empty `q=""` returned all profiles vs `[]` contract (test/app contract fix)
- Latent pagination off-by-one dropped last item when `limit <= result_count` (app bug, caught by new regression test)

## How IBM Bob Was Used (for judges)

- Bob IDE chat prompts + full reports are in `bob-evidence/` (9 screenshots across 6 phases).
- **Required judging evidence is in `bob_sessions/`** — Task session consumption summary screenshots from Bob IDE (`Tasks > select task > click header`). See `bob_sessions/README.md` for mapping.
- Hackathon account only. No personal Bob usage. 40 Bobcoins budget respected by batching reads and dividing tasks.

## Project Structure

```
fastapi-workshop/
  app/
    main.py       # FastAPI app + route handlers
    models.py     # Pydantic schemas (ProfileCreate, ProfileResponse)
    store.py      # In-memory dict: profile_store
  tests/
    conftest.py       # clean_store fixture
    test_health.py
    test_sum.py
    test_profile.py
    test_search.py    # includes test_search_pagination regression test
  bob-evidence/       # Bob prompts, reports, diffs, test output, subagents
  bob_sessions/       # REQUIRED: Bob IDE task consumption summaries for judging
```

## Quick Start

```bash
# Clone
git clone <your-public-repo-url>
cd fastapi-workshop

# Venv + install
python3 -m venv venv
source venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Tests
pytest tests/ -v

# Server
uvicorn app.main:app --reload
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check → `{"status":"ok"}` 200 |
| GET | `/sum?a=1&b=2` | Sum two ints |
| POST | `/profile` | Create profile 201 |
| GET | `/profile/{username}` | Get profile 200 / 404 |
| DELETE | `/profile/{username}` | Delete profile |
| GET | `/search?q=term&offset=0&limit=10` | Search by username/bio, paginated |

## Evidence Checklist

- [x] `bob-evidence/01-codebase-understanding/` — task prompt + architecture report
- [x] `bob-evidence/02-bug-investigation/` — investigation prompt + full diagnosis (3 fails + 1 latent)
- [x] `bob-evidence/03-bug-fixing-changes/` — before/after diffs, 3 files changed
- [x] `bob-evidence/04-regression-test-result/` — `10 passed` terminal output
- [x] `bob-evidence/05-multi-agent-analysis/` — 4 parallel subagents + consolidated findings
- [x] `bob-evidence/06-final-impact-summary/` — impact report
- [ ] `bob_sessions/` — **you must add**: Bob IDE `Tasks` consumption summary PNGs named `teamname_taskNN_short-desc_summary.png` (see `bob_sessions/README.md`)
- [ ] Demo video (2-3 min) link — add here before submitting on lablab.ai
- [ ] Public GitHub repo URL — submit on lablab.ai

## Notes

- Original workshop purpose preserved (third-year CS open-source practice). See `CONTRIBUTING.md`.
- No confidential / client / PI / social-media data used. Sample data only.
- Remove credentials before pushing public. `bob_sessions/` must contain only screenshots, no keys.

## License

MIT
