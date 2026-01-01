import { useEffect, useState, useRef } from 'react'
import { getGenres, getCMSTracks, getUserPlaylists, addTrackToPlaylist } from '../lib/api' 
import { usePlayer } from '../contexts/PlayerContext'
import { useAuth } from '../contexts/AuthContext'
import { Play, Pause, Loader2, Search, Plus, MoreVertical } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()
  const { state, actions } = usePlayer()

  const [genres, setGenres] = useState([])
  const [tracks, setTracks] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')

  useEffect(() => {
    async function fetchData() {
      try {
        const [genreData, trackData] = await Promise.all([
          getGenres(),
          getCMSTracks()
        ])
        setGenres(genreData || [])
        setTracks(trackData || [])

        if (user) {
            const pl = await getUserPlaylists(user.id)
            setPlaylists(pl || [])
        }
      } catch (error) {
        console.error("Failed to load home data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  // Filtering Logic
  const filteredTracks = tracks.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.artist.toLowerCase().includes(searchQuery.toLowerCase())
      const matchGenre = selectedGenre === 'All' || t.genres?.name === selectedGenre
      return matchSearch && matchGenre
  })

  if (loading) return <div className="flex items-center justify-center h-[50vh]"><Loader2 className="w-10 h-10 text-purple-500 animate-spin" /></div>

  return (
    <div className="space-y-10">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-8 md:p-12 border border-white/10">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Fresh Sounds</span>
          </h1>
          <p className="text-zinc-300 text-lg mb-8 max-w-lg">
            Stream the latest community uploads and trending beats directly from the studio.
          </p>
          
          <div className="relative max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 group-focus-within:text-purple-400 transition-colors" />
            <input
              type="text"
              placeholder="Search tracks, artists..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-full py-4 pl-12 pr-6 text-white focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all placeholder:text-zinc-500"
            />
          </div>
        </div>
      </section>

      {/* Genres */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Browse Genres</h2>
          {selectedGenre !== 'All' && <button onClick={() => setSelectedGenre('All')} className="text-sm text-purple-400">Clear</button>}
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          <div
             onClick={() => setSelectedGenre('All')}
             className={`min-w-[160px] h-24 rounded-2xl p-4 flex items-end justify-start relative overflow-hidden group cursor-pointer border transition-all ${selectedGenre === 'All' ? 'ring-2 ring-white scale-105' : 'border-white/5 hover:scale-105'}`}
             style={{ backgroundColor: '#18181b' }}
          >
             <span className="relative z-10 font-bold text-lg">All</span>
          </div>
          {genres.map((genre) => (
            <div
              key={genre.id}
              onClick={() => setSelectedGenre(genre.name)}
              className={`min-w-[160px] h-24 rounded-2xl p-4 flex items-end justify-start relative overflow-hidden group cursor-pointer border transition-all ${selectedGenre === genre.name ? 'ring-2 ring-white scale-105' : 'border-white/5 hover:scale-105'}`}
              style={{ backgroundColor: genre.color || '#27272a' }} 
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="relative z-10 font-bold text-lg group-hover:scale-105 transition-transform origin-bottom-left">
                {genre.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Tracks Grid */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">Trending Now</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTracks.length === 0 && <p className="text-zinc-500 col-span-full">No tracks found.</p>}
          
          {filteredTracks.map((track) => (
            <TrackCard 
                key={track.id} 
                track={track} 
                playlists={playlists}
                isCurrent={state.currentTrack?.id === track.id}
                isPlaying={state.isPlaying}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

const TrackCard = ({ track, playlists, isCurrent, isPlaying }) => {
    const { actions } = usePlayer()
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef(null)

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false) }
        document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handlePlay = () => {
        if(!track.url) return alert("Track URL missing")
        // ✅ FIX: Changed from 'playTrack' to 'setTrack'
        actions.setTrack(track)
    }

    const handleAddToPlaylist = async (pid) => {
        try { await addTrackToPlaylist(pid, track.id); alert("Added!"); } 
        catch(e) { 
            console.error(e); 
            alert("Error adding to playlist. Make sure SQL fix is applied.") 
        }
        setShowMenu(false)
    }

    return (
        <div className="group bg-zinc-900/40 border border-white/5 p-4 rounded-2xl hover:bg-zinc-800/60 hover:border-white/10 transition-all hover:-translate-y-1 duration-300">
            <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-zinc-800 shadow-lg cursor-pointer" onClick={handlePlay}>
                <img src={track.artwork || '/default_cover.jpg'} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition opacity-0 group-hover:opacity-100 backdrop-blur-[2px] ${isCurrent ? 'opacity-100' : ''}`}>
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-xl transform scale-50 group-hover:scale-100 transition-transform duration-300">
                        {isCurrent && isPlaying ? <Pause className="w-5 h-5 fill-white text-white" /> : <Play className="w-5 h-5 fill-white text-white ml-1" />}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1 cursor-pointer" onClick={handlePlay}>
                    <h3 className="font-bold text-white truncate group-hover:text-purple-400 transition-colors">{track.title}</h3>
                    <p className="text-sm text-zinc-500 truncate">{track.artist}</p>
                </div>
                
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition opacity-0 group-hover:opacity-100">
                        <MoreVertical size={20} />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                            {playlists.map(pl => (
                                <button key={pl.id} onClick={() => handleAddToPlaylist(pl.id)} className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-purple-600/20 transition flex items-center gap-2">
                                    <Plus size={14} /> {pl.name}
                                </button>
                            ))}
                            {playlists.length === 0 && <div className="px-3 py-2 text-xs text-zinc-500">No playlists</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}