import { create } from "zustand";

const DUMMY_TRACKS = [
  {
    id: 1,
    title: "Sample Track 1",
    artist: "Demo Artist",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: 2,
    title: "Sample Track 2",
    artist: "Demo Artist",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
];

export const usePlayerStore = create((set, get) => ({
  // playback
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  audioRef: null,
  isExpanded: false,

  // queue
  queue: DUMMY_TRACKS,
  currentIndex: 0,
  isShuffle: false,

  setAudioRef: (ref) => set({ audioRef: ref }),

  setTrackByIndex: (index) => {
    const { queue, audioRef } = get();
    if (!audioRef || !queue[index]) return;
    const track = queue[index];
    audioRef.src = track.url;
    set({
      currentTrack: track,
      currentIndex: index,
      isPlaying: true,
      progress: 0,
    });
    audioRef.play();
  },

  playFirst: () => {
    const { queue, audioRef } = get();
    if (!audioRef || queue.length === 0) return;
    const track = queue[0];
    audioRef.src = track.url;
    set({
      currentTrack: track,
      currentIndex: 0,
      isPlaying: true,
      progress: 0,
    });
    audioRef.play();
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),

  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),

  toggleShuffle: () =>
    set((state) => ({ isShuffle: !state.isShuffle })),

  playNext: () => {
    const { queue, currentIndex, isShuffle, audioRef } = get();
    if (!audioRef || queue.length === 0) return;
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = (currentIndex + 1) % queue.length;
    }
    const track = queue[nextIndex];
    audioRef.src = track.url;
    set({
      currentTrack: track,
      currentIndex: nextIndex,
      isPlaying: true,
      progress: 0,
    });
    audioRef.play();
  },

  playPrev: () => {
    const { queue, currentIndex, audioRef } = get();
    if (!audioRef || queue.length === 0) return;
    const prevIndex =
      (currentIndex - 1 + queue.length) % queue.length;
    const track = queue[prevIndex];
    audioRef.src = track.url;
    set({
      currentTrack: track,
      currentIndex: prevIndex,
      isPlaying: true,
      progress: 0,
    });
    audioRef.play();
  },
}));
