import React, { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'

function buildReportHTML(report) {
  const sections = report.sections || []
  const sources = report.sources || []

  const confidenceColor = (level) => {
    if (level === 'high') return '#991B1B'    // red — high intervention
    if (level === 'medium') return '#92400E'  // amber
    return '#2D6A4F'                           // green — low intervention
  }
  const confidenceLabel = (level) => {
    if (level === 'high') return 'High — Expert Review Required'
    if (level === 'medium') return 'Medium — Review Recommended'
    return 'Low — Standard Review'
  }

  const sourcesHTML = sources.map((s) => `
    <div class="source-item">
      <strong>${s.id}</strong> — ${s.title || s.source_name || ''}
      ${s.url ? `<br/><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.url}</a>` : ''}
      ${s.provider ? `<br/><em>Provider: ${s.provider}</em>` : ''}
    </div>`).join('')

  const sectionsHTML = sections.map((s) => {
    const formattedContent = (s.content || '')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\[([A-Z]+-\d+)\]/g, '<span class="citation">[$1]</span>')

    const assumptionsHTML = s.assumptions && s.assumptions.length
      ? `<div class="assumptions">
           <strong>Assumptions:</strong>
           <ul>${s.assumptions.map((a) => `<li>${a}</li>`).join('')}</ul>
         </div>`
      : ''

    const limitationsHTML = s.limitations && s.limitations.length
      ? `<div class="limitations">
           <strong>Limitations:</strong>
           <ul>${s.limitations.map((l) => `<li>${l}</li>`).join('')}</ul>
         </div>`
      : ''

    const basisHTML = s.basis
      ? `<p class="basis">Based on: ${s.basis}</p>`
      : ''

    return `
    <div class="section">
      <div class="section-header">
        <h2>${s.display_name || s.name}</h2>
        <span class="confidence-badge" style="background:${confidenceColor(s.confidence)}20;color:${confidenceColor(s.confidence)};border:1px solid ${confidenceColor(s.confidence)}40">
          ${confidenceLabel(s.confidence || 'medium')}
        </span>
      </div>
      <p>${formattedContent}</p>
      ${basisHTML}
      ${assumptionsHTML}
      ${limitationsHTML}
    </div>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${report.title || 'Engineering Brief'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1a1a1a;
      background: #fff;
      padding: 0;
    }
    .page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm 18mm 20mm 18mm;
    }
    h1 {
      font-size: 20pt;
      color: #1B4332;
      border-bottom: 3px solid #52B788;
      padding-bottom: 10px;
      margin-bottom: 8px;
      font-family: 'Helvetica Neue', Arial, sans-serif;
    }
    .meta {
      font-size: 9pt;
      color: #6B7280;
      margin-bottom: 20px;
      font-family: Arial, sans-serif;
    }
    .disclaimer {
      background: #FEF3C7;
      border: 1px solid #F59E0B;
      border-left: 4px solid #F59E0B;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 24px;
      font-size: 9pt;
      font-family: Arial, sans-serif;
    }
    .disclaimer strong { color: #92400E; }
    .section {
      margin-bottom: 28px;
      padding: 16px 18px;
      background: #F8FAF9;
      border-left: 4px solid #52B788;
      border-radius: 4px;
      page-break-inside: avoid;
    }
    .section-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 10px;
    }
    h2 {
      font-size: 13pt;
      color: #2D6A4F;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      flex: 1;
    }
    .confidence-badge {
      font-size: 8pt;
      padding: 2px 8px;
      border-radius: 12px;
      font-family: Arial, sans-serif;
      font-weight: bold;
      white-space: nowrap;
      flex-shrink: 0;
    }
    p { margin-bottom: 8px; font-size: 10.5pt; }
    .citation {
      background: #dcf1e5;
      color: #2D6A4F;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 9pt;
      font-family: 'Courier New', monospace;
    }
    .basis {
      color: #6B7280;
      font-size: 9pt;
      font-style: italic;
      margin-top: 8px;
    }
    .assumptions, .limitations {
      margin-top: 10px;
      font-size: 9.5pt;
      font-family: Arial, sans-serif;
    }
    .assumptions strong { color: #2D6A4F; }
    .limitations strong { color: #92400E; }
    ul { padding-left: 18px; margin-top: 4px; }
    li { margin-bottom: 2px; }
    .sources-section {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 2px solid #D8EAE0;
    }
    .sources-section h2 { color: #1B4332; margin-bottom: 12px; }
    .source-item {
      font-size: 9pt;
      font-family: Arial, sans-serif;
      color: #374151;
      margin-bottom: 8px;
      padding: 6px 10px;
      background: #F9FAFB;
      border-radius: 3px;
    }
    .source-item a { color: #2D6A4F; }
    footer {
      margin-top: 32px;
      padding-top: 10px;
      border-top: 1px solid #D8EAE0;
      font-size: 8pt;
      color: #9CA3AF;
      font-family: Arial, sans-serif;
      text-align: center;
    }
    @media print {
      body { background: white; }
      .page { padding: 10mm 12mm; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">
    <h1>${report.title || 'Engineering Context Brief'}</h1>
    <div class="meta">
      Generated: ${report.created_at ? new Date(report.created_at).toLocaleString() : new Date().toLocaleString()} &nbsp;|&nbsp;
      Version: ${report.version || 1} &nbsp;|&nbsp;
      Mode: ${report.generation_mode || 'demo'} &nbsp;|&nbsp;
      Sections: ${(report.sections || []).length} &nbsp;|&nbsp;
      Sources: ${(report.sources || []).length}
    </div>
    <div class="disclaimer">
      <strong>AI-Assisted Document — Human Review Required</strong><br/>
      This report was generated with AI assistance. All engineering recommendations must be validated
      by qualified engineers before any implementation decisions. Confidence levels indicate the degree
      of AI certainty and required expert intervention — High (red) sections require the most scrutiny.
    </div>

    ${sectionsHTML}

    ${sources.length > 0 ? `
    <div class="sources-section">
      <h2>Evidence Sources</h2>
      ${sourcesHTML}
    </div>` : ''}

    <footer>
      Generated by Geo-Context Engineering Brief Generator &nbsp;|&nbsp; E4C AI Pilot Hackathon 2026 &nbsp;|&nbsp;
      Report ID: ${report.id || 'N/A'}
    </footer>
  </div>
</body>
</html>`
}

export default function ExportButtons({ report }) {
  const [exporting, setExporting] = useState(false)

  const exportPDF = () => {
    if (!report) return
    setExporting(true)
    try {
      const html = buildReportHTML(report)
      const w = window.open('', '_blank')
      if (!w) {
        alert('Pop-up blocked. Please allow pop-ups for this site and try again.')
        setExporting(false)
        return
      }
      w.document.write(html)
      w.document.close()
      // Let the content render, then trigger print
      setTimeout(() => {
        w.focus()
        w.print()
      }, 600)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setTimeout(() => setExporting(false), 1000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportPDF}
        disabled={exporting}
        className="btn-secondary flex items-center gap-1.5 text-xs"
        title="Opens a print-ready version of the full report in a new tab"
      >
        {exporting
          ? <Loader2 size={13} className="animate-spin" />
          : <FileText size={13} />}
        Export PDF
      </button>
    </div>
  )
}
