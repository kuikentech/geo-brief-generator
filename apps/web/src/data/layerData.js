// Simulated GeoJSON data layers for Northern Kenya region
// Bounding box roughly: [36.5, 1.5, 41.5, 5.5]
// All data is realistic but simulated for demonstration purposes

// Helper to create grid polygons over a bounding box
function makeGrid(west, south, east, north, cols, rows) {
  const features = []
  const dLon = (east - west) / cols
  const dLat = (north - south) / rows
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = west + c * dLon
      const y0 = south + r * dLat
      features.push({
        type: 'Feature',
        properties: { col: c, row: r },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [x0, y0], [x0 + dLon, y0],
            [x0 + dLon, y0 + dLat], [x0, y0 + dLat], [x0, y0]
          ]]
        }
      })
    }
  }
  return features
}

// Temperature layer (°C) — hot arid region, 28–38°C
export const temperatureLayer = {
  type: 'FeatureCollection',
  features: makeGrid(35, 1, 42, 6, 7, 5).map((f) => {
    const { col, row } = f.properties
    // Hotter in north and center (Turkana depression), cooler at elevation
    const base = 30 + col * 0.5 - row * 0.3 + (Math.sin(col * 0.7) * 2)
    const value = Math.min(38, Math.max(26, base))
    return {
      ...f,
      properties: {
        ...f.properties,
        value: parseFloat(value.toFixed(1)),
        label: `${value.toFixed(1)}°C`,
        // Normalize 0–1 (26°C=0, 38°C=1)
        normalized: (value - 26) / 12,
      }
    }
  })
}

// Precipitation layer (mm/year) — very low in north Kenya
export const precipitationLayer = {
  type: 'FeatureCollection',
  features: makeGrid(35, 1, 42, 6, 7, 5).map((f) => {
    const { col, row } = f.properties
    // Less rain in north (low row), more in south
    const base = 200 + row * 120 - col * 30 + Math.sin(col * 1.2) * 50
    const value = Math.min(800, Math.max(100, base))
    return {
      ...f,
      properties: {
        ...f.properties,
        value: Math.round(value),
        label: `${Math.round(value)} mm/yr`,
        normalized: (value - 100) / 700,
      }
    }
  })
}

// Aridity index — high aridity (lower = more arid, 0–1 scale)
export const aridityLayer = {
  type: 'FeatureCollection',
  features: makeGrid(35, 1, 42, 6, 7, 5).map((f) => {
    const { col, row } = f.properties
    // Northern Kenya is hyper-arid to arid
    const base = 0.05 + row * 0.04 + (Math.cos(col * 0.5) * 0.03)
    const value = Math.min(0.35, Math.max(0.02, base))
    return {
      ...f,
      properties: {
        ...f.properties,
        value: parseFloat(value.toFixed(3)),
        label: value < 0.1 ? 'Hyper-Arid' : value < 0.2 ? 'Arid' : 'Semi-Arid',
        normalized: value / 0.35,
      }
    }
  })
}

// Solar exposure (kWh/m²/day) — excellent in northern Kenya
export const cloudSolarLayer = {
  type: 'FeatureCollection',
  features: makeGrid(35, 1, 42, 6, 7, 5).map((f) => {
    const { col, row } = f.properties
    const base = 6.5 - row * 0.15 + col * 0.1 + Math.sin(col * 0.8) * 0.3
    const value = Math.min(7.5, Math.max(5.5, base))
    return {
      ...f,
      properties: {
        ...f.properties,
        value: parseFloat(value.toFixed(2)),
        label: `${value.toFixed(1)} kWh/m²/d`,
        normalized: (value - 5.5) / 2.0,
      }
    }
  })
}

// Extreme weather risk (0=low, 1=high)
export const extremeWeatherLayer = {
  type: 'FeatureCollection',
  features: makeGrid(35, 1, 42, 6, 7, 5).map((f) => {
    const { col, row } = f.properties
    const base = 0.5 + col * 0.05 - row * 0.04 + Math.sin(col * 0.9) * 0.1
    const value = Math.min(0.9, Math.max(0.2, base))
    return {
      ...f,
      properties: {
        ...f.properties,
        value: parseFloat(value.toFixed(2)),
        label: value > 0.7 ? 'High Risk' : value > 0.5 ? 'Medium Risk' : 'Low Risk',
        normalized: value,
      }
    }
  })
}

