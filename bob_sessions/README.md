# bob_sessions — REQUIRED for judging

This folder must contain **Bob IDE task session consumption summary screenshots**.

The files currently in `../bob-evidence/` are supporting evidence (prompts, reports, diffs) but do **NOT** replace this requirement.

## What to put here

For **each** Bob task related to your submission:

1. In Bob IDE, open Chat → **Tasks** to show task list.
2. If you used multiple workspaces, select **All** to view across workspaces.
3. Click the **task header** to open the Task session consumption summary.
4. Take a screenshot (PNG preferred for clarity).
5. Save as: `teamname_taskNN_short-desc_summary.png`
   - Example: `code-weavers_task01_codebase-understanding_summary.png`
   - Example: `code-weavers_task02_bug-investigation_summary.png`
   - Example: `code-weavers_task03_bug-fixing_summary.png`
   - Example: `code-weavers_task04_regression-test_summary.png`
   - Example: `code-weavers_task05_multi-agent_summary.png`

## Checklist before submit

- [ ] All task summaries included (5-6 files expected for this project)
- [ ] Filenames include team name + task number
- [ ] PNG, readable, no cropped consumption numbers
- [ ] No credentials / API keys visible — remove before pushing public repo
- [ ] Verify Bob Settings shows hackathon account `Region: us-east` (visible in your existing screenshots — good)

## Current status

`../bob-evidence/` already has:
- 01-codebase-understanding/01-task-prompt.png, 02-architecture-overview.png
- 02-bug-investigation/01-bug-investigation-prompt.png, 02-bug-investigation-report.png
- 03-bug-fixing-changes/bug-fixing-changes.png
- 04-regression-test-result/final-test-result.png.png (note: fix double extension on upload)
- 05-multi-agent-analysis/multi-agent-analysis.png, multi-agent-summary.png
- 06-final-impact-summary/06-final-impact-summary.png

Keep those. **Add** the consumption summaries here. Final repo must have both folders.
