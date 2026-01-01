import { useEffect, useState, useRef } from 'react'
import { getUserTracks, getUserPlaylists, uploadUserTrack, createPlaylist, deletePlaylist, getPlaylistTracks, removeTrackFromPlaylist, addTrackToPlaylist } from '../lib/api'
import { supabase } from '../lib/supabase'
import { Plus, Upload, Trash2, FolderPlus, Play, Loader2, ArrowLeft, MoreHorizontal, FileAudio, Search } from 'lucide-react'
import { usePlayer } from '../contexts/PlayerContext'

export default function Library() {
  const [user, setUser] = useState(null)
  const [tracks, setTracks] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)

  // View State
  const [activeView, setActiveView] = useState('main') 
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistTracks, setPlaylistTracks] = useState([])
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('')

  // Upload State
  const [isUploading, setIsUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [newPlaylistName, setNewPlaylistName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        refreshMainData(user.id)
      }
    })
  }, [])

  const refreshMainData = async (uid) => {
    try {
      const [t, p] = await Promise.all([getUserTracks(uid), getUserPlaylists(uid)])
      setTracks(t || [])
      setPlaylists(p || [])
    } finally {
      setLoading(false)
    }
  }

  const openPlaylist = async (playlist) => {
    setLoading(true)
    setSelectedPlaylist(playlist)
    setActiveView('playlist')
    setSearchQuery('')
    const pTracks = await getPlaylistTracks(playlist.id)
    setPlaylistTracks(pTracks || [])
    setLoading(false)
  }

  const handleUpload = async () => {
    if (!uploadFile) return
    setIsUploading(true)
    try {
      await uploadUserTrack(uploadFile, user.id)
      setUploadFile(null)
      refreshMainData(user.id)
      alert("Track uploaded successfully!")
    } catch (e) {
      alert("Upload failed: " + e.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName) return
    await createPlaylist(user.id, newPlaylistName)
    setNewPlaylistName('')
    refreshMainData(user.id)
  }

  // Filter Helper
  const filterList = (list) => {
      if(!searchQuery) return list
      return list.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  if (loading && !user) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-purple-500"/></div>

  // --- PLAYLIST VIEW ---
  if (activeView === 'playlist' && selectedPlaylist) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <button onClick={() => { setActiveView('main'); setSearchQuery(''); }} className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
          <ArrowLeft size={20} /> Back to Library
        </button>
        
        <div className="bg-gradient-to-r from-purple-900/50 to-black p-8 rounded-3xl border border-white/10 flex items-end gap-6">
          <div className="w-40 h-40 bg-zinc-800 rounded-2xl shadow-2xl flex items-center justify-center">
             <FolderPlus size={60} className="text-white/20" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">{selectedPlaylist.name}</h1>
            <p className="text-zinc-400">{playlistTracks.length} tracks • Private Playlist</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
                placeholder="Search in playlist..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-purple-500 outline-none"
            />
        </div>

        <div className="space-y-2">
            {playlistTracks.length === 0 && <p className="text-zinc-500 p-4">This playlist is empty.</p>}
            {filterList(playlistTracks).map((track, index) => (
              <TrackRow 
                key={`${track.id}-${index}`} 
                track={track} 
                playlists={playlists} 
                inPlaylistMode={true}
                onRemove={() => {
                  removeTrackFromPlaylist(selectedPlaylist.id, track.id).then(() => openPlaylist(selectedPlaylist))
                }}
              />
            ))}
        </div>
      </div>
    )
  }

  // --- MAIN LIBRARY VIEW ---
  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      
      {/* Upload */}
      <section className="bg-white/5 rounded-3xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Upload className="text-purple-400" /> Upload Music
        </h2>
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <label className="flex-1 w-full cursor-pointer bg-black/40 border border-white/20 border-dashed rounded-xl p-6 flex flex-col items-center justify-center hover:bg-white/5 transition">
                <input type="file" accept="audio/*" className="hidden" onChange={e => setUploadFile(e.target.files[0])} />
                <FileAudio size={32} className="text-zinc-500 mb-2" />
                <span className="text-zinc-300 font-medium">{uploadFile ? uploadFile.name : "Click to select audio file"}</span>
            </label>
            <button 
              onClick={handleUpload} 
              disabled={isUploading || !uploadFile}
              className="w-full md:w-auto px-8 py-6 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="animate-spin" /> : 'Upload Now'}
            </button>
        </div>
      </section>

      {/* Playlists */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold text-zinc-400">My Playlists</h2>
          <div className="flex gap-2">
            <input 
              value={newPlaylistName} 
              onChange={e => setNewPlaylistName(e.target.value)} 
              placeholder="New Playlist Name" 
              className="bg-transparent border-b border-white/20 px-2 text-white focus:outline-none focus:border-purple-500" 
            />
            <button onClick={handleCreatePlaylist} className="p-2 bg-purple-600 rounded-lg text-white"><Plus size={16}/></button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {playlists.map(pl => (
            <div 
              key={pl.id} 
              onClick={() => openPlaylist(pl)}
              className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 rounded-2xl border border-white/5 relative group cursor-pointer hover:scale-[1.02] transition"
            >
              <FolderPlus className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="font-bold text-lg text-white truncate">{pl.name}</h3>
              <p className="text-xs text-zinc-500">Private Playlist</p>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  deletePlaylist(pl.id).then(() => refreshMainData(user.id))
                }} 
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Tracks */}
      <section>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-zinc-400">All Uploads</h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                    placeholder="Search uploads..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm text-white focus:border-purple-500 outline-none w-48"
                />
            </div>
        </div>
        <div className="space-y-2">
          {tracks.length === 0 && <p className="text-zinc-500">No uploads yet.</p>}
          {filterList(tracks).map((track, index) => (
            <TrackRow 
                key={`${track.id}-${index}`} 
                track={track} 
                playlists={playlists} 
            />
          ))}
        </div>
      </section>
    </div>
  )
}

const TrackRow = ({ track, playlists, inPlaylistMode = false, onRemove }) => {
  const { actions } = usePlayer()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleAddToPlaylist = async (playlistId) => {
    try {
        await addTrackToPlaylist(playlistId, track.id)
        alert(`Added to playlist!`)
    } catch(e) { console.error(e) }
    setShowMenu(false)
  }

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition group relative">
      <div onClick={() => actions.setTrack(track)} className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden relative cursor-pointer flex-shrink-0">
        {/* USE track.artwork */}
        <img src={track.artwork || '/default_cover.jpg'} className="w-full h-full object-cover opacity-60 group-hover:opacity-40" />
        <div className="absolute inset-0 flex items-center justify-center">
            <Play size={16} className="text-white fill-white" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white truncate">{track.title}</h4>
        <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
      </div>

      <div className="relative" ref={menuRef}>
        {inPlaylistMode ? (
           <button onClick={onRemove} className="p-2 text-zinc-500 hover:text-red-400" title="Remove from Playlist">
             <Trash2 size={18} />
           </button>
        ) : (
          <>
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-zinc-500 hover:text-white">
              <MoreHorizontal size={18} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 bottom-full mb-2 bg-zinc-900 border border-white/10 rounded-xl p-2 w-48 z-[100] shadow-2xl">
                <p className="text-xs text-zinc-500 mb-2 px-2 uppercase font-bold tracking-wider">Add to Playlist</p>
                {playlists.length === 0 && <p className="text-xs text-zinc-600 px-2">No playlists.</p>}
                {playlists.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => handleAddToPlaylist(p.id)} 
                    className="block w-full text-left px-2 py-2 text-sm hover:bg-white/10 rounded-lg text-white transition truncate"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}