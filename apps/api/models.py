from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class TechnologyType(str, Enum):
    solar_water = "Solar Water Purification"
    biogas = "Biogas"
    cookstoves = "Clean Cookstoves"
    solar_energy = "Solar Energy"
    rainwater = "Rainwater Harvesting"
    sanitation = "Sanitation"
    other = "Other"


class Sector(str, Enum):
    wash = "WASH"
    energy = "Energy"
    health = "Health"
    agriculture = "Agriculture"
    other = "Other"


class ConfidenceLevel(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class SourceClassification(str, Enum):
    government = "Government"
    global_org = "Globally Recognized Org"
    community = "Community-Sourced"
    e4c = "E4C Solutions Library"
    academic = "Academic / Peer-Reviewed"


# ─── Domain Models ────────────────────────────────────────────────────────────

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: Optional[str] = None
    display_name: Optional[str] = None
    organization: Optional[str] = None


class LayerSelection(BaseModel):
    layer_id: str
    active: bool = True
    opacity: float = Field(default=0.7, ge=0.0, le=1.0)


class GeometrySelection(BaseModel):
    type: str = "Feature"
    properties: Optional[Dict[str, Any]] = None
    geometry: Optional[Dict[str, Any]] = None


class InputParameterSet(BaseModel):
    project_title: str
    geography: str
    engineering_objective: str
    technology_type: str
    sector: str
    scenario_description: Optional[str] = None
    geometry: Optional[GeometrySelection] = None
    active_layers: Optional[List[str]] = None


class DataSnapshot(BaseModel):
    layer_id: str
    snapshot_time: datetime = Field(default_factory=datetime.utcnow)
    values: Dict[str, Any] = {}
    source_name: str
    source_url: Optional[str] = None
    source_classification: str
    coverage_notes: Optional[str] = None
    limitation_note: Optional[str] = None


class EvidenceItem(BaseModel):
    id: str  # SRC-001 format
    title: str
    provider: Optional[str] = None
    classification: str
    url: Optional[str] = None
    excerpt: Optional[str] = None
    why_included: Optional[str] = None
    geographic_relation: Optional[str] = None
    access_date: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    confidence: ConfidenceLevel = ConfidenceLevel.medium
    data_type: Optional[str] = None


class ClaimCitationMap(BaseModel):
    claim_text: str
    citation_keys: List[str]
    confidence: ConfidenceLevel
    reasoning_type: Optional[str] = None  # "empirical", "modeled", "expert", "literature"


class ReportSection(BaseModel):
    name: str
    display_name: str
    order: int = 0
    content: str
    citation_keys: List[str] = []
    confidence: ConfidenceLevel = ConfidenceLevel.medium
    reasoning_type: Optional[str] = None
    basis: Optional[str] = None
    assumptions: List[str] = []
    limitations: List[str] = []
    claims: List[ClaimCitationMap] = []


class Report(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    title: str
    version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sections: List[ReportSection] = []
    sources: List[EvidenceItem] = []
    validation_warnings: List[str] = []
    generation_mode: str = "demo"  # "demo" | "ai"
    parameter_snapshot: Optional[InputParameterSet] = None


class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    geography: str
    engineering_objective: str
    technology_type: str
    sector: str
    scenario_description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    geo_context: Optional[Dict[str, Any]] = None
    e4c_evidence: Optional[List[Dict[str, Any]]] = None
    evidence_manifest: Optional[List[EvidenceItem]] = None
    reports: List[str] = []


# ─── Request/Response Models ───────────────────────────────────────────────────

class CreateProjectRequest(BaseModel):
    title: str
    geography: str
    engineering_objective: str
    technology_type: str
    sector: str
    scenario_description: Optional[str] = None


class CreateProjectResponse(BaseModel):
    id: str
    title: str
    created_at: datetime


class ComputeContextRequest(BaseModel):
    geometry: Optional[GeometrySelection] = None
    layers: Optional[List[str]] = None


class LayerConfig(BaseModel):
    id: str
    display_name: str
    description: str
    source_name: str
    source_url: Optional[str] = None
    source_classification: str
    refresh_frequency: Optional[str] = None
    geometry_type: Optional[str] = None
    units: Optional[str] = None
    limitation_note: Optional[str] = None
    group: str = "weather"


class LayerSummary(BaseModel):
    layer_id: str
    stats: Dict[str, Any]
    source_name: str
    source_classification: str
    limitation_note: Optional[str] = None


class ReportRequest(BaseModel):
    geometry: Optional[GeometrySelection] = None
    active_layers: Optional[List[str]] = None
    project_title: Optional[str] = None
    engineering_objective: Optional[str] = None
    technology_type: Optional[str] = None
    sector: Optional[str] = None
    scenario_description: Optional[str] = None


class CitationRef(BaseModel):
    id: str
    title: str
    url: Optional[str] = None
    classification: str


class ReportResponse(BaseModel):
    id: str
    project_id: str
    title: str
    version: int
    created_at: datetime
    sections: List[ReportSection]
    sources: List[EvidenceItem]
    validation_warnings: List[str]
    generation_mode: str


class ReportVersionDiff(BaseModel):
    section_name: str
    display_name: str
    v1_content: str
    v2_content: str
    changed: bool
    changed_assumptions: List[str] = []
    changed_citations: List[str] = []


class HealthResponse(BaseModel):
    status: str
    version: str
    ai_enabled: bool
