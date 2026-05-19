# Copy-paste answers for the official submission form

**Team lead only · Deadline: Wednesday 20 May 2026 (end of day)**  
You record items **3** and **4** (videos). Paste everything else below.

---

## Mandatory

### 1) Mobile app link

Use the **live Expo web app** (works on phone and desktop; judges can add to home screen):

```
https://aiseekho-hackthon.vercel.app
```

**Login for judges:** Phone `+923000000000` → OTP `1234` → or **Skip — Continue as Guest**

**Important:** In [Vercel](https://vercel.com) → project **aiseekho-hackthon** → Settings → Environment Variables, set:

```
EXPO_PUBLIC_API_URL=https://YOUR-RENDER-API.onrender.com
```

(Replace with your deployed API URL from Render — see [DEPLOY.md](./DEPLOY.md). Redeploy Vercel after saving.)

**Alternative (APK on Drive):** If the form requires a Drive link, build with EAS, upload APK to Google Drive, set sharing to “Anyone with the link”, and paste that URL instead.

---

### 2) GitHub repository

```
https://github.com/Saadia-Asghar/AISEEKHO_HACKTHON
```

Public repo · Challenge 2 · branch `main`.

---

### 3) Demo video (3–5 min)

```
[Paste your Google Drive / YouTube link after you upload]
```

Suggested flow: Home voice/search → Results + map → Pay → Confirm → Trace tab (6 agents) → Bookings reschedule.

---

### 4) Antigravity usage video (2–3 min)

```
[Paste your Google Drive / YouTube link after you upload]
```

Show: Antigravity IDE plans/tasks + browser `GET /api/antigravity/workflow` + one booking trace.

---

### 5) README / documentation

```
https://github.com/Saadia-Asghar/AISEEKHO_HACKTHON/blob/main/README.md
```

Also:

- [docs/SUBMISSION.md](./SUBMISSION.md) — submission checklist  
- [docs/DEPLOY.md](./DEPLOY.md) — deploy API + Vercel  
- [docs/CHALLENGE2_CHECKLIST.md](./CHALLENGE2_CHECKLIST.md) — criteria alignment  

---

### 6) Antigravity trace / logs (ZIP)

**Build locally:**

```powershell
cd d:\project
.\scripts\package-antigravity-traces.ps1
```

**Upload to Google Drive:** `d:\project\dist\khidmatai-antigravity-traces.zip`  
Sharing: **Anyone with the link** → paste:

```
[Paste your Google Drive link to khidmatai-antigravity-traces.zip]
```

ZIP includes: `workflow_definition.json`, sample `session_trace.json`, `backend_workflow_source.md`, and `member_example/` folders for each teammate’s Antigravity exports.

---

## Optional

### 1) Web app link (live until 25 May 2026)

```
https://aiseekho-hackthon.vercel.app
```

Same as mobile web. Credentials: `+923000000000` / OTP `1234` or Skip.

---

### 2) Additional file (PDF / MD / PPTX)

```
https://github.com/Saadia-Asghar/AISEEKHO_HACKTHON/blob/main/docs/CHALLENGE2_CHECKLIST.md
```

---

## Team verification (form fields)

- Enter **all team member full names** who worked on Challenge 2.  
- Upload **CNIC front + back** for each member (not stored in this repo).

---

## 15-minute setup so links actually work for judges

1. **Render API (≈10 min)**  
   - [render.com](https://render.com) → New **Blueprint** → connect repo `AISEEKHO_HACKTHON`  
   - Use root `render.yaml` → add `GOOGLE_API_KEY` + `GOOGLE_MAPS_API_KEY` from `backend/.env`  
   - Copy service URL, e.g. `https://khidmatai-api.onrender.com`  
   - Test: `https://khidmatai-api.onrender.com/health` → `"agents": 6`

2. **Vercel (≈2 min)**  
   - Set `EXPO_PUBLIC_API_URL` = Render URL above → **Redeploy**

3. **GitHub**  
   - `git push origin main` (latest code)

4. **ZIP**  
   - Run `.\scripts\package-antigravity-traces.ps1` → upload ZIP to Drive

5. **Smoke test**  
   - Open https://aiseekho-hackthon.vercel.app → login → search “AC technician G-13” → book → trace

---

## API endpoints for demo / videos

| URL | Use |
|-----|-----|
| `GET …/api/antigravity/workflow` | Show 6 Antigravity nodes |
| `POST …/api/orchestrate` | Full pipeline |
| `GET …/api/trace/{session_id}` | Telemetry after booking |

Replace `…` with your Render API base URL.
