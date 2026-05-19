# KhidmatAI — Hackathon submission (team lead)

**Deadline:** Wednesday 20 May 2026 (end of day)  
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

## Fix Vercel 404 (if you see NOT_FOUND)

Deployment was **Ready** but empty because Vercel did not run the web build (`dist/` is not in Git).

1. **Push latest `main`** (includes `buildCommand` in root `vercel.json`).
2. Vercel → **aiseekho-hackthon** → **Settings** → **General**:
   - **Root Directory:** leave **empty** (repository root).
   - **Framework Preset:** Other (or None).
3. **Environment variables** → add:
   - `EXPO_PUBLIC_API_URL` = your public API (e.g. `https://khidmatai-api.onrender.com`)
4. **Deployments** → **Redeploy** (check build logs show `expo export -p web` and `Exported: dist`).
5. Open https://aiseekho-hackthon.vercel.app — you should see the **KhidmatAI login**, not 404.

---

## Deploy API (so search/booking work)

1. [render.com](https://render.com) → **Blueprint** → repo `AISEEKHO_HACKTHON` → `render.yaml`
2. Set `GOOGLE_API_KEY`, `GOOGLE_MAPS_API_KEY`
3. Test: `https://YOUR-SERVICE.onrender.com/health` → `"agents": 6`
4. Put that URL in Vercel as `EXPO_PUBLIC_API_URL` → **Redeploy**

---

## Antigravity ZIP

```powershell
cd d:\project
.\scripts\package-antigravity-traces.ps1
```

Upload `d:\project\dist\khidmatai-antigravity-traces.zip` to Google Drive.

---

## Team form

All member names + CNIC front/back per member.
