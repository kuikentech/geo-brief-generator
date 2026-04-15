import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Leaf, ChevronRight } from 'lucide-react'

const steps = [
  { label: 'Project Setup', path: '/' },
  { label: 'Map Workspace', path: '/map' },
  { label: 'Report Review', path: null },
]

export default function NavBar({ reportId }) {
  const navigate = useNavigate()
  const location = useLocation()

  const currentStep = location.pathname === '/'
    ? 0
    : location.pathname === '/map'
    ? 1
    : 2

  return (
    <header className="bg-white border-b border-[#D8EAE0] shadow-sm z-50 relative">
      <div className="max-w-full px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-8 h-8 bg-forest-600 rounded-lg flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <div>
            <span className="font-semibold text-forest-700 text-sm">Geo-Brief</span>
            <span className="text-forest-400 text-xs ml-1">by E4C</span>
          </div>
        </div>

        {/* Breadcrumb steps */}
        <nav className="flex items-center gap-1">
          {steps.map((step, i) => {
            const isActive = i === currentStep
            const isDone = i < currentStep
            const isClickable = isDone || (i === 2 && reportId)
            return (
              <React.Fragment key={step.label}>
                {i > 0 && <ChevronRight size={14} className="text-forest-300" />}
                <button
                  onClick={() => {
                    if (i === 0) navigate('/')
                    else if (i === 1) navigate('/map')
                    else if (i === 2 && reportId) navigate(`/report/${reportId}`)
                  }}
                  disabled={!isClickable && !isActive}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-forest-600 text-white'
                      : isDone || isClickable
                      ? 'bg-forest-100 text-forest-600 hover:bg-forest-200 cursor-pointer'
                      : 'text-forest-300 cursor-default'
                  }`}
                >
                  {step.label}
                </button>
              </React.Fragment>
            )
          })}
        </nav>

        {/* Right: AI notice */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full font-medium">
            AI-Assisted · Human Review Required
          </span>
        </div>
      </div>
    </header>
  )
}
