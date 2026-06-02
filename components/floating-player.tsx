'use client'

import { useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SkipBack, SkipForward, X, Music } from 'lucide-react'
import { usePlayer } from '@/lib/player-context'
import {
  AudioPlayerButton,
  useAudioPlayer,
  useAudioPlayerTime,
} from '@/components/ui/audio-player'
import { AudioScrubber } from '@/components/ui/waveform'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function seededRandom(seed: number, i: number) {
  const x = Math.sin(seed * 1000 + i * 137.5) * 10000
  return x - Math.floor(x)
}

function placeholderWaveform(seed: number, bars = 120): number[] {
  return Array.from({ length: bars }, (_, i) => 0.15 + seededRandom(seed, i) * 0.65)
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function FloatingPlayer() {
  const { currentSong, queue, queueIndex, next, prev, clearQueue } = usePlayer()
  const player = useAudioPlayer()
  const time = useAudioPlayerTime()

  const waveformData = useMemo(() => {
    if (!currentSong) return []
    if (currentSong.waveform?.length) return currentSong.waveform
    const seed = currentSong.id
      .split('')
      .reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return placeholderWaveform(seed)
  }, [currentSong])

  const handleSeek = useCallback(
    (t: number) => player.seek(t),
    [player],
  )

  const canPrev = queueIndex > 0
  const canNext = queueIndex < queue.length - 1
  const duration = player.duration && isFinite(player.duration) ? player.duration : 0

  return (
    <AnimatePresence>
      {currentSong && (
    <motion.div
      key="floating-player"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className={cn(
        'fixed bottom-5 left-1/2 -translate-x-1/2 z-50',
        'w-[min(780px,calc(100vw-2rem))]',
        'bg-black/85 backdrop-blur-2xl',
        'border border-border/50 rounded-full',
        'shadow-2xl shadow-black/15',
        'p-2 flex justify-between items-center gap-4',
        'text-white'
      )}
    >
      {/* Song info */}
      <div className="flex items-center gap-3 shrink-0 min-w-0">
        <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {currentSong.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentSong.coverUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <Music className="size-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate leading-tight">
            {currentSong.title}
          </p>
          <p className="text-xs text-muted-foreground truncate leading-tight">
            {currentSong?.artist || 'Type beat'}
          </p>
        </div>
      </div>

      {/* Waveform scrubber + time */}
      <div className="flex w-full h-full min-w-0 flex flex-col gap-1">
        <AudioScrubber
          data={waveformData}
          currentTime={time}
          duration={duration}
          onSeek={handleSeek}
          height={20}
          showHandle={false}
          barWidth={2}
          barGap={1}
          barRadius={1}
          barColor="#fff"
        />
        <div className="flex justify-between px-0.5">
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {formatTime(time)}
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {duration > 0 ? formatTime(duration) : '--:--'}
          </span>
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          onClick={prev}
          disabled={!canPrev}
          aria-label="Previous"
        >
          <SkipBack className="size-4" />
        </Button> */}
        <AudioPlayerButton size="icon" className="size-9 rounded-full" />
        {/* <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          onClick={next}
          disabled={!canNext}
          aria-label="Next"
        >
          <SkipForward className="size-4" />
        </Button> */}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground shrink-0"
          onClick={clearQueue}
          aria-label="Close player"
        >
          <X className="size-3.5" />
        </Button>
      </div>

    
      
    </motion.div>
      )}
    </AnimatePresence>
  )
}
