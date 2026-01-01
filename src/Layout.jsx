import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Library, LogOut, Sparkles, X } from 'lucide-react'
import AuroraWaves from './components/AuroraWaves' 
import PlayerControls from './components/PlayerControls'
import { usePlayer } from './contexts/PlayerContext'
import { supabase } from './lib/supabase'

export default function Layout() {
  const { state, actions } = usePlayer() 
  const location = useLocation()
  
  // Is the player visible?
  const showPlayer = state.currentTrack

  // Function to close the player
  const closePlayer = () => {
    actions.setTrack(null) 
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

          <button 
            onClick={() => supabase.auth.signOut()} 
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

           {/* ✅ FIX: Moved AFTER PlayerControls and added z-[100] to sit on top */}
           {/* Positioned at bottom-8 to align with standard player height */}
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