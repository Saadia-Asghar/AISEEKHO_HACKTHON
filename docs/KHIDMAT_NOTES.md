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
| FR-1 | NLU: Urdu / Roman Urdu / English | Done (rule-based + optional Gemini) |
| FR-2 | Discovery: 5 km default, ≥3 candidates, mock fallback | Done (50 providers, 10 km widen) |
| FR-3 | Ranking: **40% distance, 35% rating, 25% availability** | Done |
| FR-4 | Booking sim: KHI-* id, receipt, state transitions | Done |
| FR-5 | Follow-up: 1 hr reminder + completion check | Done |
| FR-6 | Full agent trace (mandatory deliverable) | Done (6 agents + Trace Agent summary) |

---

## Primary demo (must pass on stage)

**Input:** `Mujhe kal subah G-13 mein AC technician chahiye`

**Expected:**
- Intent: AC Technician · G-13 · Tomorrow morning
- **Ali AC Services** ~2.1 km, 4.8★
- Booking: **10:00 AM**, id `KHI-YYYYMMDD-001`, CONFIRMED
- Reminder: 1 hr before (9:00 AM)
- 6-step trace with reasoning

---

## Additional test scenarios (build/verify)

1. **Plumber EN:** `I need a plumber in F-7 urgently` → urgency, nearest within ~2 hrs  
2. **Tutor Urdu:** `مجھے ایک میتھ کا ٹیوٹر چاہیے ایٹھویں میں` → I-8 math tutor  
3. **Edge:** `Electrician in DHA Phase 9 right now` → widen to 10 km or explain no match  

---

## Tech stack (PRD vs current repo)

| PRD | Current | Action |
|-----|---------|--------|
| Flutter mobile (required) | Expo React Native | **Gap** — Expo OK for hackathon speed; Flutter if judges insist |
| Firebase / Sheets booking | SQLite mock | OK per PRD mock guidance |
| Google Maps Places | Mock JSON | Hook in Discovery Agent when API key ready |
| Gemini via Antigravity tool | Optional `GOOGLE_API_KEY` | Wire in Intent Agent |
| 50 providers, 10 sectors | Was 7 | **Expanded** in `providers.json` |

---

## Deliverables (D1–D6)

- [x] Mobile app (Expo → KhidmatAI branding)
- [ ] Web dashboard (optional)
- [ ] Demo video 3–5 min
- [x] Agent trace (API + app tab + Trace Agent summary)
- [x] README
- [x] Mock dataset (target 50 providers)

---

## Build order (PRD §10)

1. **Phase 1:** Antigravity agents + Intent + Discovery mock  
2. **Phase 2:** Ranking + Booking receipt + Follow-up + Trace  
3. **Phase 3:** UI polish, demo video, README diagram  

**Next session priorities:** Maps API key, Flutter port (if required), FCM mock, demo video, web trace dashboard.

---

## Evaluation weights (map features to score)

| Criterion | 25/20/20/15/10/10 | How we win |
|-----------|-------------------|------------|
| Antigravity | 25% | Document + skills + 6-agent trace as workflow nodes |
| Agentic workflow | 20% | Visible plan → decide → act → follow-up |
| Matching | 20% | Transparent 40/35/25 formula, top-3 shown |
| Action simulation | 15% | Real DB row + receipt text, not recommendation-only |
| Technical | 10% | Edge cases (radius widen, fallback) |
| UX | 10% | Multilingual chips + Roman Urdu demo |

---

## Constraints (non-negotiable)

- Not a listing app — **agentic automation** first  
- At least **one end-to-end booking** on demo  
- **No real PII** — mock names/phones only  
- Antigravity central; external LLMs only as tools  
