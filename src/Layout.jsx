import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Library, PlusSquare, Search, LogOut } from 'lucide-react'
import AuroraWaves from './components/AuroraWaves' // Your visualizer file
import PlayerControls from './components/PlayerControls' // Your existing player
import { usePlayer } from './contexts/PlayerContext'
import { supabase } from './lib/supabase'

export default function Layout() {
  const { state } = usePlayer() // Assuming state has analyserNode from your context
  const location = useLocation()

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* 1. VISUALIZER BACKGROUND */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        {/* Pass analyser from player context if available */}
        <AuroraWaves analyser={state.analyser} />
      </div>

      <div className="relative z-10 flex h-screen">
        
        {/* 2. SIDEBAR */}
        <aside className="w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-8">
            SoundSpace
          </h1>
          
          <nav className="space-y-2 flex-1">
            <NavLink to="/" icon={<Home />} label="Explore" active={location.pathname === '/'} />
            <NavLink to="/library" icon={<Library />} label="My Library" active={location.pathname === '/library'} />
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
        <main className="flex-1 overflow-y-auto p-8 pb-32">
          <Outlet />
        </main>
      </div>

      {/* 4. PLAYER BAR */}
      <div className="fixed bottom-0 left-0 w-full z-50">
        <PlayerControls />
      </div>
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