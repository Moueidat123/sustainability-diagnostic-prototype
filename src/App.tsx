import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import CompanyProfile from './pages/CompanyProfile'
import Sites from './pages/Sites'
import Scope1Fuels from './pages/Scope1Fuels'
import Scope1Fleet from './pages/Scope1Fleet'
import Scope2Electricity from './pages/Scope2Electricity'
import Review from './pages/Review'
import Accreditation from './pages/Accreditation'
import Reports from './pages/Reports'
import Admin from './pages/Admin'
import { useRole } from './lib/useRole'
import './App.css'

function App() {
  const { role, setRole } = useRole()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <BrowserRouter basename="/sustainability-diagnostic-prototype">
      <div className="flex h-screen overflow-hidden">
        <Sidebar role={role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header role={role} setRole={setRole} onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/company" element={<CompanyProfile />} />
              <Route path="/sites" element={<Sites />} />
              <Route path="/scope1-fuels" element={<Scope1Fuels />} />
              <Route path="/scope1-fleet" element={<Scope1Fleet />} />
              <Route path="/scope2-electricity" element={<Scope2Electricity />} />
              <Route path="/review" element={<Review />} />
              <Route path="/accreditation" element={<Accreditation />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
