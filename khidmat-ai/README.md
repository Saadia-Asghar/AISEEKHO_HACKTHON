# KhidmatAI monorepo

| Piece | Path | Role |
|-------|------|------|
| **Mobile app** | `mobile/` | Expo Router — production UI |
| **API** | `../backend/` | FastAPI + SQLite (repo root, not this folder) |
| **Web dashboard** | `web/` | Next.js orchestrate demo |
| **Design** | [Framer](https://splendid-gibbon-403400.framer.app/) | Visual prototype |

## Quick start

From repo root:

```powershell
.\scripts\preview.ps1
```

Or manually:

```powershell
# Terminal 1 — API
cd ..\backend
.\.venv\Scripts\Activate.ps1
python run.py

# Terminal 2 — App
cd mobile
npm install
$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"   # use LAN IP on phone
npx expo start
```

Login: any `+92` number → OTP **1234**.

## Docs

- `../docs/FRAMER_LINK.md` — Framer ↔ screen mapping
- `../docs/DESIGN_FRAMER_PROMPT.md` — design prompts
- `../README.md` — full project overview
