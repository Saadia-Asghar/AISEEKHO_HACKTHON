# KhidmatAI — Hackathon submission (team lead)

**Deadline:** Wednesday 20 May 2026 (end of day) — final.  
**Videos (you record):** Demo 3–5 min · Antigravity 2–3 min  

**Copy-paste form answers:** [HACKATHON_FORM_ANSWERS.md](./HACKATHON_FORM_ANSWERS.md)

---

## Live links (paste into Google Form)

| # | Field | Link |
|---|--------|------|
| 1 | **Mobile app** | https://aiseekho-hackthon.vercel.app |
| 2 | **GitHub** | https://github.com/Saadia-Asghar/AISEEKHO_HACKTHON |
| 3 | **Demo video** | _Your Drive/YouTube URL_ |
| 4 | **Antigravity video** | _Your Drive/YouTube URL_ |
| 5 | **README** | https://github.com/Saadia-Asghar/AISEEKHO_HACKTHON/blob/main/README.md |
| 6 | **Antigravity ZIP** | Upload `dist/khidmatai-antigravity-traces.zip` to Drive → paste link |
| Opt | **Web app** | https://aiseekho-hackthon.vercel.app |
| Opt | **Extra doc** | https://github.com/Saadia-Asghar/AISEEKHO_HACKTHON/blob/main/docs/CHALLENGE2_CHECKLIST.md |

**Judge login:** `+923000000000` / OTP `1234` or **Skip — Continue as Guest**

---

## Make the mobile/web link work (required)

The UI is on Vercel; **search/booking needs a public API**.

### Step A — Deploy API on Render (~10 min)

1. Go to [render.com](https://render.com) → **New** → **Blueprint** → connect repo `Saadia-Asghar/AISEEKHO_HACKTHON`.
2. Use root file `render.yaml` (creates `khidmatai-api`).
3. Add env vars: `GOOGLE_API_KEY`, `GOOGLE_MAPS_API_KEY` (from `backend/.env`).
4. After deploy, open: `https://khidmatai-api.onrender.com/health` → should show `"agents": 6`.

### Step B — Vercel env + redeploy (~2 min)

1. [vercel.com](https://vercel.com) → project **aiseekho-hackthon** → **Settings** → **Environment Variables**
2. Set `EXPO_PUBLIC_API_URL` = `https://khidmatai-api.onrender.com` (your Render URL)
3. **Deployments** → latest → **Redeploy**

If you see **404** on Vercel: push latest `main`, confirm **Root Directory** is empty (repo root), and redeploy.

### Step C — Antigravity ZIP

```powershell
cd d:\project
.\scripts\package-antigravity-traces.ps1
```

Upload `d:\project\dist\khidmatai-antigravity-traces.zip` to Google Drive (anyone with link).

---

## Team form

- All member names on Challenge 2  
- CNIC front + back per member  

---

## Demo script (videos)

1. “Mujhe kal subah G-13 mein AC technician chahiye”  
2. Results, map, match % → Pay → credentials → **Payment successful** → confirm screen  
3. **Trace** tab — 6 Antigravity nodes  
4. **Bookings** — Reschedule  
5. Antigravity video: IDE + `GET /api/antigravity/workflow`

---

## Verify before submit

```powershell
cd d:\project\backend
python -m pytest tests/ -q
```

Smoke: open mobile URL → login → search → book → trace → logout.
