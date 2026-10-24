import { Route, Routes } from 'react-router'
import CatchLogPage from './pages/CatchLogPage'
import StatsPage from './pages/StatsPage'
import CatchDetailPage from './pages/CatchDetailPage'
import AppLayout from './layouts/AppLayout'

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