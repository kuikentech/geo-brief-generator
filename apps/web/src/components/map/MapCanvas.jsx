import React, { useState, useRef, useCallback } from 'react'
import Map, { Source, Layer, NavigationControl, ScaleControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Square, Circle, Trash2, MousePointer, Search, Layers } from 'lucide-react'
import { useMapStore } from '../../stores/mapStore'
import { LAYER_DATA, LAYER_COLOR_SCALES } from '../../data/layerData'

// ─── Map Styles ─────────────────────────────────────────────────────────────────

// Build an inline raster-tile style for MapLibre
function rasterStyle(tiles, attribution, maxzoom = 19) {
  return {
    version: 8,
    sources: {
      raster: {
        type: 'raster',
        tiles,
        tileSize: 256,
        attribution,
        maxzoom,
      },
    },
    layers: [
      { id: 'raster-layer', type: 'raster', source: 'raster', minzoom: 0, maxzoom: 22 },
    ],
  }
}

const MAP_STYLES = {
  basic: 'https://tiles.openfreemap.org/styles/liberty',
  satellite: rasterStyle(
    ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    '© Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
  ),
  topographic: rasterStyle(
    ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
    '© OpenTopoMap contributors (CC-BY-SA)',
    17
  ),
  road: 'https://tiles.openfreemap.org/styles/positron',
}

const STYLE_LABELS = {
  basic: 'Basic',
  satellite: 'Satellite',
  topographic: 'Topo',
  road: 'Road',
}

// ─── Color helpers ───────────────────────────────────────────────────────────────

function interpolateColor(normalized, scale) {
  const clamped = Math.max(0, Math.min(1, normalized))
  for (let i = 1; i < scale.length; i++) {
    const [t0, c0] = scale[i - 1]
    const [t1, c1] = scale[i]
    if (clamped <= t1) {
      const t = (clamped - t0) / (t1 - t0)
      return blendHex(c0, c1, t)
    }
  }
  return scale[scale.length - 1][1]
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
}

function blendHex(c0, c1, t) {
  const [r0, g0, b0] = hexToRgb(c0)
  const [r1, g1, b1] = hexToRgb(c1)
  return rgbToHex(r0 + (r1 - r0) * t, g0 + (g1 - g0) * t, b0 + (b1 - b0) * t)
}

