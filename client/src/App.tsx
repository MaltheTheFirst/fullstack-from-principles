import { Route, Routes } from 'react-router'
import StatsPage from './pages/StatsPage'
import AppLayout from './layouts/AppLayout'
import CatchLogPage from './pages/CatchLogPage'
import CatchDetailPage from './pages/CatchDetailPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<CatchLogPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/catches/:id" element={<CatchDetailPage />} />
      </Route>
    </Routes>
  )
}

export default App