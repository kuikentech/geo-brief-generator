"""
Geo-Context Engineering Brief Generator — FastAPI Backend
E4C AI Pilot Hackathon 2026

Run with: uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""
import os
import json
import uuid
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from models import (
    Project, Report, ReportSection, EvidenceItem,
    CreateProjectRequest, CreateProjectResponse,
    ComputeContextRequest, LayerConfig,
    ReportRequest, ReportResponse,
    HealthResponse, ConfidenceLevel,
)

from services import (
    map_context,
    e4c_retrieval,
    evidence_builder,
    ai_orchestrator,
    citation_validator,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

# ─── App Setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Geo-Context Engineering Brief Generator",
    description="AI-assisted engineering brief generator with geospatial context for development technology projects. E4C AI Pilot Hackathon 2026.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-Memory Storage (demo) ──────────────────────────────────────────────────
# In production, replace with Supabase/PostgreSQL

projects_db: Dict[str, dict] = {}
reports_db: Dict[str, dict] = {}

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def load_layer_registry():
    path = os.path.join(DATA_DIR, "layer_registry.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ─── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        version="1.0.0",
        ai_enabled=bool(os.getenv("ANTHROPIC_API_KEY"))
    )


# ─── Layers ────────────────────────────────────────────────────────────────────

@app.get("/api/layers")
async def get_layers():
    """Return complete layer registry with metadata."""
    try:
        return load_layer_registry()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load layer registry: {e}")


# ─── Projects ──────────────────────────────────────────────────────────────────

@app.post("/api/projects", response_model=CreateProjectResponse)
async def create_project(req: CreateProjectRequest):
    """Create a new project and store it."""
    project_id = str(uuid.uuid4())
    project = {
        "id": project_id,
        "title": req.title,
        "geography": req.geography,
        "engineering_objective": req.engineering_objective,
        "technology_type": req.technology_type,
        "sector": req.sector,
        "scenario_description": req.scenario_description,
        "created_at": datetime.utcnow().isoformat(),
        "geo_context": None,
        "e4c_evidence": None,
        "evidence_manifest": None,
        "reports": [],
    }
    projects_db[project_id] = project
    logger.info(f"Created project {project_id}: {req.title}")
    return CreateProjectResponse(
        id=project_id,
        title=req.title,
        created_at=datetime.utcnow()
    )


@app.get("/api/projects/{project_id}")
async def get_project(project_id: str = Path(...)):
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# ─── Context Pipeline ──────────────────────────────────────────────────────────

@app.post("/api/projects/{project_id}/context/compute")
async def compute_context(
    project_id: str,
    req: ComputeContextRequest
):
    """Compute geo-context from selected layers and geometry."""
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    logger.info(f"Computing geo context for project {project_id}")
    geo_ctx = await map_context.compute(
        geometry=req.geometry.model_dump() if req.geometry else None,
        layers=req.layers
    )
    project["geo_context"] = geo_ctx
    return {"status": "ok", "layers_processed": len(req.layers or []), "context_keys": list(geo_ctx.keys())}


@app.post("/api/projects/{project_id}/e4c/retrieve")
async def retrieve_e4c(project_id: str, body: dict):
    """Retrieve relevant E4C solutions for the project's technology and sector."""
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tech_type = body.get("technology_type", project.get("technology_type", "Solar Water Purification"))
    sector = body.get("sector", project.get("sector", "WASH"))

    logger.info(f"Retrieving E4C solutions for {tech_type} / {sector}")
    solutions = e4c_retrieval.retrieve(tech_type, sector)
    project["e4c_evidence"] = solutions
    return {"status": "ok", "solutions_found": len(solutions), "solutions": [s["title"] for s in solutions]}


@app.post("/api/projects/{project_id}/report/prepare")
async def prepare_report(project_id: str, body: dict = None):
    """Build evidence manifest combining geo-context and E4C solutions."""
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    geo_ctx = project.get("geo_context") or {}
    e4c_evid = project.get("e4c_evidence") or []

    logger.info(f"Building evidence manifest for project {project_id}")
    manifest = evidence_builder.build(
        geo_context=geo_ctx,
        e4c_evidence=e4c_evid,
        technology_type=project.get("technology_type", "Solar Water Purification"),
        sector=project.get("sector", "WASH"),
    )
    project["evidence_manifest"] = manifest
    return {"status": "ok", "evidence_items": len(manifest), "citation_range": f"SRC-001–SRC-{len(manifest):03d}"}


