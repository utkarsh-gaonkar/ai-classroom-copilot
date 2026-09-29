import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import QuizPractice from './pages/QuizPractice'
import Settings from './pages/Settings'
import StudyCopilot from './pages/StudyCopilot'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="study" element={<StudyCopilot />} />
        <Route path="quiz" element={<QuizPractice />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
