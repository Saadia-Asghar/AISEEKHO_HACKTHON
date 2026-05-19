# KhidmatAI PRD — Working Notes

Source: `KhidmatAI_PRD.docx` (Google Antigravity Hackathon 2026, Challenge 2)

**Tagline:** *Speak your need. KhidmatAI handles the rest.*

---

## What KhidmatAI is

Agentic platform for Pakistan’s informal economy (plumbers, AC techs, tutors, beauticians, etc.). User speaks/types in **Urdu, Roman Urdu, or English** → full lifecycle without a human dispatcher.

**Antigravity rule:** Not a thin wrapper — Antigravity is the orchestration brain; every agent call, tool use, and state change is traced.

---

## 6-agent pipeline (PRD §4.2)

| Step | Agent | Output |
|------|--------|--------|
| 1 | Intent Agent | Structured intent JSON |
| 2 | Discovery Agent | Providers within radius (Maps or mock) |
| 3 | Ranking Agent | Top pick + **top-3 score breakdown** |
| 4 | Booking Agent | Receipt, DB write, **PENDING→CONFIRMED** |
| 5 | Follow-Up Agent | Reminder + **completion prompt** |
| 6 | Trace Agent | Human-readable full workflow log |

---

## Functional requirements checklist

| ID | Requirement | Status |
|----|-------------|--------|
| FR-1 | NLU: Urdu / Roman Urdu / English | Done (rule-based + Gemini Pro integration) |
| FR-2 | Discovery: 5 km default, ≥3 candidates, mock fallback | Done (50 providers, DHA radius widening, Maps integration) |
| FR-3 | Ranking: **40% distance, 35% rating, 25% availability** | Done (transparent breakdown in mobile + trace) |
| FR-4 | Booking sim: KHI-* id, receipt, state transitions | Done (SQLite database persistent write) |
| FR-5 | Follow-up: 1 hr reminder + completion check | Done (Free high-speed WhatsApp redirect deep links active) |
| FR-6 | Full agent trace (mandatory deliverable) | Done (Dedicated mobile Trace tab + Next.js evaluator dashboard) |

---

## Primary demo (must pass on stage)

**Input:** `Mujhe kal subah G-13 mein AC technician chahiye`

**Expected:**
- Intent: AC Technician · G-13 · Tomorrow morning
- **عادل AC ماسٹر** (or nearest recommended) ~2.1 km, 4.8★
- Booking: **10:00 AM**, id `KHI-YYYYMMDD-001`, CONFIRMED (after pay)
- Reminder: 1 hr before (9:00 AM)
- 6-step trace with reasoning

---

## Additional test scenarios (build/verify)

1. **Plumber EN:** `I need a plumber in F-7 urgently` ➔ Urgency, nearest within ~2 hrs (Passing)
2. **Tutor Urdu:** `مجھے ایک میتھ کا ٹیوٹر چاہیے ایٹھویں میں` ➔ I-8 math tutor (Passing)
3. **Edge:** `Electrician in DHA Phase 9 right now` ➔ Widen to DHA, nearest in 10-20km (Passing)

---

## Tech stack (PRD vs current repo)

| PRD | Current | Status |
|-----|---------|--------|
| Flutter mobile (required) | Expo React Native | **Expo Active** — Strong UI, Stitch aesthetics, Urdu toggle |
| Firebase / Sheets booking | SQLite persistent DB | **Done** (Fully operational at `khidmat.db`) |
| Google Maps Places | Geocoding API + Fallback | **Done** (API keys loaded and active) |
| Gemini via Antigravity tool | GenAI client | **Done** (Gemini Pro flash integrated in Intent agent) |
| 50 providers, 10 sectors | 50 providers | **Done** (Fully expanded to 50 providers in 10 sectors) |

---

## Deliverables (D1–D6)

- [x] Mobile app (Expo → Stitch theme, Urdu/English toggle, Voice visualizer)
- [x] Web dashboard (Next.js dashboard at `khidmat-ai/web`)
- [ ] Demo video 3–5 min (Pending recording)
- [x] Agent trace (Dedicated mobile Trace tab + Copy Trace button)
- [x] README (Complete with Mermaid Architecture diagram & node mappings)
- [x] Mock dataset (50 providers, 10 sectors in `providers.json`)

---

## Evaluation weights (map features to score)

| Criterion | Weight | How we win |
|-----------|--------|------------|
| Antigravity | 25% | Node & Skill mapping fully documented + visible 6-agent trace. |
| Agentic workflow | 20% | Visible planning trace: Plan ➔ Decide ➔ Act ➔ Follow-up |
| Matching | 20% | Transparent 40/35/25 scoring breakdown shown for each provider. |
| Action simulation | 15% | Real SQLite persistent booking row + receipt generation |
| Technical | 10% | 6/6 pytest pipeline validations passing (DHA radius widening, Urdu script, F-7 urgent) |
| UX | 10% | Multilingual urdu toggle, custom voice recording waveform, free WhatsApp chat deep-links |

---

## Constraints (non-negotiable)

- Not a listing app — **agentic automation** first  
- At least **one end-to-end booking** on demo  
- **No real PII** — mock names/phones only  
- Antigravity central; external LLMs only as tools  

