import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, ArrowRight, Globe, Droplets, Zap } from 'lucide-react'
import { useProjectStore } from '../stores/projectStore'

const TECH_OPTIONS = [
  'Solar Water Purification',
  'Biogas',
  'Clean Cookstoves',
  'Solar Energy',
  'Rainwater Harvesting',
  'Sanitation',
  'Other',
]

const SECTOR_OPTIONS = ['WASH', 'Energy', 'Health', 'Agriculture', 'Other']

export default function ProjectSetup() {
  const navigate = useNavigate()
  const { project, setProject } = useProjectStore()

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/map')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-[#F8FAF9] to-forest-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-[#D8EAE0] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-forest-600 rounded-lg flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="font-semibold text-forest-700">Geo-Context Engineering Brief Generator</span>
        </div>
        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-medium">
          E4C AI Pilot Hackathon 2026
        </span>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* E4C Branding Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-forest-600 rounded-2xl mb-4 shadow-lg">
              <Globe size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-forest-800 mb-2">
              Engineering Brief Generator
            </h1>
            <p className="text-forest-500 text-base max-w-md mx-auto">
              Generate AI-assisted, geo-contextualized engineering briefs for development technology projects — powered by E4C solutions data.
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-forest-400">
                <Droplets size={12} />
                <span>WASH</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-forest-400">
                <Zap size={12} />
                <span>Energy</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-forest-400">
                <Leaf size={12} />
                <span>Agriculture</span>
              </div>
            </div>
          </div>

          {/* Setup Card */}
          <div className="card p-8 shadow-lg">
            <h2 className="text-lg font-semibold text-forest-700 mb-6">Project Setup</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Project Title */}
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1.5">
                  Project Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={project.title}
                  onChange={(e) => setProject({ title: e.target.value })}
                  placeholder="e.g., Solar Water Purification Feasibility — Northern Kenya"
                  className="input-field"
                />
              </div>

              {/* Geography */}
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1.5">
                  Geography / Target Region <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={project.geography}
                  onChange={(e) => setProject({ geography: e.target.value })}
                  placeholder="e.g., Northern Kenya (Marsabit / Turkana)"
                  className="input-field"
                />
                <p className="text-xs text-gray-400 mt-1">You will refine this on the map in the next step.</p>
              </div>

              {/* Engineering Objective */}
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1.5">
                  Engineering Objective <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={project.engineeringObjective}
                  onChange={(e) => setProject({ engineeringObjective: e.target.value })}
                  placeholder="Describe the engineering goal and what the brief should evaluate..."
                  className="input-field resize-none"
                />
              </div>

              {/* Technology + Sector row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-1.5">
                    Technology Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={project.technologyType}
                    onChange={(e) => setProject({ technologyType: e.target.value })}
                    className="input-field"
                  >
                    {TECH_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-1.5">
                    Sector <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={project.sector}
                    onChange={(e) => setProject({ sector: e.target.value })}
                    className="input-field"
                  >
                    {SECTOR_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scenario Description */}
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1.5">
                  Scenario Description
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={project.scenarioDescription}
                  onChange={(e) => setProject({ scenarioDescription: e.target.value })}
                  placeholder="Community scale, deployment constraints, user population size, maintenance capacity..."
                  className="input-field resize-none"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2 rounded-xl shadow-md"
                >
                  Continue to Map
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-forest-400 mt-6">
            AI-assisted output for engineering scoping only. All recommendations require expert review before implementation.
          </p>
        </div>
      </div>
    </div>
  )
}
