import React, { useState } from 'react'
import { Info, X } from 'lucide-react'
import { useMapStore } from '../../stores/mapStore'
import { LAYER_SOURCES } from '../../data/layerData'
import SourceBadge from '../ui/SourceBadge'

export default function LayerToggle({ layer }) {
  const { toggleLayer, setLayerOpacity, layerOpacity } = useMapStore()
  const [showInfo, setShowInfo] = useState(false)
  const source = LAYER_SOURCES[layer.id]
  const opacity = layerOpacity[layer.id] ?? 70

  return (
    <div className="relative">
      <div className="flex items-center gap-2 py-1.5">
        {/* Color dot */}
        <div
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ background: layer.color }}
        />

        {/* Toggle */}
        <label className="toggle-switch shrink-0">
          <input
            type="checkbox"
            checked={layer.active}
            onChange={() => toggleLayer(layer.id)}
          />
          <span className="toggle-slider" />
        </label>

        {/* Label */}
        <span className="text-xs text-forest-800 flex-1 leading-tight">{layer.label}</span>

        {/* Info button */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-forest-300 hover:text-forest-500 transition-colors"
        >
          <Info size={12} />
        </button>
      </div>

      {/* Opacity slider (only when active) */}
      {layer.active && (
        <div className="flex items-center gap-2 pb-1 pl-8">
          <span className="text-xs text-gray-400 w-6">{opacity}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setLayerOpacity(layer.id, Number(e.target.value))}
            className="flex-1 h-1 accent-forest-500 cursor-pointer"
          />
        </div>
      )}

      {/* Source popover */}
      {showInfo && source && (
        <div className="absolute left-0 top-full z-50 w-64 bg-white border border-[#D8EAE0] rounded-lg shadow-lg p-3 mt-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-xs font-semibold text-forest-700">{layer.label}</h4>
            <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-gray-600">
              <X size={12} />
            </button>
          </div>
          <SourceBadge classification={source.classification} />
          <p className="text-xs text-gray-600 mt-2 font-medium">{source.name}</p>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-forest-500 hover:underline"
          >
            {source.url}
          </a>
        </div>
      )}
    </div>
  )
}
