# KhidmatAI — Hackathon submission pack (team lead)

**Deadline:** Wednesday 20 May 2026 (end of day) — final, no extensions.  
**Who submits:** Team lead only, once.  
**You record:** Demo video (3–5 min) + Antigravity usage video (2–3 min).

Fill the links below, then paste into the official Google Form.

---

## Mandatory links (paste into form)

| # | Item | Your link |
|---|------|-----------|
| 1 | **Mobile app** (drive/APK/EAS — must open and work) | _TODO: e.g. Google Drive / Expo link_ |
| 2 | **GitHub repository** | https://github.com/Saadia-Asghar/AISEEKHO_HACKTHON |
| 3 | **Demo video** (3–5 min: workflow, agency, innovation) | _TODO_ |
| 4 | **Antigravity usage video** (2–3 min screen recording) | _TODO_ |
| 5 | **README / documentation** | Same repo: [README.md](../README.md) + this file + [DEPLOY.md](./DEPLOY.md) |
| 6 | **Antigravity trace ZIP** | Build with `.\scripts\package-antigravity-traces.ps1` → upload `dist/khidmatai-antigravity-traces.zip` |

---

## Optional

| # | Item | Your link |
|---|------|-----------|
| 1 | **Web app** (live until 25 May 2026) | https://aiseekho-hackthon.vercel.app — set `EXPO_PUBLIC_API_URL` to deployed API |
| 2 | **Extra PDF/MD/PPTX** | e.g. [CHALLENGE2_CHECKLIST.md](./CHALLENGE2_CHECKLIST.md) |

**Web login (demo):** Phone `+923000000000`, OTP `1234` (or Skip on auth screen).

---

## Team verification (form)

- List **all** team members who worked on Challenge 2.
- Upload **CNIC front + back** for each member.

---

## Pre-submit checklist (15 min)

- [ ] `git push` — GitHub repo is public/accessible to judges.
- [ ] Backend deployed (Railway/Render/Fly); `curl https://YOUR-API/health` shows `"agents": 6`.
- [ ] Vercel env `EXPO_PUBLIC_API_URL` = deployed API (not `127.0.0.1`).
- [ ] Mobile link opens: login → search → results map → book → trace tab.
- [ ] `cd backend; python -m pytest tests/ -q` — all green.
- [ ] Antigravity ZIP uploaded (see [antigravity-trace/README.md](./antigravity-trace/README.md)).
- [ ] No secrets in README (use `.env`, not committed keys).

---

## Quick deploy reminders

See [DEPLOY.md](./DEPLOY.md).

1. **API:** `uvicorn app.main:app --host 0.0.0.0 --port 8000` with `backend/.env` keys.
2. **Web:** Root `vercel.json` builds `khidmat-ai/mobile` → `dist/`.
3. **Native APK:** `eas build` with `EXPO_PUBLIC_API_URL` in `eas.json` / EAS secrets.

---

## Antigravity evidence (for judges)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/antigravity/workflow` | 6 nodes, skills, tools |
| `GET /api/antigravity/status` | Engine + Gemini/Maps configured |
| `POST /api/antigravity/run` | Full pipeline + trace |
| `GET /api/trace/{session_id}` | Session telemetry JSON |

After a demo booking, copy `session_id` from the app Trace tab and export:

```powershell
curl https://YOUR-API/api/trace/SESSION_ID -o docs/antigravity-trace/samples/session_trace.json
```

---

## Demo script (for your videos)

1. **Voice/text:** “Mujhe kal subah G-13 mein AC technician chahiye”
2. Show **ranked workers**, **match %**, **map** (Google static or OSM).
3. **Book** → receipt `KHI-*` → WhatsApp / notification row.
4. **Trace tab** — expand nodes 1–6 with timestamps.
5. **Antigravity video:** IDE plans/tasks + `GET /api/antigravity/workflow` in browser.

---

## Innovation talking points

- **Agency:** System widens radius, ranks, books, schedules follow-up — not recommend-only.
- **Multilingual:** Urdu script, Roman Urdu, English in one pipeline.
- **Antigravity:** Six registered nodes with shared session context and exportable telemetry.
- **Pakistan context:** Islamabad sectors, WhatsApp deep links, informal worker dataset.
