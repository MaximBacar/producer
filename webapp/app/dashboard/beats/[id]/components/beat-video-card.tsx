'use client'

import { AlertCircle, Download, Loader2, VideoIcon } from 'lucide-react'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { VideoPhase } from '../types'

interface BeatVideoCardProps {
    videoPhase: VideoPhase
    videoSrc: string | null
    hasAudio: boolean
    onOpenSheet: () => void
}

export function BeatVideoCard({ videoPhase, videoSrc, hasAudio, onOpenSheet }: BeatVideoCardProps) {
    const [isDownloading, setIsDownloading] = useState(false)

    async function handleDownload() {
        if (!videoSrc || isDownloading) return
        setIsDownloading(true)
        try {
            const res = await fetch(videoSrc)
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'beat-video.mp4'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                        <VideoIcon className="size-4" />
                        Beat Video
                    </span>
                    {(videoPhase.phase === 'idle' || videoPhase.phase === 'failed') && (
                        <Button size="sm" onClick={onOpenSheet} disabled={!hasAudio}>
                            {videoPhase.phase === 'failed' ? 'Retry' : 'Generate Video'}
                        </Button>
                    )}
                    {videoPhase.phase === 'done' && (
                        <Button size="sm" variant="outline" onClick={onOpenSheet}>
                            Regenerate
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 flex-1">
                <AnimatePresence mode="wait">
                {videoPhase.phase === 'idle' && (
                    <motion.div
                        key="idle"
                        className="flex flex-col items-center justify-center py-16 gap-3 text-center"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.22 }}
                    >
                        <div className="rounded-full bg-muted p-4">
                            <VideoIcon className="size-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium">No video yet</p>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            {hasAudio
                                ? 'Click "Generate Video" to create a professional YouTube video from your beat'
                                : 'Upload an audio file first, then generate your beat video'
                            }
                        </p>
                    </motion.div>
                )}

                {videoPhase.phase === 'generating' && (
                    <motion.div
                        key="generating"
                        className="space-y-4"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22 }}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{videoPhase.statusText}</span>
                            <span className="text-sm font-medium tabular-nums">{videoPhase.progress}%</span>
                        </div>
                        <Progress value={videoPhase.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-center">
                            Generating your video, this may take a few minutes…
                        </p>
                    </motion.div>
                )}

                {videoPhase.phase === 'failed' && (
                    <motion.div
                        key="failed"
                        className="flex flex-col items-center justify-center py-12 gap-3 text-center"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                    >
                        <AlertCircle className="size-8 text-destructive" />
                        <p className="font-medium">Generation failed</p>
                        <p className="text-sm text-muted-foreground">{videoPhase.error}</p>
                    </motion.div>
                )}

                {videoPhase.phase === 'done' && videoSrc && (
                    <motion.div
                        key="done"
                        className="space-y-4"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                    >
                        <video src={videoSrc} controls className="w-full rounded-md" />
                        <Button size="lg" className="w-full" onClick={handleDownload} disabled={isDownloading}>
                            {isDownloading
                                ? <><Loader2 className="mr-2 size-4 animate-spin" /> Downloading…</>
                                : <><Download className="mr-2 size-4" /> Download Video</>
                            }
                        </Button>
                    </motion.div>
                )}
                </AnimatePresence>
            </CardContent>
        </Card>
    )
}