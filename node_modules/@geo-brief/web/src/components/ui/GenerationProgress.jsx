import React from 'react'
import { CheckCircle, Loader, Clock, AlertCircle } from 'lucide-react'

const STEPS = [
  { key: 'computing', label: 'Computing geo context', description: 'Analyzing selected layers and region' },
  { key: 'retrieving', label: 'Retrieving E4C solutions', description: 'Matching relevant engineering resources' },
  { key: 'building', label: 'Building evidence manifest', description: 'Assigning citations and provenance' },
  { key: 'generating', label: 'Generating report', description: 'AI drafting all report sections' },
  { key: 'done', label: 'Report complete', description: 'Ready for review' },
]

const STATUS_ORDER = ['idle', 'computing', 'retrieving', 'building', 'generating', 'done', 'error']

export default function GenerationProgress({ status, log }) {
  const currentIdx = STATUS_ORDER.indexOf(status)

  if (status === 'idle') return null

  return (
    <div className="mt-4 space-y-2">
      {STEPS.map((step, i) => {
        const stepIdx = i + 1 // idle=0, computing=1...
        const isDone = currentIdx > stepIdx || status === 'done'
        const isActive = STATUS_ORDER[currentIdx] === step.key
        const isPending = currentIdx < stepIdx

        return (
          <div
            key={step.key}
            className={`flex items-start gap-3 p-2 rounded-lg transition-all ${
              isActive ? 'bg-forest-50 border border-forest-200' :
              isDone ? 'bg-gray-50' : 'opacity-40'
            }`}
          >
            <div className="mt-0.5">
              {isDone ? (
                <CheckCircle size={16} className="text-forest-500" />
              ) : isActive ? (
                <Loader size={16} className="text-forest-600 animate-spin" />
              ) : (
                <Clock size={16} className="text-gray-300" />
              )}
            </div>
            <div>
              <p className={`text-xs font-medium ${isActive ? 'text-forest-700' : isDone ? 'text-gray-500' : 'text-gray-300'}`}>
                {step.label}
              </p>
              <p className="text-xs text-gray-400">{step.description}</p>
            </div>
          </div>
        )
      })}

      {status === 'error' && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500" />
          <p className="text-xs text-red-600">Generation failed. Check console for details.</p>
        </div>
      )}

      {log && log.length > 0 && (
        <div className="mt-3 bg-gray-900 rounded-lg p-3 max-h-32 overflow-y-auto">
          {log.map((entry, i) => (
            <div key={i} className="flex gap-2 text-xs font-mono">
              <span className="text-gray-500 shrink-0">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span className="text-green-400">{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
