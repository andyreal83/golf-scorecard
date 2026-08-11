import { HashRouter, Routes, Route } from 'react-router-dom'
import { ActiveRoundProvider } from './context/ActiveRoundContext'
import Home from './pages/Home'
import StartRound from './pages/StartRound'
import HoleEntry from './pages/HoleEntry'
import Scorecard from './pages/Scorecard'
import CourseSetup from './pages/CourseSetup'
import Settings from './pages/Settings'
import CourseLibrary from './pages/CourseLibrary'
import CourseEditor from './pages/CourseEditor'

export default function App() {
  return (
    <ActiveRoundProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/courses" element={<CourseLibrary />} />
          <Route path="/courses/new" element={<CourseEditor />} />
          <Route path="/courses/:courseId/edit" element={<CourseEditor />} />
          <Route path="/round/new" element={<StartRound />} />
          <Route path="/round/:id/hole/:n" element={<HoleEntry />} />
          <Route path="/round/:id/scorecard" element={<Scorecard />} />
          <Route path="/round/:id/setup" element={<CourseSetup />} />
        </Routes>
      </HashRouter>
    </ActiveRoundProvider>
  )
}
