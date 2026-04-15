import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, List, AlertTriangle, Info, Pencil } from 'lucide-react'
import ConfidenceBadge from '../ui/ConfidenceBadge'
import CitationChip from '../ui/CitationChip'
import api from '../../services/api'

// Parse inline citations like [SRC-001] from text
function renderWithCitations(text, onCitationClick) {
  if (!text) return null
  const parts = text.split(/(\[SRC-\d+\])/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[([A-Z]+-\d+)\]$/)
    if (match) {
      return <CitationChip key={i} id={match[1]} onClick={onCitationClick} />
    }
    return <span key={i}>{part}</span>
  })
}

// Inline tooltip for the confidence/intervention scale
function InterventionTooltip() {
  return (
    <div className="relative group inline-flex items-center">
      <Info
        size={13}
        className="text-gray-400 cursor-help hover:text-forest-500 transition-colors ml-1"
      />
      <div
        className="absolute left-0 top-5 z-50 hidden group-hover:block bg-gray-900 text-white text-xs
                   rounded-lg p-3 w-60 shadow-xl pointer-events-none"
        style={{ minWidth: '220px' }}
      >
        <p className="font-semibold mb-1.5 text-gray-100">Manual Intervention Level</p>
        <p className="text-gray-400 mb-2 text-xs leading-relaxed">
          Indicates how much expert review this AI-generated section requires before use.
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full shrink-0" />
            <span><strong className="text-red-300">High</strong> — AI confidence is limited; detailed expert review required</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full shrink-0" />
            <span><strong className="text-amber-300">Medium</strong> — Moderately confident; review key assumptions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full shrink-0" />
            <span><strong className="text-green-300">Low</strong> — Highly confident; standard engineering review applies</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SectionCard({ section, reportId, onCitationClick, onUpdated }) {
  const [collapsed, setCollapsed] = useState(false)
  const [showAssumptions, setShowAssumptions] = useState(false)
  const [showLimitations, setShowLimitations] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  // Assumptions: checkable (select/exclude) and editable (inline text edit)
  const [selectedAssumptions, setSelectedAssumptions] = useState(
    new Set((section.assumptions || []).map((_, i) => i))
  )
  const [assumptionEdits, setAssumptionEdits] = useState({})
  const [editingIdx, setEditingIdx] = useState(null)

  // Reset assumption state when section changes
  useEffect(() => {
    setSelectedAssumptions(new Set((section.assumptions || []).map((_, i) => i)))
    setAssumptionEdits({})
    setEditingIdx(null)
  }, [section.name])

  const getAssumptionText = (i) =>
    assumptionEdits[i] !== undefined ? assumptionEdits[i] : (section.assumptions || [])[i]

  const toggleAssumption = (i) => {
    setSelectedAssumptions((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const getIncludedAssumptions = () =>
    (section.assumptions || [])
      .map((_, i) => (selectedAssumptions.has(i) ? getAssumptionText(i) : null))
      .filter(Boolean)

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const updated = await api.regenerateSection(reportId, section.name, {
        included_assumptions: getIncludedAssumptions(),
        excluded_assumption_count: (section.assumptions || []).length - selectedAssumptions.size,
      })
      if (onUpdated) onUpdated(section.name, updated)
    } catch (err) {
      console.error('Regeneration failed:', err)
    } finally {
      setRegenerating(false)
    }
  }

  const hasModifiedAssumptions =
    Object.keys(assumptionEdits).length > 0 ||
    selectedAssumptions.size !== (section.assumptions || []).length

  return (
    <div className="card overflow-hidden">
      {/* Section header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-forest-50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-forest-800 truncate">
            {section.display_name || section.name}
          </h2>
          <div
            className="flex items-center shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <ConfidenceBadge level={section.confidence || 'medium'} short />
            <InterventionTooltip />
          </div>
        </div>
        <div className="ml-2 shrink-0">
          {collapsed
            ? <ChevronDown size={16} className="text-forest-400" />
            : <ChevronUp size={16} className="text-forest-400" />}
        </div>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4">
          {/* Section content */}
          <div className="text-sm text-gray-700 leading-relaxed mb-4 prose prose-sm max-w-none">
            {(section.content || '').split('\n\n').map((para, i) => (
              <p key={i} className="mb-3 last:mb-0">
                {renderWithCitations(para, onCitationClick)}
              </p>
            ))}
          </div>

          {/* Citation keys list */}
          {section.citation_keys && section.citation_keys.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {section.citation_keys.map((k) => (
                <CitationChip key={k} id={k} onClick={onCitationClick} />
              ))}
            </div>
          )}

          {/* Basis */}
          {section.basis && (
            <p className="text-xs text-gray-400 italic mb-3 border-t border-[#D8EAE0] pt-3">
              What this section is based on: {section.basis}
            </p>
          )}

          {/* Assumptions — checkable & editable */}
          {section.assumptions && section.assumptions.length > 0 && (
            <div className="mb-2">
              <button
                onClick={() => setShowAssumptions(!showAssumptions)}
                className="flex items-center gap-1.5 text-xs text-forest-600 font-medium hover:text-forest-700"
              >
                <List size={12} />
                Assumptions ({section.assumptions.length})
                {hasModifiedAssumptions && (
                  <span className="text-amber-500 font-normal ml-1">(modified)</span>
                )}
                {showAssumptions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showAssumptions && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1.5 italic">
                    Uncheck to exclude from regeneration · Click text to edit
                  </p>
                  <ul className="space-y-1.5">
                    {(section.assumptions || []).map((_, i) => {
                      const text = getAssumptionText(i)
                      const isSelected = selectedAssumptions.has(i)
                      const isEditing = editingIdx === i
                      return (
                        <li key={i} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAssumption(i)}
                            className="mt-0.5 accent-forest-600 shrink-0 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {isEditing ? (
                            <input
                              value={text}
                              autoFocus
                              onChange={(e) =>
                                setAssumptionEdits((prev) => ({ ...prev, [i]: e.target.value }))
                              }
                              onBlur={() => setEditingIdx(null)}
                              onKeyDown={(e) => { if (e.key === 'Enter') setEditingIdx(null) }}
                              className="flex-1 text-xs text-forest-700 border-b border-forest-400
                                         outline-none bg-transparent leading-relaxed"
                            />
                          ) : (
                            <span
                              onClick={() => setEditingIdx(i)}
                              title="Click to edit"
                              className={`flex-1 text-xs leading-relaxed cursor-text group flex items-start gap-1
                                ${isSelected ? 'text-gray-700' : 'text-gray-400 line-through'}`}
                            >
                              {text}
                              <Pencil
                                size={10}
                                className="shrink-0 mt-0.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  {hasModifiedAssumptions && (
                    <button
                      onClick={() => {
                        setAssumptionEdits({})
                        setSelectedAssumptions(
                          new Set((section.assumptions || []).map((_, i) => i))
                        )
                      }}
                      className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      Reset to original
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Limitations */}
          {section.limitations && section.limitations.length > 0 && (
            <div className="mb-3">
              <button
                onClick={() => setShowLimitations(!showLimitations)}
                className="flex items-center gap-1.5 text-xs text-amber-600 font-medium hover:text-amber-700"
              >
                <AlertTriangle size={12} />
                Limitations ({section.limitations.length})
                {showLimitations ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showLimitations && (
                <ul className="mt-2 space-y-1 pl-4">
                  {section.limitations.map((l, i) => (
                    <li key={i} className="text-xs text-amber-700 list-disc">{l}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Regenerate button */}
          <div className="flex justify-end items-center gap-2 mt-1">
            {hasModifiedAssumptions && (
              <span className="text-xs text-amber-600 italic">Assumptions modified — regeneration will reflect changes</span>
            )}
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1.5 text-xs text-forest-500 hover:text-forest-700
                         border border-forest-200 px-3 py-1.5 rounded-lg hover:bg-forest-50
                         transition-colors disabled:opacity-50"
            >
              <RefreshCw size={11} className={regenerating ? 'animate-spin' : ''} />
              {regenerating ? 'Regenerating...' : 'Regenerate Section'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
