import { create } from 'zustand'

const ALL_LAYERS = [
  { id: 'temperature', label: 'Temperature', group: 'weather', color: '#E76F51', active: true },
  { id: 'precipitation', label: 'Precipitation / Rainfall', group: 'weather', color: '#4895EF', active: false },
  { id: 'aridity', label: 'Aridity / Drought Proxy', group: 'weather', color: '#E9C46A', active: true },
  { id: 'cloud_solar', label: 'Cloud Cover / Solar Exposure', group: 'weather', color: '#FFBE0B', active: true },
  { id: 'extreme_weather', label: 'Extreme Weather Risk', group: 'weather', color: '#E63946', active: false },
  { id: 'roads', label: 'Road Network', group: 'infrastructure', color: '#6B4226', active: false },
  { id: 'settlements', label: 'Settlements / Population', group: 'infrastructure', color: '#6A4C93', active: false },
  { id: 'electricity', label: 'Electricity Access Proxy', group: 'infrastructure', color: '#F4A261', active: true },
  { id: 'healthcare', label: 'Healthcare Facility Proximity', group: 'infrastructure', color: '#2A9D8F', active: false },
  { id: 'water_infra', label: 'Water Infrastructure Proxy', group: 'infrastructure', color: '#023E8A', active: false },
]

export const useMapStore = create((set, get) => ({
  selectedGeometry: null,
  activeLayers: ALL_LAYERS,
  layerOpacity: Object.fromEntries(ALL_LAYERS.map((l) => [l.id, 70])),
  viewState: {
    longitude: 38.5,
    latitude: 3.5,
    zoom: 6,
  },

  setGeometry: (geometry) => set({ selectedGeometry: geometry }),

  setViewState: (viewState) => set({ viewState }),

  toggleLayer: (layerId) =>
    set((state) => ({
      activeLayers: state.activeLayers.map((l) =>
        l.id === layerId ? { ...l, active: !l.active } : l
      ),
    })),

  setLayerOpacity: (layerId, opacity) =>
    set((state) => ({
      layerOpacity: { ...state.layerOpacity, [layerId]: opacity },
    })),

  getActiveLayerIds: () =>
    get().activeLayers.filter((l) => l.active).map((l) => l.id),

  getAllLayers: () => get().activeLayers,
}))
