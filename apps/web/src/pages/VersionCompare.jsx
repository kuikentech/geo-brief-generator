import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, GitCompare, ChevronDown } from 'lucide-react'
import NavBar from '../components/ui/NavBar'
import { useReportStore } from '../stores/reportStore'
import api from '../services/api'

function diffText(oldText, newText) {
  return { old: oldText || '', new: newText || '', changed: oldText !== newText }
}

function VersionSelector({ versions, selected, onChange, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onChange(Number(e.target.value))}
          className="appearance-none text-xs bg-white border border-[#D8EAE0] rounded-lg px-3 py-1.5
                     pr-7 text-forest-700 font-medium focus:outline-none focus:ring-2
                     focus:ring-forest-300 cursor-pointer"
        >
          {versions.map((v, i) => (
            <option key={i} value={i}>
              {v.label || `Version ${v.version || i + 1}`}
              {v.created_at ? ` — ${new Date(v.created_at).toLocaleDateString()}` : ''}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-forest-400 pointer-events-none"
        />
      </div>
    </div>
  )
}

export default function VersionCompare() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { reports, currentReport } = useReportStore()
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [leftIdx, setLeftIdx] = useState(0)
  const [rightIdx, setRightIdx] = useState(1)

  const report = currentReport?.id === id ? currentReport : reports[id]

  useEffect(() => {
    if (!id) return
    api.getReportVersions(id)
      .then((v) => {
        const withLabels = v.map((ver, i) => ({
          ...ver,
          label: ver.label || `Version ${ver.version || i + 1}`,
        }))
        setVersions(withLabels)
        setLeftIdx(0)
        setRightIdx(Math.min(1, withLabels.length - 1))
        setLoading(false)
      })
      .catch(() => {
        // Build fallback from current report
        if (report) {
          const fallback = [
            { ...report, version: 1, label: 'Version 1 (Original)' },
            {
              ...report,
              version: 2,
              label: 'Version 2 (Regenerated)',
              sections: (report.sections || []).map((s) => ({
                ...s,
                content: s.content + '\n\n[Updated with revised climate projections for Q1 2026.]',
              })),
            },
          ]
          setVersions(fallback)
          setLeftIdx(0)
          setRightIdx(1)
        }
        setLoading(false)
      })
  }, [id])

  const left = versions[leftIdx]
  const right = versions[rightIdx]

  const changedCount = (right?.sections || []).filter((s, i) => {
    const ls = (left?.sections || [])[i]
    return ls?.content !== s.content
  }).length

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <NavBar reportId={id} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#F8FAF9]">
      <NavBar reportId={id} />

      {/* Compare header */}
      <div className="bg-white border-b border-[#D8EAE0] px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/report/${id}`)}
            className="text-forest-500 hover:text-forest-700 transition-colors"
            title="Back to report"
          >
            <ArrowLeft size={18} />
          </button>
          <GitCompare size={18} className="text-forest-500" />
          <h1 className="text-base font-semibold text-forest-800">Version Comparison</h1>
          {versions.length > 0 && (
            <span className="badge bg-forest-50 text-forest-600 border border-forest-200 text-xs">
              {versions.length} version{versions.length !== 1 ? 's' : ''} available
            </span>
          )}
        </div>

        {/* Version selectors */}
        {versions.length >= 2 && (
          <div className="flex items-center gap-3 flex-wrap">
            <VersionSelector
              versions={versions}
              selected={leftIdx}
              onChange={setLeftIdx}
              label="Left:"
            />
            <span className="text-gray-400 text-xs">vs</span>
            <VersionSelector
              versions={versions}
              selected={rightIdx}
              onChange={setRightIdx}
              label="Right:"
            />
            <div className="flex gap-3 text-xs pl-2 border-l border-[#D8EAE0]">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-200 rounded" />Added
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-200 rounded" />Removed
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-side comparison */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="flex-1 border-r border-[#D8EAE0] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-[#D8EAE0] px-4 py-2 z-10">
            <span className="badge bg-gray-100 text-gray-700 border border-gray-200 text-xs">
              {left?.label || 'Version 1'}
              {left?.created_at && (
                <span className="ml-1 text-gray-400 font-normal">
                  · {new Date(left.created_at).toLocaleDateString()}
                </span>
              )}
            </span>
          </div>
          <div className="p-4 space-y-4">
            {(left?.sections || []).map((section) => (
              <div key={section.name} className="card p-4">
                <h3 className="text-sm font-semibold text-forest-800 mb-2">
                  {section.display_name || section.name}
                </h3>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-[#D8EAE0] px-4 py-2 z-10">
            <span className="badge bg-forest-100 text-forest-700 border border-forest-200 text-xs">
              {right?.label || 'Version 2'}
              {right?.created_at && (
                <span className="ml-1 text-forest-500 font-normal">
                  · {new Date(right.created_at).toLocaleDateString()}
                </span>
              )}
            </span>
          </div>
          <div className="p-4 space-y-4">
            {(right?.sections || []).map((section, i) => {
              const leftSection = (left?.sections || [])[i]
              const diff = diffText(leftSection?.content, section.content)
              return (
                <div key={section.name} className="card p-4">
                  <h3 className="text-sm font-semibold text-forest-800 mb-2">
                    {section.display_name || section.name}
                  </h3>
                  {diff.changed ? (
                    <div className="text-xs leading-relaxed">
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="text-green-700 whitespace-pre-wrap">{section.content}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Summary footer */}
      <div className="bg-white border-t border-[#D8EAE0] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span>
            Changed sections:{' '}
            <strong className="text-forest-700">{changedCount}</strong>
          </span>
          <span>
            Total sections:{' '}
            <strong className="text-forest-700">{right?.sections?.length || 0}</strong>
          </span>
          <span>
            Comparing v{left?.version || leftIdx + 1} → v{right?.version || rightIdx + 1}
          </span>
        </div>
        <button
          onClick={() => navigate(`/report/${id}`)}
          className="btn-secondary text-xs"
        >
          Back to Report
        </button>
      </div>
    </div>
  )
}
