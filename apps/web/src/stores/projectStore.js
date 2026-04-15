import { create } from 'zustand'

const defaultProject = {
  id: null,
  title: 'Solar Water Purification Feasibility — Northern Kenya',
  geography: 'Northern Kenya (Marsabit / Turkana Region)',
  engineeringObjective: 'Assess technical and environmental viability of deploying solar-powered water purification systems for rural communities with limited grid access.',
  technologyType: 'Solar Water Purification',
  sector: 'WASH',
  scenarioDescription: 'Community-scale deployment serving 500–2,000 people per installation. Systems must operate reliably under extreme heat and dust conditions with minimal maintenance infrastructure.',
}

export const useProjectStore = create((set, get) => ({
  project: { ...defaultProject },

  setProject: (updates) =>
    set((state) => ({
      project: { ...state.project, ...updates },
    })),

  resetProject: () =>
    set({ project: { ...defaultProject, id: null } }),
}))
