import React from 'react'
import { X, ExternalLink, Info, MapPin, Calendar, Shield } from 'lucide-react'
import SourceBadge from '../ui/SourceBadge'
import ConfidenceBadge from '../ui/ConfidenceBadge'

export default function SourceDrawer({ source, allSources, onClose, onSelectSource }) {
  if (!allSources) return null

  return (
    <div className="h-full flex flex-col bg-white border-l border-[#D8EAE0]">
      {/* Header */}
      <div className="p-4 border-b border-[#D8EAE0] flex items-center justify-between bg-forest-50">
        <h2 className="text-sm font-semibold text-forest-700">Source Inspector</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Selected source detail */}
        {source ? (
          <div className="p-4 border-b border-[#D8EAE0] bg-white">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold text-forest-800 leading-tight flex-1 mr-2">
                {source.title}
              </h3>
              <span className="text-xs font-mono text-forest-500 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded shrink-0">
                {source.id}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              <SourceBadge classification={source.classification || 'Globally Recognized Org'} />
              {source.confidence && <ConfidenceBadge level={source.confidence} short />}
            </div>

            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-forest-500 hover:underline mb-3 break-all"
              >
                <ExternalLink size={10} className="shrink-0" />
                {source.url}
              </a>
            )}

            {source.excerpt && (
              <div className="bg-forest-50 border border-forest-100 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                  <Info size={10} /> Excerpt
                </p>
                <p className="text-xs text-forest-800 leading-relaxed italic">
                  "{source.excerpt}"
                </p>
              </div>
            )}

            {source.why_included && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Why Included</p>
                <p className="text-xs text-gray-700 leading-relaxed">{source.why_included}</p>
              </div>
            )}

            <div className="space-y-1.5">
              {source.geographic_relation && (
                <div className="flex items-center gap-2">
                  <MapPin size={11} className="text-forest-400 shrink-0" />
                  <span className="text-xs text-gray-600">{source.geographic_relation}</span>
                </div>
              )}
              {source.access_date && (
                <div className="flex items-center gap-2">
                  <Calendar size={11} className="text-forest-400 shrink-0" />
                  <span className="text-xs text-gray-600">Accessed: {source.access_date}</span>
                </div>
              )}
              {source.provider && (
                <div className="flex items-center gap-2">
                  <Shield size={11} className="text-forest-400 shrink-0" />
                  <span className="text-xs text-gray-600">{source.provider}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-[#D8EAE0] bg-forest-50">
            <p className="text-xs text-forest-500 text-center">
              Click a citation chip <span className="citation-chip">SRC-001</span> in the report to view source details.
            </p>
          </div>
        )}

        {/* All sources list */}
        <div className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-forest-600 mb-3">
            All Sources ({allSources.length})
          </h3>
          <div className="space-y-2">
            {allSources.map((src) => (
              <button
                key={src.id}
                onClick={() => onSelectSource(src)}
                className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                  source?.id === src.id
                    ? 'bg-forest-50 border-forest-300'
                    : 'bg-white border-[#D8EAE0] hover:bg-forest-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono text-forest-500 shrink-0 mt-0.5">{src.id}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 leading-tight truncate">{src.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{src.provider || src.classification}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
