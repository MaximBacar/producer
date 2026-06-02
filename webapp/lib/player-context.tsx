'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AudioPlayerProvider, useAudioPlayer } from '@/components/ui/audio-player'

export interface Song {
  id: string
  title: string
  artist?: string
  src: string
  coverUrl?: string
  bpm?: number | null
  key?: string | null
  scale?: string | null
  waveform?: number[]
}

interface PlayerContextValue {
  currentSong: Song | null
  queue: Song[]
  queueIndex: number
  playSong: (song: Song) => void
  playQueue: (songs: Song[], index?: number) => void
  next: () => void
  prev: () => void
  clearQueue: () => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider')
  return ctx
}

function PlayerAudioSync({ currentSong }: { currentSong: Song | null }) {
  const player = useAudioPlayer()

  useEffect(() => {
    if (!currentSong) {
      player.pause()
      player.setActiveItem(null)
      return
    }
    player.play({ id: currentSong.id, src: currentSong.src })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id])

  return null
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Song[]>([])
  const [queueIndex, setQueueIndex] = useState(0)

  const currentSong = queue[queueIndex] ?? null

  const playSong = useCallback((song: Song) => {
    setQueue([song])
    setQueueIndex(0)
  }, [])

  const playQueue = useCallback((songs: Song[], index = 0) => {
    setQueue(songs)
    setQueueIndex(index)
  }, [])

  const next = useCallback(() => {
    setQueueIndex((i) => Math.min(i + 1, queue.length - 1))
  }, [queue.length])

  const prev = useCallback(() => {
    setQueueIndex((i) => Math.max(i - 1, 0))
  }, [])

  const clearQueue = useCallback(() => {
    setQueue([])
    setQueueIndex(0)
  }, [])

  const value = useMemo<PlayerContextValue>(
    () => ({ currentSong, queue, queueIndex, playSong, playQueue, next, prev, clearQueue }),
    [currentSong, queue, queueIndex, playSong, playQueue, next, prev, clearQueue],
  )

  return (
    <PlayerContext.Provider value={value}>
      <AudioPlayerProvider>
        <PlayerAudioSync currentSong={currentSong} />
        {children}
      </AudioPlayerProvider>
    </PlayerContext.Provider>
  )
}