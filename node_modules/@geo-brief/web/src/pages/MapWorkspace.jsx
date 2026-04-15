import React from 'react'
import NavBar from '../components/ui/NavBar'
import LayerPanel from '../components/map/LayerPanel'
import MapCanvas from '../components/map/MapCanvas'
import ContextPanel from '../components/map/ContextPanel'

export default function MapWorkspace() {
  return (
    <div className="flex flex-col h-screen bg-[#F8FAF9] overflow-hidden">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        <LayerPanel />
        <MapCanvas />
        <ContextPanel />
      </div>
    </div>
  )
}
