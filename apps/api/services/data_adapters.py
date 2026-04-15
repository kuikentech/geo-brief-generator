"""
Data Adapters
Normalized adapters for external APIs with graceful fallback to cached data.
"""
import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# ─── NASA POWER Adapter ───────────────────────────────────────────────────────

NASA_POWER_BASE = "https://power.larc.nasa.gov/api/temporal/climatology/point"

NASA_POWER_FALLBACK = {
    "T2M": {"ANN": 30.4, "JAN": 26.1, "FEB": 27.3, "MAR": 29.2, "APR": 31.0,
             "MAY": 32.5, "JUN": 33.8, "JUL": 34.6, "AUG": 35.2, "SEP": 34.1,
             "OCT": 31.8, "NOV": 29.4, "DEC": 27.2},
    "PRECTOTCORR": {"ANN": 0.78, "JAN": 0.12, "FEB": 0.09, "MAR": 0.31, "APR": 0.87,
                    "MAY": 1.42, "JUN": 0.62, "JUL": 0.48, "AUG": 0.52, "SEP": 0.38,
                    "OCT": 1.21, "NOV": 0.89, "DEC": 0.24},
    "ALLSKY_SFC_SW_DWN": {"ANN": 6.31, "JAN": 6.82, "FEB": 7.05, "MAR": 6.93, "APR": 6.21,
                           "MAY": 5.98, "JUN": 5.72, "JUL": 5.61, "AUG": 5.78, "SEP": 6.12,
                           "OCT": 6.45, "NOV": 6.81, "DEC": 6.90},
    "_source": "fallback_cache",
    "_note": "Cached representative data for Northern Kenya (Marsabit region, 2.3°N, 38.0°E)"
}


async def fetch_nasa_power_point(lat: float, lon: float, parameters: Optional[list] = None) -> Dict[str, Any]:
    """Fetch NASA POWER climatology for a single point. Falls back gracefully."""
    params = parameters or ["T2M", "PRECTOTCORR", "ALLSKY_SFC_SW_DWN"]
    url = (
        f"{NASA_POWER_BASE}"
        f"?parameters={','.join(params)}"
        f"&community=RE&longitude={lon}&latitude={lat}&format=JSON"
    )
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                result = data.get("properties", {}).get("parameter", {})
                result["_source"] = "nasa_power_live"
                return result
            else:
                logger.warning(f"NASA POWER returned {resp.status_code}")
    except Exception as e:
        logger.warning(f"NASA POWER adapter failed: {e}")

    return {**NASA_POWER_FALLBACK}


# ─── World Bank Adapter ───────────────────────────────────────────────────────

WORLD_BANK_BASE = "https://api.worldbank.org/v2"

WORLD_BANK_FALLBACK = {
    "EG.ELC.ACCS.ZS": {
        "indicator": "Access to electricity (% of population)",
        "country": "Kenya",
        "value": 75.2,
        "year": 2022,
        "_note": "National average; northern rural areas estimated at 5–15%"
    },
    "SH.H2O.BASW.ZS": {
        "indicator": "People using at least basic drinking water services (% of population)",
        "country": "Kenya",
        "value": 59.0,
        "year": 2022,
        "_note": "National average; rural northern Kenya estimated at 35–45%"
    },
    "_source": "fallback_cache"
}


async def fetch_world_bank_indicator(country_code: str, indicator: str) -> Dict[str, Any]:
    """Fetch World Bank indicator for a country. Falls back gracefully."""
    url = f"{WORLD_BANK_BASE}/country/{country_code}/indicator/{indicator}?format=json&mrv=1&per_page=1"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                if len(data) >= 2 and data[1]:
                    entry = data[1][0]
                    return {
                        "indicator": entry.get("indicator", {}).get("value"),
                        "country": entry.get("country", {}).get("value"),
                        "value": entry.get("value"),
                        "year": entry.get("date"),
                        "_source": "world_bank_live"
                    }
    except Exception as e:
        logger.warning(f"World Bank adapter failed for {indicator}: {e}")

    return WORLD_BANK_FALLBACK.get(indicator, {"_source": "fallback_cache", "value": None})


# ─── Normalized Output ────────────────────────────────────────────────────────

def normalize_nasa_power(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize raw NASA POWER output into engineering-relevant metrics."""
    t2m = raw.get("T2M", {})
    precip = raw.get("PRECTOTCORR", {})
    solar = raw.get("ALLSKY_SFC_SW_DWN", {})

    monthly_temps = [v for k, v in t2m.items() if k not in ("ANN", "_source", "_note") and isinstance(v, (int, float))]
    monthly_precip = [v for k, v in precip.items() if k not in ("ANN", "_source", "_note") and isinstance(v, (int, float))]
    monthly_solar = [v for k, v in solar.items() if k not in ("ANN", "_source", "_note") and isinstance(v, (int, float))]

    annual_precip_daily = precip.get("ANN", 0.78)

    return {
        "temperature": {
            "mean_annual_c": t2m.get("ANN", 30.4),
            "max_monthly_c": max(monthly_temps) if monthly_temps else 36.0,
            "min_monthly_c": min(monthly_temps) if monthly_temps else 24.0,
            "units": "°C"
        },
        "precipitation": {
            "mean_annual_mm": round(annual_precip_daily * 365, 1),
            "mean_monthly_max_mm": round(max(monthly_precip) * 30, 1) if monthly_precip else 85,
            "units": "mm"
        },
        "solar": {
            "mean_daily_kwh_m2": solar.get("ANN", 6.3),
            "min_monthly_kwh_m2": min(monthly_solar) if monthly_solar else 5.6,
            "max_monthly_kwh_m2": max(monthly_solar) if monthly_solar else 7.1,
            "peak_sun_hours": solar.get("ANN", 6.3),
            "units": "kWh/m²/day"
        },
        "_source": raw.get("_source", "unknown")
    }
