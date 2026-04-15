import React from 'react'
import clsx from 'clsx'

// "Level" here represents the required intervention level for this AI-generated section.
// High = AI confidence is limited → expert review required → RED
// Medium = AI is moderately confident → review recommended → AMBER
// Low = AI is highly confident → standard review → GREEN
const CONFIG = {
  high: {
    label: 'High — Expert Review Required',
    shortLabel: 'High',
    classes: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  medium: {
    label: 'Medium — Review Recommended',
    shortLabel: 'Medium',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  low: {
    label: 'Low — Standard Review',
    shortLabel: 'Low',
    classes: 'bg-forest-100 text-forest-700 border-forest-200',
    dot: 'bg-forest-500',
  },
}

export default function ConfidenceBadge({ level = 'medium', short = false }) {
  const cfg = CONFIG[level] || CONFIG.medium
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        cfg.classes
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {short ? cfg.shortLabel : cfg.label}
    </span>
  )
}