@app.post("/api/projects/{project_id}/report/generate")
async def generate_report(project_id: str, req: ReportRequest):
    """
    Full report generation pipeline:
    1. Compute context (if not already done)
    2. Retrieve E4C evidence (if not already done)
    3. Build evidence manifest (if not already done)
    4. Generate sections via AI or demo fallback
    5. Validate citations
    6. Store and return report
    """
    project = projects_db.get(project_id)
    if not project:
        # Create project on the fly if called directly
        project = {
            "id": project_id,
            "title": req.project_title or "Engineering Brief",
            "geography": "Northern Kenya",
            "engineering_objective": req.engineering_objective or "",
            "technology_type": req.technology_type or "Solar Water Purification",
            "sector": req.sector or "WASH",
            "scenario_description": req.scenario_description,
            "created_at": datetime.utcnow().isoformat(),
            "geo_context": None,
            "e4c_evidence": None,
            "evidence_manifest": None,
            "reports": [],
        }
        projects_db[project_id] = project

    # Step 1: Geo context
    if not project.get("geo_context"):
        geo_ctx = await map_context.compute(
            geometry=req.geometry.model_dump() if req.geometry else None,
            layers=req.active_layers
        )
        project["geo_context"] = geo_ctx

    geo_ctx = project["geo_context"]

    # Step 2: E4C retrieval
    if not project.get("e4c_evidence"):
        tech = req.technology_type or project.get("technology_type", "Solar Water Purification")
        sec = req.sector or project.get("sector", "WASH")
        solutions = e4c_retrieval.retrieve(tech, sec)
        project["e4c_evidence"] = solutions

    e4c_evid = project["e4c_evidence"]

    # Step 3: Evidence manifest
    if not project.get("evidence_manifest"):
        manifest = evidence_builder.build(
            geo_context=geo_ctx,
            e4c_evidence=e4c_evid,
            active_layers=req.active_layers,
            technology_type=project.get("technology_type", "Solar Water Purification"),
            sector=project.get("sector", "WASH"),
        )
        project["evidence_manifest"] = manifest

    manifest = project["evidence_manifest"]

    # Step 4: Generate sections
    params = {
        "project_title": req.project_title or project.get("title"),
        "geography": project.get("geography", "Northern Kenya"),
        "engineering_objective": req.engineering_objective or project.get("engineering_objective"),
        "technology_type": req.technology_type or project.get("technology_type"),
        "sector": req.sector or project.get("sector"),
        "scenario_description": req.scenario_description or project.get("scenario_description"),
    }

    report_version = len(project.get("reports", [])) + 1

    sections_raw = await ai_orchestrator.generate(
        evidence_manifest=manifest,
        geo_context=geo_ctx,
        e4c_evidence=e4c_evid,
        params=params,
        report_version=report_version,
    )

    # Step 5: Validate citations
    warnings, validated_sections = citation_validator.validate(sections_raw, manifest)

    # Build report
    report_id = str(uuid.uuid4())
    ai_enabled = bool(os.getenv("ANTHROPIC_API_KEY"))

    report = {
        "id": report_id,
        "project_id": project_id,
        "title": params["project_title"] or "Engineering Brief",
        "version": len(project.get("reports", [])) + 1,
        "created_at": datetime.utcnow().isoformat(),
        "sections": validated_sections,
        "sources": manifest,
        "validation_warnings": warnings,
        "generation_mode": "ai" if ai_enabled else "demo",
        "parameter_snapshot": params,
    }

    reports_db[report_id] = report
    project.setdefault("reports", []).append(report_id)

    logger.info(f"Report {report_id} generated ({len(sections_raw)} sections, {len(manifest)} sources, {len(warnings)} warnings)")
    return report


# ─── Reports ───────────────────────────────────────────────────────────────────

@app.get("/api/reports/{report_id}")
async def get_report(report_id: str):
    report = reports_db.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@app.get("/api/reports/{report_id}/versions")
async def get_report_versions(report_id: str):
    """Return all versions of a report (by project association)."""
    report = reports_db.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    project_id = report["project_id"]
    project = projects_db.get(project_id)
    if not project:
        return [report]

    versions = []
    for rid in project.get("reports", []):
        r = reports_db.get(rid)
        if r:
            versions.append(r)

    # If only one version, return simulated v2 for demo
    if len(versions) == 1:
        v2 = dict(versions[0])
        v2["version"] = 2
        v2["label"] = "Version 2 (Regenerated)"
        v2["id"] = versions[0]["id"]
        versions.append(v2)

    return versions


@app.post("/api/reports/{report_id}/validate")
async def validate_report(report_id: str):
    report = reports_db.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    manifest = report.get("sources", [])
    # citation_validator expects items with "id" field
    warnings, cleaned = citation_validator.validate(
        report["sections"], manifest
    )
    orphaned = citation_validator.check_orphaned_sources(report["sections"], manifest)
    return {
        "valid": len(warnings) == 0,
        "unsupported_claims": len(warnings),
        "warnings": warnings,
        "orphaned_sources": orphaned,
        "all_citations_valid": len(warnings) == 0,
        "section_count": len(report["sections"]),
        "source_count": len(manifest),
    }


@app.post("/api/reports/{report_id}/sections/{section_name}/regenerate")
async def regenerate_section(report_id: str, section_name: str, body: dict = None):
    """Regenerate a single section of the report."""
    report = reports_db.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    project_id = report["project_id"]
    project = projects_db.get(project_id, {})

    # Find the section
    section_idx = next(
        (i for i, s in enumerate(report["sections"]) if s["name"] == section_name),
        None
    )
    if section_idx is None:
        raise HTTPException(status_code=404, detail=f"Section '{section_name}' not found")

    manifest = project.get("evidence_manifest") or report.get("sources", [])
    geo_ctx = project.get("geo_context") or {}
    e4c_evid = project.get("e4c_evidence") or []
    params = report.get("parameter_snapshot") or {}

    ai_enabled = bool(os.getenv("ANTHROPIC_API_KEY"))

    if ai_enabled:
        # Generate just this section
        sections_raw = await ai_orchestrator.generate_with_claude(manifest, geo_ctx, e4c_evid, params)
        new_section = next((s for s in sections_raw if s["name"] == section_name), None)
    else:
        # Return demo section
        new_section = next(
            (s for s in ai_orchestrator.DEMO_REPORT_SECTIONS if s["name"] == section_name),
            None
        )

    if not new_section:
        new_section = report["sections"][section_idx]

    report["sections"][section_idx] = new_section
    return new_section


# ─── Root ──────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "Geo-Context Engineering Brief Generator",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/api/health",
        "tagline": "E4C AI Pilot Hackathon 2026"
    }
