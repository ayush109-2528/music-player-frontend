import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PlayerProvider } from './contexts/PlayerContext'
import { Loader2 } from 'lucide-react'

// Layouts & Components
import Layout from './Layout'
import AuthPage from './components/AuthPage'

// Pages
import Home from './pages/home'
import Library from './pages/Library'

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen w-full bg-black flex items-center justify-center"><Loader2 className="w-10 h-10 text-purple-500 animate-spin" /></div>
  return user ? children : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected Routes wrapped in Layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}