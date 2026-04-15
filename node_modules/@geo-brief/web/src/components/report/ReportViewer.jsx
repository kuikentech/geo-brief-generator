import React from 'react'
import SectionCard from './SectionCard'
import { useReportStore } from '../../stores/reportStore'

export default function ReportViewer({ report, onCitationClick }) {
  const { updateSection } = useReportStore()

  const handleSectionUpdated = (sectionName, updatedSection) => {
    updateSection(report.id, sectionName, updatedSection)
  }

  if (!report || !report.sections || report.sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-forest-400">
        <p className="text-sm">No report content available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {report.sections.map((section) => (
        <SectionCard
          key={section.name}
          section={section}
          reportId={report.id}
          onCitationClick={onCitationClick}
          onUpdated={handleSectionUpdated}
        />
      ))}
    </div>
  )
}
