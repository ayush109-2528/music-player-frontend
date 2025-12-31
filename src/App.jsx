import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { PlayerProvider } from './contexts/PlayerContext'
import { Loader2 } from 'lucide-react'

// Layouts & Components
import Layout from './Layout'
import AuthPage from './components/AuthPage'

// Pages
import Home from './pages/home'
import Library from './pages/Library'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    )
  }

  // Auth Functions passed to AuthPage
  const authProps = {
    signInWithPassword: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signInWithOtp: (email) => supabase.auth.signInWithOtp({ email }),
    verifyOtp: (email, token) => supabase.auth.verifyOtp({ email, token, type: 'signup' }),
    onSuccess: () => {} 
  }

  return (
    <PlayerProvider>
      <BrowserRouter>
        <Routes>
          {!session ? (
            // --- LOGGED OUT ROUTES ---
            <>
              <Route path="/auth" element={<AuthPage {...authProps} />} />
              {/* Redirect any unknown URL to /auth */}
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </>
          ) : (
            // --- LOGGED IN ROUTES ---
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/library" element={<Library />} />
              
              {/* Fix for "No routes matched /auth" warning */}
              <Route path="/auth" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}
        </Routes>
      </BrowserRouter>
    </PlayerProvider>
  )
}