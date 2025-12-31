import { useEffect, useState } from 'react'
// ✅ CORRECT IMPORT: Named imports inside curly braces
import { getGenres, getCMSTracks } from '../lib/api' 
import { usePlayer } from '../contexts/PlayerContext'
import { Play, Loader2, Search, Music } from 'lucide-react'

export default function Home() {
  const [genres, setGenres] = useState([])
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const { actions } = usePlayer()

  useEffect(() => {
    async function fetchData() {
      try {
        const [genreData, trackData] = await Promise.all([
          getGenres(),
          getCMSTracks()
        ])
        setGenres(genreData || [])
        setTracks(trackData || [])
      } catch (error) {
        console.error("Failed to load home data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    )
  }

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
              className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-full py-4 pl-12 pr-6 text-white focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all placeholder:text-zinc-500"
            />
          </div>
        </div>
      </section>

      {/* Genres */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Browse Genres</h2>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {genres.length === 0 && <p className="text-zinc-500 text-sm">No genres found.</p>}
          {genres.map((genre) => (
            <div
              key={genre.id}
              className="min-w-[160px] h-24 rounded-2xl p-4 flex items-end justify-start relative overflow-hidden group cursor-pointer border border-white/5 hover:border-purple-500/50 transition-all"
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
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
           Trending Now
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tracks.length === 0 && (
            <div className="col-span-full py-10 text-center text-zinc-500 flex flex-col items-center">
              <Music className="w-12 h-12 mb-2 opacity-20" />
              <p>No tracks uploaded yet.</p>
            </div>
          )}
          
          {tracks.map((track) => (
            <div
              key={track.id}
              onClick={() => actions.setTrack(track)}
              className="group bg-zinc-900/40 border border-white/5 p-4 rounded-2xl hover:bg-zinc-800/60 hover:border-white/10 transition-all cursor-pointer hover:-translate-y-1 duration-300"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-zinc-800 shadow-lg">
                <img
                  src={track.artwork || '/default_cover.jpg'}
                  alt={track.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-xl transform scale-50 group-hover:scale-100 transition-transform duration-300">
                    <Play className="w-5 h-5 fill-white text-white ml-1" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                  {track.title}
                </h3>
                <p className="text-sm text-zinc-500 truncate">{track.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}