// Road network (sparse lines)
export const roadsLayer = {
  type: 'FeatureCollection',
  features: [
    // A1 Highway (Nairobi–Moyale)
    {
      type: 'Feature',
      properties: { name: 'A1 Highway (Moyale Road)', type: 'primary' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [37.0, 1.5], [37.1, 2.0], [37.2, 2.5], [37.35, 3.0],
          [37.5, 3.5], [37.6, 4.0], [37.75, 4.5], [37.9, 5.0], [38.0, 5.5]
        ]
      }
    },
    // B9 Road (Isiolo–Marsabit)
    {
      type: 'Feature',
      properties: { name: 'B9 Road (Isiolo–Marsabit)', type: 'secondary' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [37.6, 1.6], [37.8, 2.0], [38.0, 2.5],
          [38.1, 3.0], [38.0, 3.5], [38.1, 4.0]
        ]
      }
    },
    // Lodwar–Lokichoggio road
    {
      type: 'Feature',
      properties: { name: 'Lodwar–Lokichoggio Road', type: 'secondary' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [35.6, 3.1], [35.7, 3.5], [35.6, 4.0], [35.5, 4.5], [35.4, 5.0]
        ]
      }
    },
    // Garissa–Wajir road
    {
      type: 'Feature',
      properties: { name: 'Garissa–Wajir Road', type: 'secondary' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [39.6, 1.5], [40.0, 2.0], [40.3, 2.5], [40.1, 3.0], [40.0, 3.5]
        ]
      }
    },
  ]
}

// Settlements
export const settlementsLayer = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'Lodwar', population: 35000, type: 'town' },
      geometry: { type: 'Point', coordinates: [35.597, 3.119] } },
    { type: 'Feature', properties: { name: 'Marsabit', population: 18000, type: 'town' },
      geometry: { type: 'Point', coordinates: [37.999, 2.335] } },
    { type: 'Feature', properties: { name: 'Moyale', population: 15000, type: 'town' },
      geometry: { type: 'Point', coordinates: [39.055, 3.527] } },
    { type: 'Feature', properties: { name: 'Wajir', population: 65000, type: 'town' },
      geometry: { type: 'Point', coordinates: [40.058, 1.750] } },
    { type: 'Feature', properties: { name: 'Mandera', population: 70000, type: 'town' },
      geometry: { type: 'Point', coordinates: [41.853, 3.937] } },
    { type: 'Feature', properties: { name: 'Isiolo', population: 45000, type: 'town' },
      geometry: { type: 'Point', coordinates: [37.583, 0.354] } },
    { type: 'Feature', properties: { name: 'Turkana Village 1', population: 800, type: 'village' },
      geometry: { type: 'Point', coordinates: [36.1, 4.2] } },
    { type: 'Feature', properties: { name: 'Turkana Village 2', population: 600, type: 'village' },
      geometry: { type: 'Point', coordinates: [36.5, 3.8] } },
    { type: 'Feature', properties: { name: 'Marsabit Village', population: 1200, type: 'village' },
      geometry: { type: 'Point', coordinates: [38.5, 3.1] } },
    { type: 'Feature', properties: { name: 'North Horr', population: 5000, type: 'small town' },
      geometry: { type: 'Point', coordinates: [37.075, 3.325] } },
    { type: 'Feature', properties: { name: 'Kargi', population: 3000, type: 'small town' },
      geometry: { type: 'Point', coordinates: [37.574, 2.507] } },
    { type: 'Feature', properties: { name: 'Illeret', population: 2000, type: 'village' },
      geometry: { type: 'Point', coordinates: [36.677, 4.888] } },
  ]
}

// Electricity access proxy (% households with grid access)
export const electricityLayer = {
  type: 'FeatureCollection',
  features: makeGrid(35, 1, 42, 6, 7, 5).map((f) => {
    const { col, row } = f.properties
    // Very low electricity access across northern Kenya (3–15%)
    const base = 5 + row * 2 - col * 0.5 + Math.random() * 3
    const value = Math.min(18, Math.max(1, base))
    return {
      ...f,
      properties: {
        ...f.properties,
        value: parseFloat(value.toFixed(1)),
        label: `${value.toFixed(0)}% grid access`,
        normalized: value / 18,
      }
    }
  })
}

