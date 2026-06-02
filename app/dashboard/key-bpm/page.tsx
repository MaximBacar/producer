'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { analyzeBpmAndKey } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Upload, Music, Loader2 } from 'lucide-react'

type State =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'done'; bpm: number; key: string; scale: string }
    | { status: 'error'; message: string }

export default function KeyBpmPage() {
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [dragging, setDragging] = useState(false)
    const [state, setState] = useState<State>({ status: 'idle' })

    async function handleAnalyze() {
        if (!audioFile) return
        setState({ status: 'loading' })
        try {
            const result = await analyzeBpmAndKey(audioFile)
            setState({ status: 'done', ...result })
        } catch (e) {
            setState({ status: 'error', message: e instanceof Error ? e.message : 'Analysis failed.' })
        }
    }

    return (
        <div className="flex h-100 w-full min-h-0 items-start justify-center p-8">
            <motion.div
                className="w-full h-full min-h-0 space-y-6"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
                <motion.div
                    className="text-center min-h-0"
                    variants={{ hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.28 } } }}
                >
                    <h2 className="text-2xl font-semibold">Key & BPM Finder</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Upload an audio file to detect its key and tempo</p>
                </motion.div>

                <motion.div
                    variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                >
                <Card className='w-full h-full min-h-0'>
                    <CardHeader className="pb-3 min-h-0">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Music className="size-4" /> Audio File
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 w-full h-full min-h-0">
                        <label
                            htmlFor="audio-upload"
                            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault()
                                setDragging(false)
                                const f = e.dataTransfer.files[0]
                                if (f) { setAudioFile(f); setState({ status: 'idle' }) }
                            }}
                            className={cn(
                                'flex flex-col items-center justify-center gap-3 cursor-pointer rounded-md border-2 border-dashed p-8 transition-colors',
                                dragging ? 'border-primary bg-primary/5'
                                    : audioFile ? 'border-primary/40 bg-primary/5'
                                        : 'border-border hover:border-primary/50 hover:bg-muted/50',
                            )}
                        >
                            <Input
                                id="audio-upload"
                                type="file"
                                accept=".mp3,.wav"
                                className="sr-only"
                                onChange={(e) => {
                                    const f = e.target.files?.[0] ?? null
                                    setAudioFile(f)
                                    setState({ status: 'idle' })
                                }}
                            />
                            {audioFile ? (
                                <>
                                    <Music className="size-8 text-primary" />
                                    <span className="text-sm font-medium text-center">{audioFile.name}</span>
                                    <span className="text-xs text-muted-foreground">{(audioFile.size / 1024).toFixed(0)} KB</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="size-8 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground text-center">Drop .mp3 or .wav, or click to browse</span>
                                </>
                            )}
                        </label>

                        <Button
                            className="w-full"
                            onClick={handleAnalyze}
                            disabled={!audioFile || state.status === 'loading'}
                        >
                            {state.status === 'loading' && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Analyze
                        </Button>

                        <AnimatePresence mode="wait">
                        {state.status === 'error' && (
                            <motion.p
                                key="error"
                                className="text-sm text-destructive text-center"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.2 }}
                            >
                                {state.message}
                            </motion.p>
                        )}

                        {state.status === 'done' && (
                            <motion.div
                                key="results"
                                className="flex justify-center gap-3 pt-2"
                                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                            >
                                <Badge variant="secondary" className="text-base px-4 py-1.5">{state.bpm} BPM</Badge>
                                <Badge variant="secondary" className="text-base px-4 py-1.5">{state.key} {state.scale}</Badge>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
                </motion.div>
            </motion.div>
        </div>
    )
}