import { createContext, useContext, useReducer } from 'react'

const PlayerContext = createContext()

const initialState = {
  currentTrack: null,
  queue: [],
  isPlaying: false,
  volume: 1,
  muted: false,
  analyser: null // For visualizer
}

const playerReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TRACK':
      return { ...state, currentTrack: action.payload, isPlaying: true }
    case 'PLAY':
      return { ...state, isPlaying: true }
    case 'PAUSE':
      return { ...state, isPlaying: false }
    case 'SET_VOLUME':
      return { ...state, volume: action.payload, muted: false }
    case 'TOGGLE_MUTE':
      return { ...state, muted: !state.muted }
    case 'SET_ANALYSER':
      return { ...state, analyser: action.payload }
    case 'NEXT':
      return state // Logic handled in controls
    case 'PREV':
      return state // Logic handled in controls
    case 'CLEAR_QUEUE':
        return { ...initialState }
    default:
      return state
  }
}

export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(playerReducer, initialState)

  const actions = {
    // ✅ THIS IS THE FUNCTION THAT WAS MISSING OR NAMED WRONG
    setTrack: (track) => dispatch({ type: 'SET_TRACK', payload: track }),
    togglePlay: () => dispatch(state.isPlaying ? { type: 'PAUSE' } : { type: 'PLAY' }),
    nextTrack: () => dispatch({ type: 'NEXT' }),
    previousTrack: () => dispatch({ type: 'PREV' }),
    setVolume: (volume) => dispatch({ type: 'SET_VOLUME', payload: volume }),
    toggleMute: () => dispatch({ type: 'TOGGLE_MUTE' }),
    setAnalyser: (node) => dispatch({ type: 'SET_ANALYSER', payload: node }),
    clearQueue: () => dispatch({ type: 'CLEAR_QUEUE' })
  }

  return (
    <PlayerContext.Provider value={{ state, actions }}>
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => {
  const context = useContext(PlayerContext)
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider')
  return context
}