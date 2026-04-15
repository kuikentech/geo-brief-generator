import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Layers, BarChart2, FileText, AlertTriangle } from 'lucide-react'
import { useMapStore } from '../../stores/mapStore'
import { useProjectStore } from '../../stores/projectStore'
import { useReportStore } from '../../stores/reportStore'
import { LAYER_SOURCES } from '../../data/layerData'
import SourceBadge from '../ui/SourceBadge'
import GenerationProgress from '../ui/GenerationProgress'
import api from '../../services/api'

export default function ContextPanel() {
  const navigate = useNavigate()
  const { selectedGeometry, activeLayers, getActiveLayerIds } = useMapStore()
  const { project } = useProjectStore()
  const { generationStatus, generationLog, setGenerationStatus, addLogEntry, clearLog, setReport } = useReportStore()

  const activeLyrIds = getActiveLayerIds()
  const activeLayerObjs = activeLayers.filter((l) => l.active)

  const bbox = selectedGeometry?.properties?.bbox
  const center = selectedGeometry?.properties?.center

  const isGenerating = ['computing', 'retrieving', 'building', 'generating'].includes(generationStatus)

  const handleGenerate = async () => {
    clearLog()
    setGenerationStatus('computing')
    addLogEntry('Starting geo-context analysis...')

    try {
      // Step 1: Create project if needed
      let projectId = project.id
      if (!projectId) {
        addLogEntry('Registering project...')
        const created = await api.createProject({
          title: project.title,
          geography: project.geography,
          engineering_objective: project.engineeringObjective,
          technology_type: project.technologyType,
          sector: project.sector,
          scenario_description: project.scenarioDescription,
        })
        projectId = created.id
      }

      addLogEntry('Computing geographic context from active layers...')
      await api.computeContext(projectId, selectedGeometry, activeLyrIds)

      setGenerationStatus('retrieving')
      addLogEntry('Retrieving relevant E4C solutions and case studies...')
      await api.retrieveE4C(projectId, project.technologyType, project.sector)

      setGenerationStatus('building')
      addLogEntry('Building evidence manifest and assigning citations...')
      await api.prepareReport(projectId)

      setGenerationStatus('generating')
      addLogEntry('AI generating report sections (this may take 30–60 seconds)...')
      const report = await api.generateReport(projectId, {
        geometry: selectedGeometry,
        active_layers: activeLyrIds,
        project_title: project.title,
        engineering_objective: project.engineeringObjective,
        technology_type: project.technologyType,
        sector: project.sector,
        scenario_description: project.scenarioDescription,
      })

      addLogEntry(`Report generated successfully! (${report.sections?.length || 0} sections)`)
      setGenerationStatus('done')
      setReport(report)
      navigate(`/report/${report.id}`)
    } catch (err) {
      addLogEntry(`Error: ${err.message}`)
      setGenerationStatus('error')
    }
  }

  return (
    <div className="w-[300px] h-full bg-white border-l border-[#D8EAE0] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Analysis Area */}
        <div className="card p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-forest-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-forest-600">Analysis Area</h3>
          </div>
          {selectedGeometry ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-forest-800">
                {bbox
                  ? `Bounding Box Selection`
                  : center
                  ? `Radius Selection`
                  : 'Custom Polygon'}
              </p>
              {bbox && (
                <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                  <div>N: {bbox[3].toFixed(3)}° | S: {bbox[1].toFixed(3)}°</div>
                  <div>W: {bbox[0].toFixed(3)}° | E: {bbox[2].toFixed(3)}°</div>
                </div>
              )}
              {center && (
                <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                  Center: {center[1].toFixed(3)}°N, {center[0].toFixed(3)}°E
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
              <p className="text-xs text-amber-700">
                Use the drawing tools on the map to select an analysis area (bbox or radius).
              </p>
            </div>
          )}
        </div>

        {/* Active Layers */}
        <div className="card p-3">
          <div className="flex items-center gap-2 mb-2">
            <Layers size={14} className="text-forest-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-forest-600">
              Active Layers ({activeLyrIds.length})
            </h3>
          </div>
          {activeLayerObjs.length === 0 ? (
            <p className="text-xs text-gray-400">No layers active. Toggle layers in the left panel.</p>
          ) : (
            <div className="space-y-2">
              {activeLayerObjs.map((l) => {
                const src = LAYER_SOURCES[l.id]
                return (
                  <div key={l.id} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: l.color }} />
                    <span className="text-xs text-gray-700 flex-1 truncate">{l.label}</span>
                    {src && <SourceBadge classification={src.classification} compact />}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Context Summary */}
        <div className="card p-3">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 size={14} className="text-forest-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-forest-600">Context Summary</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Active layers</span>
              <span className="text-xs font-medium text-forest-700">{activeLyrIds.length} / 10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Area selected</span>
              <span className={`text-xs font-medium ${selectedGeometry ? 'text-forest-600' : 'text-amber-600'}`}>
                {selectedGeometry ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Data readiness</span>
              <span className={`text-xs font-medium ${activeLyrIds.length >= 3 && selectedGeometry ? 'text-forest-600' : 'text-amber-600'}`}>
                {activeLyrIds.length >= 3 && selectedGeometry ? 'Ready' : 'Incomplete'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-forest-100 rounded-full h-1.5 mt-1">
              <div
                className="bg-forest-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, (activeLyrIds.length / 10) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Generate button */}
      <div className="p-4 border-t border-[#D8EAE0] space-y-3">
        {!selectedGeometry && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
            <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">Draw an area on the map to enable report generation.</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!selectedGeometry || isGenerating}
          className="w-full bg-forest-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-forest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
        >
          <FileText size={16} />
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>

        <GenerationProgress status={generationStatus} log={generationLog} />
      </div>
    </div>
  )
}
