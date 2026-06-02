'use client'

import { useCallback } from 'react'
import { Play } from 'lucide-react'
import { usePlayer } from '@/lib/player-context'
import {
  AudioPlayerButton,
  useAudioPlayer,
  useAudioPlayerTime,
} from '@/components/ui/audio-player'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BeatPlayerProps {
  beatId: string
  src?: string
  title?: string
  artist?: string
  bpm?: number | null
  keyName?: string | null
  scale?: string | null
  className?: string
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function BeatPlayer({
  beatId,
  src,
  title,
  artist,
  bpm,
  keyName,
  scale,
  className,
}: BeatPlayerProps) {
  const { playSong, currentSong } = usePlayer()
  const player = useAudioPlayer()
  const time = useAudioPlayerTime()
  const isThisSong = currentSong?.id === beatId
  const duration =
    isThisSong && player.duration && isFinite(player.duration) ? player.duration : 0

  const handlePlay = useCallback(() => {
    if (!src) return
    playSong({
      id: beatId,
      title: title || 'Untitled',
      artist,
      src,
      bpm,
      key: keyName,
      scale,
    })
  }, [src, beatId, title, artist, bpm, keyName, scale, playSong])

  const handleSeek = useCallback(
    (t: number) => {
      if (isThisSong) player.seek(t)
    },
    [isThisSong, player],
  )

  const currentTime = isThisSong ? time : 0

  return (
    <Card className={cn('relative h-full', className)}>
      <div className="bg-muted-foreground/30 absolute top-0 left-1/2 h-3 w-48 -translate-x-1/2 rounded-b-full" />
      <div className="bg-muted-foreground/20 absolute top-0 left-1/2 h-2 w-44 -translate-x-1/2 rounded-b-full" />

      <div className="relative space-y-6 p-4">
        <div className="border-border rounded-lg border bg-black/5 p-4 backdrop-blur-sm dark:bg-black/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-foreground truncate text-sm font-medium">
                {title || 'Untitled'}
              </h3>
              {artist && (
                <p className="text-muted-foreground text-xs truncate">{artist}</p>
              )}
            </div>
            <div className="flex items-center gap-3 ml-2 shrink-0 text-xs text-muted-foreground">
              {bpm && <span className="tabular-nums">{bpm} BPM</span>}
              {keyName && scale && <span>{keyName} {scale}</span>}
            </div>
          </div>

          <div
            className="cursor-pointer py-2"
            onClick={(e) => {
              if (!isThisSong || !duration) return
              const rect = e.currentTarget.getBoundingClientRect()
              handleSeek(((e.clientX - rect.left) / rect.width) * duration)
            }}
          >
            <Progress
              value={duration > 0 ? (currentTime / duration) * 100 : 0}
              className="h-1.5 bg-gray-200 dark:bg-card"
            />
          </div>

          {isThisSong ? (
            <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>{formatTime(time)}</span>
              <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
            </div>
          ) : (
            <div className="h-4" />
          )}
        </div>

        <div className="flex justify-end mt-auto">
          {isThisSong ? (
            <AudioPlayerButton
              variant="outline"
              size="icon"
              className={cn(
                'border-border h-14 w-14 rounded-full transition-all duration-300 cursor-pointer',
                player.isPlaying
                  ? 'bg-foreground/10 hover:bg-foreground/15 border-foreground/30 dark:bg-primary/20 dark:hover:bg-primary/30 dark:border-primary/50'
                  : 'bg-background hover:bg-muted',
              )}
            />
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="border-border h-14 w-14 rounded-full bg-background hover:bg-muted"
              onClick={handlePlay}
              disabled={!src}
            >
              <Play className="size-5 fill-current" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}