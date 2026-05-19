# 🟢 KhidmatAI — Bolein, Hum Karein
**AI-Powered Service Orchestrator for Pakistan’s Informal Economy**  
*Google Antigravity Hackathon 2026 — Challenge 2 Submission*

---

## 🎨 System Design & Aesthetics

| | |
|---|---|
| **Published Framer Prototype** | [https://splendid-gibbon-403400.framer.app](https://splendid-gibbon-403400.framer.app) |
| **UX & Visual Aesthetics** | Sleek glassmorphism, responsive Urdu/English toggle, custom voice record visualizers. |
| **Harmonious Palette** | HSL tailored slate/violet base with jade/amber accents (`khidmat-ai/mobile/constants/theme.ts`) |

---

## 🧠 Google Antigravity Multi-Agent Architecture

KhidmatAI is architected around **Google Antigravity** as the central brain. Every step of the informal booking lifecycle — from natural language parsing to provider matching, booking, and post-service follow-up — is modeled as specialized, interconnected Antigravity nodes.

```mermaid
graph TD
    User([🗣️ Multilingual User Request]) --> IntentNode[🧠 Node 1: Intent Understanding Agent]
    
    %% Intent NLU
    IntentNode -->|Parses Urdu/Roman/EN| IntentJSON[📄 Structured Intent JSON]
    
    %% Discovery Loop
    IntentJSON --> DiscoverNode[🔍 Node 2: Provider Discovery Agent]
    DiscoverNode -->|Calls Maps Geocoding API| DiscoveryFilter{Nearby Providers Found?}
    DiscoveryFilter -->|Yes| MatcherNode[⚖️ Node 3: Matching & Ranking Agent]
    DiscoveryFilter -->|No: < 3 Candidates| RadiusWiden[🔄 Multi-Step Loop: Widen Radius +5km]
    RadiusWiden --> DiscoverNode
    
    %% Matcher Scoring
    MatcherNode -->|Weighted Scoring 40/35/25| TopCandidate[🏆 Top Recommended Candidate]
    
    %% Booking & Action Simulation
    TopCandidate --> BookingNode[📅 Node 4: Booking Simulation Agent]
    BookingNode -->|Write to SQLite / data/khidmat.db| BookingReceipt[🧾 Digital Booking Receipt]
    
    %% Follow-Up Automation
    BookingReceipt --> FollowUpNode[🔔 Node 5: Follow-Up Agent]
    FollowUpNode -->|1hr Alert & WhatsApp Deep-Link| ScheduledTask[📅 Scheduled Notifications Log]
    
    %% Telemetry Compiled
    context[💼 Shared Session Context] --> TraceNode[📋 Node 6: Trace & Telemetry Agent]
    TraceNode -->|Formats Decision Log| WebApp[🌐 Web Evaluator Dashboard]
    TraceNode -->|Renders Collapsible planning nodes| MobileApp[📲 Mobile App Trace Tab]

    style IntentNode fill:#7C3AED,stroke:#fff,stroke-width:2px,color:#fff
    style DiscoverNode fill:#7C3AED,stroke:#fff,stroke-width:2px,color:#fff
    style MatcherNode fill:#7C3AED,stroke:#fff,stroke-width:2px,color:#fff
    style BookingNode fill:#7C3AED,stroke:#fff,stroke-width:2px,color:#fff
    style FollowUpNode fill:#7C3AED,stroke:#fff,stroke-width:2px,color:#fff
    style TraceNode fill:#10B981,stroke:#fff,stroke-width:2px,color:#fff
```

### 🗺️ Antigravity Node & Skill Mapping

| Node | Antigravity Agent | Registered Skill | Registered Tools | Output Artifact |
|------|-------------------|------------------|------------------|-----------------|
| **Node 1** | `IntentAgent` | Multilingual NLU Parser | `Gemini Pro Flash`, `Regex NLU` | Structured Intent JSON |
| **Node 2** | `DiscoveryAgent` | Geographic Querying | `Google Maps Geocoding`, `Mock Dataset` | Candidate List (< 5 km) |
| **Node 3** | `RankingAgent` | Multi-Criteria Decision | `Distance Matrix`, `Weighted Formula` | Recommended Provider + Reason |
| **Node 4** | `BookingAgent` | Action Simulation | `SQLite Database client` | Booking Receipt (`KHI-*`) |
| **Node 5** | `FollowUpAgent` | Notifications scheduler | `WhatsApp link API`, `Reminder DB` | Follow-up & Feedback Event Logs |
| **Node 6** | `TraceAgent` | Telemetry aggregator | `System telemetry reader` | Human-Readable trace JSON |

---

## 🛠️ Stack & Repository Layout

```text
d:\project
├── backend/                  # FastAPI backend containing the core 6-agent pipeline
│   ├── app/
│   │   ├── agents/           # Specialized Antigravity node definitions
│   │   ├── services/         # Integrations (Maps Geocoding, NLU parsing, WhatsApp)
│   │   └── data/             # 50-provider mock dataset across 10 sectors (G-13, DHA, etc.)
│   └── tests/                # Automated pipeline validation tests (6/6 passing)
├── khidmat-ai/
│   ├── mobile/               # Premium Expo React Native App (Stitch theme, Multilingual UI)
│   └── web/                  # Next.js Evaluator Web Dashboard (Interactive Agent traces)
└── scripts/                  # One-click startup scripts
```

---

## 🚀 One-Click Developer Setup

Ensure you have your active keys configured in `backend/.env`:
```env
GOOGLE_API_KEY=AIzaSyD0Nfq9Sl0C7pDizsgG3q21E1vPr3zJ5Fg
GOOGLE_MAPS_API_KEY=AIzaSyBHgtKHUb8USWB1MMsul2IwOu9iWJpnROk
```

Start the entire system locally:
```powershell
.\scripts\preview.ps1
```

*   **Mobile Simulator App**: [http://localhost:8081](http://localhost:8081)
*   **FastAPI Backend**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
*   **Interactive Web Dashboard**: [http://localhost:3000](http://localhost:3000)
*   **Demo Bypass Phone**: `+923000000000` / OTP `1234` (or click **Skip** at auth)

---

## 🧪 Submission Verification

To run automated pipeline assertions demonstrating complete end-to-end multi-agent execution (including radius widening, Urdu script parsing, geocoded distance matching, and database commits):

```powershell
cd backend
python -m pytest tests/test_pipeline.py -v
```

All **6/6 tests are guaranteed to pass** successfully!
