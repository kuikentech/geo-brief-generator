# Geo-Context Engineering Brief Generator — CLAUDE.md

Technical reference for future Claude Code sessions working on this project.

---

## Architecture Overview

```
geo-brief-generator/
  apps/
    web/          React 18 + Vite + react-map-gl (MapLibre) + Tailwind + Zustand
    api/          Python 3.11 + FastAPI + Pydantic v2 + httpx
  packages/       Shared types (currently stub, ready to populate)
  services/       Service stubs (logic is in apps/api/services/)
  infra/supabase/ Supabase migration stubs (optional persistence layer)
  docs/           Architecture and design docs
```

---

## How to Run

### Quick Start (Windows)
```
start.bat
```

### Quick Start (Mac/Linux)
```bash
chmod +x start.sh && ./start.sh
```

### Manual Start

**Backend (Python FastAPI):**
```bash
cd apps/api
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (React + Vite):**
```bash
cd apps/web
npm install
npm run dev
```

Endpoints:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

---

## Environment Variables

Copy `.env.example` to `.env` in project root:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Optional | Enables real Claude AI report generation. Without it, demo report is used. |
| `VITE_API_URL` | Optional | API base URL for frontend (default: http://localhost:8000) |
| `MAPBOX_TOKEN` | Optional | For enhanced Mapbox tiles (not needed — MapLibre free tiles used by default) |
| `SUPABASE_URL` | Optional | For persistent storage (currently in-memory) |
| `SUPABASE_ANON_KEY` | Optional | Supabase auth key |

---

## Key Design Decisions

### AI Fallback Mode
- The app is FULLY functional without an API key
- `apps/api/services/ai_orchestrator.py` contains a complete, production-quality demo report for "Solar Water Purification in Northern Kenya" in `DEMO_REPORT_SECTIONS`
- All 10 report sections are pre-written with realistic content, citations, and confidence levels
- Set `ANTHROPIC_API_KEY` to enable real Claude `claude-sonnet-4-6` generation

### Map Technology
- Uses react-map-gl v7 with maplibre-gl (free, no token required)
- Map style: `https://demotiles.maplibre.org/style.json`
- Alternative free style: `https://tiles.openfreemap.org/styles/liberty`
- Layer data is simulated GeoJSON in `apps/web/src/data/layerData.js`

### Citation System
- All citations use `[SRC-NNN]` format in report text
- Evidence manifest maps SRC-001 → full source metadata
- Frontend parses inline citations and renders them as clickable chips
- Source inspector drawer shows full source details when citation is clicked

### State Management
- Zustand stores: `projectStore`, `mapStore`, `reportStore`
- No persistence (in-memory only for hackathon demo)
- Add Supabase/localStorage for persistence in production

### In-Memory Storage
- `apps/api/main.py` uses Python dicts for project/report storage
- Production: Replace `projects_db` and `reports_db` with Supabase tables
- Schema is in `infra/supabase/`

---

## Layer Registry

Location: `apps/api/data/layer_registry.json`

### Adding a New Layer

1. Add entry to `layer_registry.json`:
```json
{
  "id": "new_layer_id",
  "display_name": "Display Name",
  "description": "What this layer shows",
  "source_name": "Data Provider Name",
  "source_url": "https://...",
  "source_classification": "Government | Globally Recognized Org | Community-Sourced",
  "refresh_frequency": "Annual",
  "geometry_type": "Raster | Vector",
  "units": "unit string",
  "limitation_note": "Known limitations",
  "color_scheme": {"low": "#hex", "mid": "#hex", "high": "#hex"},
  "report_section": "weather_context | infrastructure_context",
  "group": "weather | infrastructure"
}
```

2. Add simulated GeoJSON data in `apps/web/src/data/layerData.js`
3. Add to `useMapStore` `ALL_LAYERS` array in `apps/web/src/stores/mapStore.js`
4. Add color scale to `LAYER_COLOR_SCALES` in layerData.js
5. Add source info to `LAYER_SOURCES` in layerData.js
6. Add rendering logic in `MapCanvas.jsx` if layer type is different from polygon/line/point

---

## How to Update Report Templates

Location: `apps/api/data/report_templates.json`

Each section has:
- `name`: machine key (snake_case)
- `display_name`: human-readable title
- `prompt_role`: what Claude is instructed to write for this section
- `feeds_from`: which layer IDs or evidence types feed this section
- `confidence_factors`: what determines confidence rating

The demo report sections are in `apps/api/services/ai_orchestrator.py` in `DEMO_REPORT_SECTIONS`.

---

## AI Provider Abstraction

The `ai_orchestrator.py` module provides a clean abstraction:

```python
await ai_orchestrator.generate(
    evidence_manifest,   # List of EvidenceItem dicts
    geo_context,         # Dict from map_context.compute()
    e4c_evidence,        # List from e4c_retrieval.retrieve()
    params,              # Project parameters dict
    generation_mode      # "auto" | "ai" | "demo"
)
```

To switch AI providers (e.g., OpenAI), replace the `generate_with_claude()` function body in `ai_orchestrator.py`. The interface is provider-agnostic.

---

## Demo Scenario

The pre-built demo report covers:
- **Location**: Northern Kenya — Marsabit and Turkana counties
- **Objective**: Solar water purification viability for rural communities (500–2,000 persons)
- **Technology**: Solar pump + UV/chlorination treatment
- **Sector**: WASH
- **Key finding**: High solar viability (6.3 kWh/m²/day) offset by severe infrastructure deficit and supply chain challenges

All 10 sections are fully written with:
- 3–5 paragraphs per section
- Inline [SRC-NNN] citations
- Confidence levels (high/medium for most sections)
- Assumptions and limitations lists
- Realistic source references to actual URLs

---

## Project File Map

| File | Purpose |
|------|---------|
| `apps/web/src/pages/ProjectSetup.jsx` | Screen 1: Project parameters form |
| `apps/web/src/pages/MapWorkspace.jsx` | Screen 2: Map + layer panel + context panel |
| `apps/web/src/pages/ReportReview.jsx` | Screen 3: Full report with source inspector |
| `apps/web/src/pages/VersionCompare.jsx` | Screen 4: Side-by-side version diff |
| `apps/web/src/components/map/MapCanvas.jsx` | MapLibre map with drawing tools and layer overlays |
| `apps/web/src/components/map/LayerPanel.jsx` | Left panel with layer toggles |
| `apps/web/src/components/map/ContextPanel.jsx` | Right panel with generate button |
| `apps/web/src/components/report/ReportViewer.jsx` | Report section list |
| `apps/web/src/components/report/SectionCard.jsx` | Individual section with citations |
| `apps/web/src/components/report/SourceDrawer.jsx` | Source inspector panel |
| `apps/web/src/data/layerData.js` | Simulated GeoJSON for all 10 map layers |
| `apps/api/main.py` | FastAPI app with all routes |
| `apps/api/models.py` | All Pydantic schemas |
| `apps/api/services/ai_orchestrator.py` | AI generation + complete demo report |
| `apps/api/services/evidence_builder.py` | Citation key assignment |
| `apps/api/data/layer_registry.json` | Layer metadata for all 10 layers |
| `apps/api/data/e4c_solutions.json` | 5 seed E4C solutions |
| `apps/api/data/report_templates.json` | Section prompt templates |

---

## Hackathon Notes

- All E4C solution URLs point to real engineeringforchange.org URLs
- All data source URLs are real and publicly accessible
- The app was designed for judges to run locally without any accounts or API keys
- Forest green theme (#2D6A4F primary) is applied throughout via Tailwind config
- "Human Review Required" disclaimer appears on every AI-generated element
