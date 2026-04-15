import React from 'react'
import clsx from 'clsx'
import { Shield, Globe, Users } from 'lucide-react'

const CONFIG = {
  'Government': {
    icon: Shield,
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  'Globally Recognized Org': {
    icon: Globe,
    classes: 'bg-forest-50 text-forest-700 border-forest-200',
  },
  'Community-Sourced': {
    icon: Users,
    classes: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  'E4C Solutions Library': {
    icon: Globe,
    classes: 'bg-teal-50 text-teal-700 border-teal-200',
  },
}

export default function SourceBadge({ classification, compact = false }) {
  const cfg = CONFIG[classification] || CONFIG['Globally Recognized Org']
  const Icon = cfg.icon
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        cfg.classes
      )}
    >
      <Icon size={10} />
      {compact ? '' : classification}
    </span>
  )
}
