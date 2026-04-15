import React from 'react'
import { Cloud, Zap } from 'lucide-react'
import { useMapStore } from '../../stores/mapStore'
import { useProjectStore } from '../../stores/projectStore'
import LayerToggle from './LayerToggle'

export default function LayerPanel() {
  const { activeLayers } = useMapStore()
  const { project } = useProjectStore()

  const weatherLayers = activeLayers.filter((l) => l.group === 'weather')
  const infraLayers = activeLayers.filter((l) => l.group === 'infrastructure')

  return (
    <div className="w-80 h-full bg-white border-r border-[#D8EAE0] flex flex-col overflow-hidden">
      {/* Project summary */}
      <div className="p-4 border-b border-[#D8EAE0] bg-forest-50">
        <h2 className="text-sm font-semibold text-forest-700 mb-1 truncate">{project.title}</h2>
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="badge bg-forest-100 text-forest-700">{project.technologyType}</span>
          <span className="badge bg-forest-200 text-forest-800">{project.sector}</span>
        </div>
        <p className="text-xs text-forest-600 mt-2 line-clamp-2 leading-relaxed">
          {project.engineeringObjective}
        </p>
      </div>

      {/* Layer controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Weather Layers */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Cloud size={14} className="text-forest-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-forest-600">
              Weather Layers
            </h3>
          </div>
          <div className="space-y-1">
            {weatherLayers.map((layer) => (
              <LayerToggle key={layer.id} layer={layer} />
            ))}
          </div>
        </div>

        {/* Infrastructure Layers */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Zap size={14} className="text-forest-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-forest-600">
              Infrastructure Layers
            </h3>
          </div>
          <div className="space-y-1">
            {infraLayers.map((layer) => (
              <LayerToggle key={layer.id} layer={layer} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="p-3 border-t border-[#D8EAE0] bg-forest-50">
        <p className="text-xs text-forest-500 text-center">
          Simulated data for demo purposes. Toggle layers to include in report context.
        </p>
      </div>
    </div>
  )
}