function colorizeFeatures(geojson, layerId) {
  const scale = LAYER_COLOR_SCALES[layerId]
  if (!scale || !geojson) return geojson
  return {
    ...geojson,
    features: geojson.features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        fillColor: interpolateColor(f.properties.normalized || 0, scale),
      },
    })),
  }
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function MapCanvas() {
  const { viewState, setViewState, selectedGeometry, setGeometry, activeLayers, layerOpacity } =
    useMapStore()

  const [drawMode, setDrawMode] = useState('select') // select | bbox | radius
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapStyleKey, setMapStyleKey] = useState('basic')
  const [showStylePicker, setShowStylePicker] = useState(false)
  const mapRef = useRef(null)

  const currentStyle = MAP_STYLES[mapStyleKey]
  const activatedLayerIds = activeLayers.filter((l) => l.active).map((l) => l.id)

  // ── Drawing ──────────────────────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e) => {
      if (drawMode !== 'bbox') return
      setDragging(true)
      setDragStart(e.lngLat)
    },
    [drawMode]
  )

  const handleMouseUp = useCallback(
    (e) => {
      if (drawMode !== 'bbox' || !dragging || !dragStart) return
      const { lngLat } = e
      const minLng = Math.min(dragStart.lng, lngLat.lng)
      const maxLng = Math.max(dragStart.lng, lngLat.lng)
      const minLat = Math.min(dragStart.lat, lngLat.lat)
      const maxLat = Math.max(dragStart.lat, lngLat.lat)

      if (Math.abs(maxLng - minLng) < 0.01 || Math.abs(maxLat - minLat) < 0.01) {
        setDragging(false)
        setDragStart(null)
        return
      }

      setGeometry({
        type: 'Feature',
        properties: { bbox: [minLng, minLat, maxLng, maxLat] },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [minLng, minLat], [maxLng, minLat],
            [maxLng, maxLat], [minLng, maxLat], [minLng, minLat],
          ]],
        },
      })
      setDragging(false)
      setDragStart(null)
      setDrawMode('select')
    },
    [drawMode, dragging, dragStart, setGeometry]
  )

  const handleMapClick = useCallback(
    (e) => {
      if (drawMode !== 'radius') return
      const { lngLat } = e
      const radius = 0.8
      const steps = 32
      const coords = []
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * 2 * Math.PI
        coords.push([
          lngLat.lng + Math.cos(angle) * radius,
          lngLat.lat + Math.sin(angle) * radius * 0.8,
        ])
      }
      setGeometry({
        type: 'Feature',
        properties: { center: [lngLat.lng, lngLat.lat], radiusDeg: radius },
        geometry: { type: 'Polygon', coordinates: [coords] },
      })
      setDrawMode('select')
    },
    [drawMode, setGeometry]
  )

  // ── Search ───────────────────────────────────────────────────────────────────

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim() || !mapRef.current) return
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )
      const data = await res.json()
      if (data.length > 0) {
        const { lat, lon } = data[0]
        mapRef.current.flyTo({ center: [parseFloat(lon), parseFloat(lat)], zoom: 7, duration: 1500 })
      }
    } catch {
      // Silently ignore
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex-1 h-full">
      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2
                   bg-white border border-[#D8EAE0] rounded-lg shadow-md px-3 py-2 w-80"
      >
        <Search size={14} className="text-forest-400 shrink-0" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search location..."
          className="text-sm text-gray-700 flex-1 outline-none bg-transparent placeholder-gray-400"
        />
      </form>

      {/* Map style switcher */}
      <div className="absolute top-3 left-3 z-10">
        <div className="relative">
          <button
            onClick={() => setShowStylePicker((p) => !p)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border shadow-sm text-xs font-medium transition-colors
              ${showStylePicker
                ? 'bg-forest-600 text-white border-forest-600'
                : 'bg-white text-forest-700 border-[#D8EAE0] hover:bg-forest-50'}`}
            title="Switch map view"
          >
            <Layers size={13} />
            {STYLE_LABELS[mapStyleKey]}
          </button>

          {showStylePicker && (
            <div className="absolute top-9 left-0 bg-white border border-[#D8EAE0] rounded-lg shadow-xl overflow-hidden z-20 min-w-[110px]">
              {Object.entries(STYLE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setMapStyleKey(key); setShowStylePicker(false) }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors
                    ${mapStyleKey === key
                      ? 'bg-forest-600 text-white font-medium'
                      : 'text-gray-700 hover:bg-forest-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawing tools */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        {[
          { mode: 'select', icon: <MousePointer size={16} />, title: 'Select / Pan' },
          { mode: 'bbox', icon: <Square size={16} />, title: 'Draw bounding box' },
          { mode: 'radius', icon: <Circle size={16} />, title: 'Click to select radius' },
        ].map(({ mode, icon, title }) => (
          <button
            key={mode}
            onClick={() => setDrawMode(mode)}
            title={title}
            className={`p-2 rounded-lg border shadow-sm transition-colors ${
              drawMode === mode
                ? 'bg-forest-600 text-white border-forest-600'
                : 'bg-white border-[#D8EAE0] text-forest-600 hover:bg-forest-50'
            }`}
          >
            {icon}
          </button>
        ))}
        <button
          onClick={() => setGeometry(null)}
          title="Clear selection"
          className="p-2 rounded-lg border bg-white border-[#D8EAE0] text-red-400 hover:bg-red-50 shadow-sm transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Draw mode hint */}
      {drawMode !== 'select' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 bg-forest-700 text-white text-xs px-4 py-2 rounded-full shadow">
          {drawMode === 'bbox'
            ? 'Click and drag to draw bounding box'
            : 'Click on map to place radius selection'}
        </div>
      )}

      <Map
        ref={mapRef}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        mapStyle={currentStyle}
        style={{ width: '100%', height: '100%' }}
        cursor={drawMode !== 'select' ? 'crosshair' : 'grab'}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={(e) => {
          if (showStylePicker) setShowStylePicker(false)
          handleMapClick(e)
        }}
        dragPan={drawMode === 'select'}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" />
        <ScaleControl position="bottom-left" />

        {/* Data layer overlays */}
        {activatedLayerIds.map((layerId) => {
          const data = LAYER_DATA[layerId]
          const layer = activeLayers.find((l) => l.id === layerId)
          const opacity = (layerOpacity[layerId] ?? 70) / 100

          if (!data) return null

          if (layerId === 'roads') {
            return (
              <Source key={layerId} id={`src-${layerId}`} type="geojson" data={data}>
                <Layer
                  id={`layer-${layerId}`}
                  type="line"
                  paint={{
                    'line-color': layer.color,
                    'line-width': 2,
                    'line-opacity': opacity,
                  }}
                />
              </Source>
            )
          }

          if (layerId === 'settlements') {
            return (
              <Source key={layerId} id={`src-${layerId}`} type="geojson" data={data}>
                <Layer
                  id={`layer-${layerId}-circle`}
                  type="circle"
                  paint={{
                    'circle-radius': [
                      'interpolate', ['linear'], ['get', 'population'],
                      500, 4, 10000, 8, 70000, 14,
                    ],
                    'circle-color': layer.color,
                    'circle-opacity': opacity,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#fff',
                    'circle-stroke-opacity': 0.8,
                  }}
                />
                <Layer
                  id={`layer-${layerId}-label`}
                  type="symbol"
                  minzoom={5}
                  layout={{
                    'text-field': ['get', 'name'],
                    'text-size': 11,
                    'text-offset': [0, 1.2],
                    'text-anchor': 'top',
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                  }}
                  paint={{
                    'text-color': '#1B4332',
                    'text-halo-color': '#fff',
                    'text-halo-width': 1.5,
                  }}
                />
              </Source>
            )
          }

          // Grid polygon layers
          const colorized = colorizeFeatures(data, layerId)
          return (
            <Source key={layerId} id={`src-${layerId}`} type="geojson" data={colorized}>
              <Layer
                id={`layer-${layerId}`}
                type="fill"
                paint={{
                  'fill-color': ['get', 'fillColor'],
                  'fill-opacity': opacity * 0.6,
                }}
              />
              <Layer
                id={`layer-${layerId}-outline`}
                type="line"
                paint={{
                  'line-color': ['get', 'fillColor'],
                  'line-width': 0.3,
                  'line-opacity': opacity * 0.4,
                }}
              />
            </Source>
          )
        })}

        {/* Selected area overlay */}
        {selectedGeometry && (
          <Source id="selection" type="geojson" data={selectedGeometry}>
            <Layer
              id="selection-fill"
              type="fill"
              paint={{ 'fill-color': '#2D6A4F', 'fill-opacity': 0.2 }}
            />
            <Layer
              id="selection-outline"
              type="line"
              paint={{
                'line-color': '#2D6A4F',
                'line-width': 2.5,
                'line-dasharray': [2, 1],
              }}
            />
          </Source>
        )}
      </Map>

      {/* Mini legend */}
      {activatedLayerIds.length > 0 && (
        <div className="absolute bottom-8 right-14 z-10 bg-white border border-[#D8EAE0] rounded-lg shadow-md p-2 max-w-[150px]">
          <p className="text-xs font-semibold text-forest-700 mb-1">Active Layers</p>
          {activatedLayerIds.slice(0, 5).map((lid) => {
            const layer = activeLayers.find((l) => l.id === lid)
            return (
              <div key={lid} className="flex items-center gap-1.5 mb-0.5">
                <div className="w-3 h-2 rounded-sm shrink-0" style={{ background: layer.color }} />
                <span className="text-xs text-gray-600 truncate">{layer.label}</span>
              </div>
            )
          })}
          {activatedLayerIds.length > 5 && (
            <p className="text-xs text-gray-400 mt-1">+{activatedLayerIds.length - 5} more</p>
          )}
        </div>
      )}
    </div>
  )
}
