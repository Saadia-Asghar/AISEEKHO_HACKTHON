# Antigravity trace package (submission item #6)

Judges expect a **ZIP** containing implementation plans, task lists, and walkthroughs from **Google Antigravity** (and/or equivalent agentic dev logs) for every teammate who used Antigravity to build KhidmatAI.

## What to include per team member

Create a folder named `member_<firstname>/` with any of:

| File type | Source |
|-----------|--------|
| Antigravity **implementation plans** | Export from Antigravity IDE / agent sessions |
| **Task lists** | Antigravity task panel or Antigravity agent todos |
| **Walkthrough** | Generated walkthrough or session summary |
| **Screenshots** | Optional PNG of workflow graph |

Also include the **repo-generated** artifacts below (same for whole team).

## Repo-generated artifacts (always include)

| Path | Description |
|------|-------------|
| `workflow_definition.json` | From `GET /api/antigravity/workflow` |
| `samples/session_trace.json` | From `GET /api/trace/{session_id}` after a demo run |
| `backend_workflow_source.md` | Copy of node definitions from `backend/app/antigravity/workflow.py` |

## Build the ZIP (Windows)

From repo root:

```powershell
.\scripts\package-antigravity-traces.ps1
```

Output: `dist/khidmatai-antigravity-traces.zip` — upload this link in the submission form.

## Manual export (if API is running)

```powershell
$api = "http://127.0.0.1:8000"   # or your deployed URL
Invoke-WebRequest "$api/api/antigravity/workflow" -OutFile docs/antigravity-trace/workflow_definition.json
# After booking in the app, replace SESSION_ID:
Invoke-WebRequest "$api/api/trace/SESSION_ID" -OutFile docs/antigravity-trace/samples/session_trace.json
```

## Antigravity IDE logs

If you used **Antigravity** with Antigravity-style agent sessions:

1. Export relevant chat sessions or save plans as `.md` into `member_<name>/`.
2. Do **not** commit CNIC images or `.env` secrets into this folder.

## Placeholder folders

Empty `member_example/` is a template — replace with real exports before zipping.
