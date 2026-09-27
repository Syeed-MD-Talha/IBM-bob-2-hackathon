# SlideShift — Free PPT ⇄ PDF Converter, 100% In-Browser

> IBM Bob 2.0 Hackathon submission: **Build with purpose using IBM Bob 2.0**
> Theme track: developer workflow improvement — release & document workflows (ship decks as PDFs without uploads, accounts, or a server to maintain).
> Hackathon: [IBM Bob 2.0 Hackathon](https://lablab.ai/ai-hackathons/ibm-bob-2-hackathon) (Online, Sep 25–27, 2026) • [Hackathon guide](https://lablab-ibm-bob-2-hackathon-guide.s3.us.cloud-object-storage.appdomain.cloud/index.html#a-note-on-using-other-technologies)
> **Live demo:** `<paste-your-vercel-url-here>`

SlideShift converts **PPTX → PDF** and **PDF → PPTX** entirely inside the browser tab — pure HTML, CSS and JavaScript. No server, no signup, no database. Files never leave the device (prove it: DevTools → Network shows zero file traffic during conversion).

**IBM Bob IDE is the core of this solution.** Both the original FastAPI triage work (preserved below as Phase 0) and the SlideShift pivot — architecture decision, converter engines, implementation, verification — were driven in Bob IDE Agent mode using the hackathon-provisioned account (`Region: us-east`). Per the [guide](https://lablab-ibm-bob-2-hackathon-guide.s3.us.cloud-object-storage.appdomain.cloud/index.html#a-note-on-using-other-technologies), any framework/technology may be used as long as Bob IDE is showcased as core — every phase below links its Bob tasks and evidence.

## The Problem

Teams constantly convert slide decks for reviews, releases, and sharing — yet every free online converter forces you to **upload private decks to someone else's server** (privacy risk), wrapped in paywalls, watermarks, queues, and forced accounts, all for a 10-second task. Desktop suites are heavy overkill, and self-hosting real conversion (LibreOffice) means maintaining a server forever. For release and document workflows, that is pure toil: time, effort, and rework on every share.

## What We Built

With Bob, we pivoted this repo from a triage demo into **SlideShift**, a working prototype that removes the upload/wait/pay loop and the backend-maintenance burden entirely:

- **Two directions, auto-detected:** drop a `.pptx` → get a clean PDF; drop a `.pdf` → get a real `.pptx`.
- **PDF → PPTX:** each page rendered to an image (PDF.js) and placed full-bleed on its own slide (PptxGenJS), 16:9 or 4:3, Standard/High/Ultra quality.
- **PPTX → PDF:** the `.pptx` (a ZIP of XML) is opened in-browser (JSZip); slides read in presentation order, text + images extracted, rebuilt as a styled PDF (jsPDF) with orientation and image options.
- **Product UX:** drag & drop, paste-from-clipboard, live progress bar + per-slide log, auto-download with button fallback, engine status pills, dark/light theme, conversion counter in localStorage.
- **Zero-ops:** `public/` is the whole app (`index.html`, `styles.css`, `app.js` + 4 CDN libraries) — static hosting, free tier, nothing to maintain.

## Honest Limits

Stated openly on the site: `.pptx` only (no legacy binary `.ppt`); PPTX → PDF keeps content, not pixel fidelity (fonts, animations, charts, SmartArt, video); PDF → PPTX slides look identical but are images (text not selectable/editable); password-protected PDFs rejected; very large files can exhaust browser memory. Pixel-perfect editable conversion needs a server engine — out of scope for a free static site by design.

## Project History — Phase 0: Bob-Driven Triage on This Repo (Preserved)

Before the pivot, this repo was a **real project demonstrating a full Bob-driven triage workflow** on a tiny FastAPI app (health, sum, profile CRUD, search with pagination): understand unfamiliar code → investigate failing CI → fix safely → regression-test → multi-agent review.

Five phased Bob workflow:

1. **Codebase Understanding** — Bob explored 2 folders, 11 files in parallel, produced Architecture / API / Tests / Data-flow report.
2. **Bug Investigation** — Bob ran `pytest tests/ -v`, diagnosed 3 failing tests + 1 latent app bug, classified each as Application vs Test bug with file:line + root cause.
3. **Bug Fixing** — Bob applied 3 targeted fixes with before/after diffs:
   - `app/main.py:20` `@app.get("/health", status_code=201)` → `200`
   - `app/main.py:82` `results[offset:offset+limit-1]` → `results[offset:offset+limit]`
   - `tests/test_profile.py:16` `["name"]` → `["username"]`, `tests/test_search.py:26` empty-query contract `total > 0` → `total == 0`
4. **Regression Testing** — Bob re-ran suite + added new regression test `test_search_pagination` (limit=3 returns exactly 3). Result: **10 passed, 0 failed**.
5. **Multi-Agent Analysis** — 4 parallel subagents (API Quality, Test Quality, Search & Pagination, Documentation) with isolated context, consolidated into improvement backlog.

Bob capabilities used: **Agent mode, parallel tasks, subagents, document understanding (README/CONTRIBUTING/pyproject), auto-approval in controlled scope, rollback + diff review, test execution via terminal.**

## Before vs After (Measured)

Phase 0 (FastAPI triage):

| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Total tests | 9 | 10 | +1 regression test added |
| Passed | 6 | 10 | +4 |
| Failed | 3 | 0 | -3 |
| Pass rate | 66.7% | 100% | +33.3pp |

Verified locally: `pytest tests/ -v` → `10 passed` (1 non-blocking `StarletteDeprecationWarning` about `httpx` vs `httpx2`).

Fixed bugs:
- `/health` returned 201 instead of 200 (app bug)
- `["name"]` vs `["username"]` field mismatch (test bug)
- Empty `q=""` returned all profiles vs `[]` contract (test/app contract fix)
- Latent pagination off-by-one dropped last item when `limit <= result_count` (app bug, caught by new regression test)

SlideShift pivot (verifiable, no backend to measure against):
- Server cost per conversion: anything → **$0** (no server exists)
- File uploads per conversion: anything → **0** (`node --check` passes; no `fetch`/XHR/API calls in `public/app.js`)
- New user setup: account + install → **none** (open URL, drop file)

## How IBM Bob Was Used (for Judges)

- Phase 0 prompts, reports, diffs, and test output are in `bob-evidence/` (9 screenshots across 6 phases).
- **Required judging evidence is in `bob_sessions/`** — Task session consumption summary screenshots from Bob IDE (`Tasks > select task > click header`). See `bob_sessions/README.md` for mapping.
- SlideShift phases (pivot decision incl. why Vercel-free can't run LibreOffice, converter architecture, PDF→PPTX engine, PPTX→PDF engine, verification) were likewise Bob-driven — **TODO: add the new task session summaries** as `bob_sessions/teamname_taskNN_slideshift-<phase>_summary.png`.
- Hackathon account only. No personal Bob usage. No confidential / client / PI / social-media data used — sample decks only, per the guide's dataset rules.

## Project Structure

```
fastapi-workshop/
  public/
    index.html      # SlideShift UI (converter, progress, how-it-works, limits)
    styles.css      # Pure CSS, dark/light theme, no frameworks
    app.js          # 100% client-side engines: PDF→PPTX (PDF.js+PptxGenJS), PPTX→PDF (JSZip+jsPDF)
  app/
    main.py         # FastAPI app + route handlers; also serves public/ same-origin for local preview
    models.py       # Pydantic schemas (ProfileCreate, ProfileResponse)
    store.py        # In-memory dict: profile_store
  tests/            # Phase 0 suite (10 tests, incl. test_search_pagination regression test)
  Coder_naruto_BobFix_Presentation.pptx  # Project deck, updated for SlideShift
  bob-evidence/     # Bob prompts, reports, diffs, test output, subagents
  bob_sessions/     # REQUIRED: Bob IDE task consumption summaries for judging
```

## Quick Start

```bash
# A. Use the converter (no install)
npx serve public
# → open the URL, drop a .pptx or .pdf, hit Convert

# B. Local preview via backend (serves the same UI same-origin at /)
pip install -r requirements.txt
uvicorn app.main:app --reload
# → http://localhost:8000/

# C. Phase 0 backend suite (preserved)
pytest tests/ -v
```

### API Endpoints (Preserved Local Backend)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check → `{"status":"ok"}` 200 |
| GET | `/sum?a=1&b=2` | Sum two ints |
| POST | `/profile` | Create profile 201 |
| GET | `/profile/{username}` | Get profile 200 / 404 |
| DELETE | `/profile/{username}` | Delete profile |
| GET | `/search?q=term&offset=0&limit=10` | Search by username/bio, paginated |
| GET | `/` | SlideShift UI (static) |

## Evidence Checklist

- [x] `bob-evidence/01-codebase-understanding/` — task prompt + architecture report
- [x] `bob-evidence/02-bug-investigation/` — investigation prompt + full diagnosis (3 fails + 1 latent)
- [x] `bob-evidence/03-bug-fixing-changes/` — before/after diffs, 3 files changed
- [x] `bob-evidence/04-regression-test-result/` — `10 passed` terminal output
- [x] `bob-evidence/05-multi-agent-analysis/` — 4 parallel subagents + consolidated findings
- [x] `bob-evidence/06-final-impact-summary/` — impact report
- [x] `Coder_naruto_BobFix_Presentation.pptx` — deck rewritten for SlideShift (9 slides, styling preserved)
- [ ] `bob_sessions/` — **you must add**: Bob IDE `Tasks` consumption summary PNGs, including the new SlideShift tasks, named `teamname_taskNN_short-desc_summary.png` (see `bob_sessions/README.md`)
- [ ] Demo video (2-3 min) link — SlideShift run-through: PPTX→PDF, PDF→PPTX, limits, Network-tab zero-traffic proof — add here before submitting on lablab.ai
- [ ] Live demo URL — paste above and submit on lablab.ai
- [ ] Public GitHub repo URL — submit on lablab.ai

## Notes

- Original workshop purpose preserved (third-year CS open-source practice). See `CONTRIBUTING.md`.
- Sample data only — no confidential, client, PI, or social-media data, per the hackathon dataset rules.
- Remove credentials before pushing public. `bob_sessions/` must contain only screenshots, no keys.

## License

MIT
```

(End of file)
