import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ThemeProvider from './components/layout/ThemeProvider'
import CommandPalette from './components/layout/CommandPalette'
import ToastContainer from './components/ui/ToastContainer'
import { useCommandPalette } from './hooks/useCommandPalette'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProjectPage from './pages/project/ProjectPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

function AppContent() {
  const { open, close } = useCommandPalette()

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <ErrorBoundary>
                <ProjectPage />
              </ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
      {open && <CommandPalette onClose={close} />}
      <ToastContainer />
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App