import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProjectSetup from './pages/ProjectSetup'
import MapWorkspace from './pages/MapWorkspace'
import ReportReview from './pages/ReportReview'
import VersionCompare from './pages/VersionCompare'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectSetup />} />
        <Route path="/map" element={<MapWorkspace />} />
        <Route path="/report/:id" element={<ReportReview />} />
        <Route path="/report/:id/compare" element={<VersionCompare />} />
      </Routes>
    </BrowserRouter>
  )
}
