import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom' // ✅ Added useNavigate
import { Home, Library, LogOut, Sparkles, X } from 'lucide-react'
import AuroraWaves from './components/AuroraWaves' 
import PlayerControls from './components/PlayerControls'
import { usePlayer } from './contexts/PlayerContext'
import { supabase } from './lib/supabase'

export default function Layout() {
  const { state, actions } = usePlayer() 
  const location = useLocation()
  const navigate = useNavigate() // ✅ For redirecting
  const showPlayer = state.currentTrack

  const closePlayer = () => {
    actions.setTrack(null) 
  }

  // ✅ FIX: Robust Sign Out Handler
  const handleSignOut = async () => {
    try {
      // Try to tell Supabase to sign out
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Whether it succeeded or failed (403), 
      // WE MUST clear the UI and go to login.
      navigate('/auth')
      window.location.reload() // Optional: Force reload to clear any stuck memory
    }
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* 1. VISUALIZER BACKGROUND */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <AuroraWaves analyser={state.analyser} />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 flex h-screen">
        
        {/* 2. SIDEBAR */}
        <aside className={`w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col hidden md:flex transition-all duration-300 ${showPlayer ? 'pb-32' : 'pb-6'}`}>
          <div className="flex items-center gap-3 mb-10">
             <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-900/20">
                <Sparkles className="text-white fill-white" size={16} />
             </div>
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                SoundSpace
             </h1>
          </div>
          
          <nav className="space-y-2 flex-1">
            <NavLink to="/" icon={<Home size={20} />} label="Explore" active={location.pathname === '/'} />
            <NavLink to="/library" icon={<Library size={20} />} label="My Library" active={location.pathname === '/library'} />
          </nav>

          {/* ✅ FIX: Use the new handler here */}
          <button 
            onClick={handleSignOut} 
            className="flex items-center gap-3 text-zinc-400 hover:text-white mt-auto p-3 rounded-xl hover:bg-white/5 transition"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </aside>

        {/* 3. MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto relative">
          <div className={`p-8 ${showPlayer ? 'pb-32' : 'pb-10'}`}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* 4. PLAYER BAR */}
      {showPlayer && (
        <div className="fixed bottom-0 left-0 w-full z-50">
           
           <PlayerControls />

           {/* Close Button */}
           <div className="absolute bottom-8 right-6 z-[100] md:right-10">
              <button 
                onClick={closePlayer}
                className="bg-zinc-900/80 backdrop-blur-md border border-white/10 text-zinc-400 hover:text-white p-2 rounded-full shadow-lg hover:bg-red-500/20 hover:border-red-500/50 transition-all"
                title="Close Player"
              >
                <X size={16} />
              </button>
           </div>

        </div>
      )}
    </div>
  )
}

const NavLink = ({ to, icon, label, active }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
      active ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
)