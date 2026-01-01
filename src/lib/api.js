import { supabase } from './supabase'

// --- CMS & PUBLIC DATA ---

export const getGenres = async () => {
  const { data } = await supabase.from('genres').select('*').eq('is_active', true).order('name')
  return data || []
}

export const getCMSTracks = async () => {
  const { data } = await supabase.from('cms_tracks').select('*, genres(name)').eq('is_active', true).order('created_at', { ascending: false })
  return transformTracks(data, 'cms')
}

// --- USER PRIVATE DATA ---

export const getUserTracks = async (userId) => {
  const { data } = await supabase.from('tracks').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  return transformTracks(data, 'user')
}

export const uploadUserTrack = async (file, userId) => {
  // 1. Upload File
  const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
  const filePath = `${userId}/${Date.now()}_${cleanName}`
  
  const { error: uploadError } = await supabase.storage.from('user_uploads').upload(filePath, file)
  if (uploadError) throw uploadError

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase.storage.from('user_uploads').getPublicUrl(filePath)

  // 3. Auto-generate Title
  const autoTitle = file.name.replace(/\.[^/.]+$/, "")

  // 4. Insert to DB
  const { data, error } = await supabase.from('tracks').insert({
    user_id: userId,
    title: autoTitle,
    artist: 'Unknown Artist',
    audio_path: publicUrl, 
    thumbnail: null,
    is_public: false
  }).select().single()

  if (error) throw error
  return data
}

// --- PLAYLISTS ---

export const getUserPlaylists = async (userId) => {
  const { data } = await supabase.from('playlists').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  return data || []
}

export const createPlaylist = async (userId, name) => {
  const { error } = await supabase.from('playlists').insert({ user_id: userId, name, is_public: false })
  if (error) throw error
}

export const deletePlaylist = async (id) => {
  const { error } = await supabase.from('playlists').delete().eq('id', id)
  if (error) throw error
}

export const addTrackToPlaylist = async (playlistId, trackId) => {
  const { error } = await supabase.from('playlist_tracks').insert({
    playlist_id: playlistId,
    track_id: trackId,
    position: 0 
  })
  if (error) throw error
}

export const removeTrackFromPlaylist = async (playlistId, trackId) => {
  const { error } = await supabase.from('playlist_tracks').delete().match({ playlist_id: playlistId, track_id: trackId })
  if (error) throw error
}

// ✅ FIXED: Fetches from BOTH 'cms_tracks' and 'tracks'
export const getPlaylistTracks = async (playlistId) => {
  // 1. Get the list of Track IDs in this playlist
  const { data: links, error } = await supabase
    .from('playlist_tracks')
    .select('track_id')
    .eq('playlist_id', playlistId)

  if (error || !links || links.length === 0) return []

  const trackIds = links.map(item => item.track_id)

  // 2. Parallel Fetch: Look for these IDs in BOTH tables
  const [cmsResponse, userResponse] = await Promise.all([
    supabase.from('cms_tracks').select('*, genres(name)').in('id', trackIds),
    supabase.from('tracks').select('*').in('id', trackIds)
  ])

  // 3. Transform and Combine
  const cmsTracks = transformTracks(cmsResponse.data || [], 'cms')
  const userTracks = transformTracks(userResponse.data || [], 'user')

  return [...cmsTracks, ...userTracks]
}

// --- HELPER: Normalize URLs ---
const transformTracks = (data, source) => {
  if (!data) return []

  return data.map(t => {
    let url = t.audio_path
    let artwork = t.thumbnail

    // 1. Determine Bucket Name
    const bucketName = source === 'cms' ? 'music-cms' : 'user_uploads'

    // 2. Fix Audio URL
    if (url) {
      if (!url.startsWith('http')) {
        const { data } = supabase.storage.from(bucketName).getPublicUrl(url)
        url = data.publicUrl
      }
    }

    // 3. Fix Artwork URL
    if (artwork) {
      if (!artwork.startsWith('http')) {
        const { data } = supabase.storage.from(bucketName).getPublicUrl(artwork)
        artwork = data.publicUrl
      }
    }

    return {
      ...t,
      source,
      // Standardized properties for the Frontend
      url: url, 
      artwork: artwork || '/default_cover.jpg'
    }
  })
}