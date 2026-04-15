import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GitCompare, Edit3, RefreshCw, AlertTriangle, Clock } from 'lucide-react'
import NavBar from '../components/ui/NavBar'
import ReportViewer from '../components/report/ReportViewer'
import SourceDrawer from '../components/report/SourceDrawer'
import ExportButtons from '../components/ui/ExportButtons'
import { useReportStore } from '../stores/reportStore'
import api from '../services/api'

export default function ReportReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { reports, currentReport, setReport, setGenerationStatus, clearLog } = useReportStore()
  const [selectedSource, setSelectedSource] = useState(null)
  const [loading, setLoading] = useState(false)
  const [regeneratingFull, setRegeneratingFull] = useState(false)

  const report = currentReport?.id === id ? currentReport : reports[id]

  // Fetch report if not in store
  useEffect(() => {
    if (!report && id) {
      setLoading(true)
      api.getReport(id)
        .then((r) => {
          setReport(r)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [id, report, setReport])

  const handleCitationClick = (citationId) => {
    if (!report?.sources) return
    const src = report.sources.find((s) => s.id === citationId)
    if (src) setSelectedSource(src)
  }

  const handleRegenerateFull = async () => {
    setRegeneratingFull(true)
    clearLog()
    setGenerationStatus('generating')
    try {
      const projectId = report?.project_id
      if (!projectId) throw new Error('No project ID')
      const newReport = await api.generateReport(projectId, {})
      setReport(newReport)
      navigate(`/report/${newReport.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setRegeneratingFull(false)
      setGenerationStatus('idle')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <NavBar reportId={id} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-forest-500 text-sm">Loading report...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex flex-col h-screen">
        <NavBar reportId={id} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center card p-8">
            <AlertTriangle size={32} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-forest-700 mb-2">Report Not Found</h2>
            <p className="text-sm text-gray-500 mb-4">This report ID doesn't exist in the current session.</p>
            <button onClick={() => navigate('/map')} className="btn-primary">
              Return to Map
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#F8FAF9]">
      <NavBar reportId={id} />

      {/* Report header */}
      <div className="bg-white border-b border-[#D8EAE0] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-forest-800 truncate max-w-lg">
            {report.title}
          </h1>
          <span className="badge bg-forest-100 text-forest-700 border border-forest-200">v{report.version || 1}</span>
          {report.created_at && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              {new Date(report.created_at).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons report={report} />
          <button
            onClick={() => navigate(`/report/${id}/compare`)}
            className="btn-secondary flex items-center gap-1.5 text-xs"
          >
            <GitCompare size={13} />
            Compare Versions
          </button>
        </div>
      </div>

      {/* AI disclaimer */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2">
        <AlertTriangle size={13} className="text-amber-500 shrink-0" />
        <p className="text-xs text-amber-700">
          <strong>Human Review Required</strong> — This report was generated with AI assistance. All engineering recommendations must be validated by qualified engineers before any implementation decisions.
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Report (left 65%) */}
        <div className="flex-1 overflow-y-auto p-6">
          <ReportViewer report={report} onCitationClick={handleCitationClick} />
        </div>

        {/* Source inspector (right 35%) */}
        <div className="w-[340px] flex-shrink-0 overflow-hidden">
          <SourceDrawer
            source={selectedSource}
            allSources={report.sources || []}
            onClose={() => setSelectedSource(null)}
            onSelectSource={setSelectedSource}
          />
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="bg-white border-t border-[#D8EAE0] px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/map')}
          className="btn-secondary flex items-center gap-1.5 text-xs"
        >
          <Edit3 size={13} />
          Edit Parameters
        </button>
        <button
          onClick={handleRegenerateFull}
          disabled={regeneratingFull}
          className="btn-primary flex items-center gap-1.5 text-xs"
        >
          <RefreshCw size={13} className={regeneratingFull ? 'animate-spin' : ''} />
          {regeneratingFull ? 'Regenerating...' : 'Regenerate Full Report'}
        </button>
      </div>
    </div>
  )
}
