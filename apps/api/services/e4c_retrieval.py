"""
E4C Solutions Retrieval Service
Loads seed E4C solutions from local JSON and filters by relevance to
the technology type and sector of the project.
"""
import json
import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def load_solutions() -> List[Dict[str, Any]]:
    """Load all seed solutions from JSON."""
    path = os.path.join(DATA_DIR, "e4c_solutions.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load e4c_solutions.json: {e}")
        return []


TECH_KEYWORDS = {
    "Solar Water Purification": ["solar", "water", "purification", "disinfection", "pump", "wash"],
    "Biogas": ["biogas", "digester", "anaerobic", "energy", "organic"],
    "Clean Cookstoves": ["cookstove", "cook", "stove", "biomass", "fuel", "health"],
    "Solar Energy": ["solar", "pv", "photovoltaic", "energy", "electricity", "power"],
    "Rainwater Harvesting": ["rainwater", "harvest", "catchment", "storage", "water"],
    "Sanitation": ["sanitation", "toilet", "latrine", "fecal", "hygiene", "wash"],
    "Other": [],
}

SECTOR_KEYWORDS = {
    "WASH": ["water", "sanitation", "hygiene", "wash", "treatment", "supply"],
    "Energy": ["energy", "electricity", "solar", "power", "fuel", "biogas"],
    "Health": ["health", "disease", "nutrition", "clinic", "medical"],
    "Agriculture": ["agriculture", "crop", "irrigation", "food", "farm"],
    "Other": [],
}


def score_solution(solution: Dict[str, Any], technology_type: str, sector: str) -> float:
    """Score a solution's relevance to the given technology and sector (0–1)."""
    score = 0.0
    title_lower = (solution.get("title", "") + " " + solution.get("description", "")).lower()

    # Direct tech/sector match
    if solution.get("technology_type", "").lower() == technology_type.lower():
        score += 0.4
    if solution.get("sector", "").lower() == sector.lower():
        score += 0.3

    # Keyword match
    tech_kws = TECH_KEYWORDS.get(technology_type, [])
    sector_kws = SECTOR_KEYWORDS.get(sector, [])
    all_kws = set(tech_kws + sector_kws)

    matched = sum(1 for kw in all_kws if kw in title_lower)
    if all_kws:
        score += 0.3 * (matched / len(all_kws))

    return min(1.0, score)


def retrieve(
    technology_type: str,
    sector: str,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Retrieve and rank E4C solutions relevant to the given technology and sector.
    Returns top_k most relevant solutions.
    """
    all_solutions = load_solutions()

    scored = []
    for sol in all_solutions:
        s = score_solution(sol, technology_type, sector)
        scored.append((s, sol))

    # Sort by score descending
    scored.sort(key=lambda x: -x[0])

    # Return top_k with score attached
    results = []
    for score, sol in scored[:top_k]:
        results.append({**sol, "_relevance_score": round(score, 3)})

    return results
