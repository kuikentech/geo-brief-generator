import { create } from 'zustand'

export const useReportStore = create((set, get) => ({
  reports: {},
  currentReport: null,
  generationStatus: 'idle', // idle | computing | retrieving | building | generating | done | error
  generationLog: [],

  setReport: (report) =>
    set((state) => ({
      reports: { ...state.reports, [report.id]: report },
      currentReport: report,
    })),

  addReport: (report) =>
    set((state) => ({
      reports: { ...state.reports, [report.id]: report },
    })),

  setCurrentReport: (reportId) =>
    set((state) => ({
      currentReport: state.reports[reportId] || null,
    })),

  setGenerationStatus: (status) => set({ generationStatus: status }),

  addLogEntry: (message) =>
    set((state) => ({
      generationLog: [
        ...state.generationLog,
        { timestamp: new Date().toISOString(), message },
      ],
    })),

  clearLog: () => set({ generationLog: [] }),

  updateSection: (reportId, sectionName, updates) =>
    set((state) => {
      const report = state.reports[reportId]
      if (!report) return state
      const updatedSections = report.sections.map((s) =>
        s.name === sectionName ? { ...s, ...updates } : s
      )
      const updatedReport = { ...report, sections: updatedSections }
      return {
        reports: { ...state.reports, [reportId]: updatedReport },
        currentReport:
          state.currentReport?.id === reportId
            ? updatedReport
            : state.currentReport,
      }
    }),
}))