// Healthcare facility proximity (km to nearest facility)
export const healthcareLayer = {
  type: 'FeatureCollection',
  features: makeGrid(35, 1, 42, 6, 7, 5).map((f) => {
    const { col, row } = f.properties
    // Very distant healthcare in rural north Kenya
    const base = 80 - row * 10 + col * 5 + Math.sin(col * 1.1) * 20
    const value = Math.min(200, Math.max(30, base))
    return {
      ...f,
      properties: {
        ...f.properties,
        value: Math.round(value),
        label: `~${Math.round(value)} km to facility`,
        normalized: 1 - (value - 30) / 170,
      }
    }
  })
}

// Water infrastructure access proxy
export const waterInfraLayer = {
  type: 'FeatureCollection',
  features: makeGrid(35, 1, 42, 6, 7, 5).map((f) => {
    const { col, row } = f.properties
    // Low water infra coverage in northern Kenya
    const base = 15 + row * 5 + Math.cos(col * 0.8) * 8
    const value = Math.min(55, Math.max(5, base))
    return {
      ...f,
      properties: {
        ...f.properties,
        value: parseFloat(value.toFixed(1)),
        label: `${value.toFixed(0)}% improved water source`,
        normalized: value / 55,
      }
    }
  })
}

// Color interpolation helpers for each layer
export const LAYER_COLOR_SCALES = {
  temperature: [
    [0, '#FEF9C3'],
    [0.4, '#FCA843'],
    [0.7, '#EF4444'],
    [1, '#7F1D1D'],
  ],
  precipitation: [
    [0, '#EFF6FF'],
    [0.3, '#93C5FD'],
    [0.6, '#3B82F6'],
    [1, '#1E3A8A'],
  ],
  aridity: [
    [0, '#7F1D1D'],
    [0.4, '#E9C46A'],
    [0.7, '#FDE68A'],
    [1, '#F0FDF4'],
  ],
  cloud_solar: [
    [0, '#FEF3C7'],
    [0.4, '#FDE047'],
    [0.7, '#F59E0B'],
    [1, '#B45309'],
  ],
  extreme_weather: [
    [0, '#DCFCE7'],
    [0.4, '#FEF08A'],
    [0.7, '#FB923C'],
    [1, '#7F1D1D'],
  ],
  electricity: [
    [0, '#7F1D1D'],
    [0.3, '#F97316'],
    [0.6, '#FACC15'],
    [1, '#16A34A'],
  ],
  healthcare: [
    [0, '#7F1D1D'],
    [0.3, '#F97316'],
    [0.6, '#FACC15'],
    [1, '#16A34A'],
  ],
  water_infra: [
    [0, '#7F1D1D'],
    [0.3, '#F97316'],
    [0.6, '#FACC15'],
    [1, '#16A34A'],
  ],
}

export const LAYER_DATA = {
  temperature: temperatureLayer,
  precipitation: precipitationLayer,
  aridity: aridityLayer,
  cloud_solar: cloudSolarLayer,
  extreme_weather: extremeWeatherLayer,
  roads: roadsLayer,
  settlements: settlementsLayer,
  electricity: electricityLayer,
  healthcare: healthcareLayer,
  water_infra: waterInfraLayer,
}

export const LAYER_SOURCES = {
  temperature: { name: 'NASA POWER Climatology', url: 'https://power.larc.nasa.gov/', classification: 'Globally Recognized Org' },
  precipitation: { name: 'CHIRPS Rainfall Estimates', url: 'https://www.chc.ucsb.edu/data/chirps', classification: 'Globally Recognized Org' },
  aridity: { name: 'Global Aridity Index (CGIAR-CSI)', url: 'https://www.cgiar-csi.org/', classification: 'Globally Recognized Org' },
  cloud_solar: { name: 'NASA POWER Solar Data', url: 'https://power.larc.nasa.gov/', classification: 'Globally Recognized Org' },
  extreme_weather: { name: 'INFORM Risk Index', url: 'https://drmkc.jrc.ec.europa.eu/inform-index', classification: 'Government' },
  roads: { name: 'OpenStreetMap Contributors', url: 'https://openstreetmap.org', classification: 'Community-Sourced' },
  settlements: { name: 'WorldPop / UN OCHA', url: 'https://www.worldpop.org/', classification: 'Globally Recognized Org' },
  electricity: { name: 'World Bank Electrification Data', url: 'https://data.worldbank.org/', classification: 'Government' },
  healthcare: { name: 'KEMRI / WHO Facility Registers', url: 'https://who.int/', classification: 'Government' },
  water_infra: { name: 'JMP Water & Sanitation Data', url: 'https://washdata.org/', classification: 'Globally Recognized Org' },
}
