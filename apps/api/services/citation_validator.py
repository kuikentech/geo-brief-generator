"""
Citation Validator Service
Validates that all citation keys referenced in report sections
actually exist in the evidence manifest.
"""
import re
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

CITATION_PATTERN = re.compile(r"\[([A-Z]+-\d+)\]")


def validate(
    sections: List[Dict[str, Any]],
    evidence_manifest: List[Dict[str, Any]]
) -> Tuple[List[str], List[Dict[str, Any]]]:
    """
    Validate citations in sections against evidence manifest.

    Returns:
        - List of warning strings
        - Cleaned sections (with invalid citations flagged)
    """
    valid_ids = {item["id"] for item in evidence_manifest}
    warnings = []
    cleaned_sections = []

    for section in sections:
        content = section.get("content", "")
        cited_keys = section.get("citation_keys", [])

        # Find all citations embedded in content text
        inline_citations = set(CITATION_PATTERN.findall(content))
        all_cited = set(cited_keys) | inline_citations

        # Check for invalid citations
        invalid = all_cited - valid_ids
        if invalid:
            for inv in invalid:
                warning = f"Section '{section.get('name', '?')}': Citation {inv} not found in evidence manifest"
                warnings.append(warning)
                logger.warning(warning)

        # Find citations in manifest but not referenced in section
        orphaned = set(cited_keys) - inline_citations
        if orphaned and content:
            # Add them to content as a footnote note (just keep them in citation_keys)
            pass

        cleaned_sections.append({
            **section,
            "citation_keys": sorted(list(all_cited & valid_ids)),
            "_validation": {
                "inline_found": sorted(list(inline_citations)),
                "invalid_refs": sorted(list(invalid)),
                "status": "warnings" if invalid else "ok"
            }
        })

    if not warnings:
        logger.info("Citation validation passed — all citations valid")
    else:
        logger.warning(f"Citation validation: {len(warnings)} warning(s)")

    return warnings, cleaned_sections


def check_orphaned_sources(
    sections: List[Dict[str, Any]],
    evidence_manifest: List[Dict[str, Any]]
) -> List[str]:
    """Find evidence items that are never cited in any section."""
    cited_anywhere = set()
    for section in sections:
        content = section.get("content", "")
        cited_anywhere |= set(CITATION_PATTERN.findall(content))
        cited_anywhere |= set(section.get("citation_keys", []))

    all_ids = {item["id"] for item in evidence_manifest}
    orphaned = all_ids - cited_anywhere
    return sorted(list(orphaned))
