import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Links from './pages/Links'
import Notes from './pages/Notes'
import QuizPractice from './pages/QuizPractice'
import Settings from './pages/Settings'
import StudyCopilot from './pages/StudyCopilot'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="study" element={<StudyCopilot />} />
        <Route path="notes" element={<Notes />} />
        <Route path="links" element={<Links />} />
        <Route path="quiz" element={<QuizPractice />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
