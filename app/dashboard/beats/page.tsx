'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import type { BeatDoc } from '@/lib/beats'
import { formatArtists } from '@/lib/beats'
import { usePlayer } from '@/lib/player-context'
import { useAudioPlayer } from '@/components/ui/audio-player'
import { analyzeBpmAndKey, createBeat } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Plus, Music, Play, Pause, Upload, Loader2 } from 'lucide-react'

interface BeatRow extends BeatDoc {
    id: string
}

function formatDate(ts: BeatDoc['createdAt']): string {
    if (!ts) return '—'
    return ts.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

type AnalysisState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'done'; bpm: number; key: string; scale: string }
    | { status: 'error'; message: string }

export default function BeatsPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [beats, setBeats] = useState<BeatRow[]>([])
    const [loading, setLoading] = useState(true)
    const { playSong } = usePlayer()
    const player = useAudioPlayer()

    // dialog state
    const [open, setOpen] = useState(false)
    const [beatName, setBeatName] = useState('')
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [audioDragging, setAudioDragging] = useState(false)
    const [analysis, setAnalysis] = useState<AnalysisState>({ status: 'idle' })
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    useEffect(() => {
        if (!user) return
        const q = query(collection(db, 'users', user.uid, 'beats'), orderBy('createdAt', 'desc'))
        getDocs(q).then((snap) => {
            setBeats(snap.docs.map(d => ({ id: d.id, ...(d.data() as BeatDoc) })))
        }).finally(() => setLoading(false))
    }, [user])

    function openDialog() {
        setBeatName('')
        setAudioFile(null)
        setAnalysis({ status: 'idle' })
        setCreateError(null)
        setOpen(true)
    }

    async function handleAudioPick(file: File) {
        setAudioFile(file)
        setAnalysis({ status: 'loading' })
        try {
            const result = await analyzeBpmAndKey(file)
            setAnalysis({ status: 'done', ...result })
        } catch (e) {
            setAnalysis({ status: 'error', message: e instanceof Error ? e.message : 'Analysis failed.' })
        }
    }

    async function handleCreate() {
        if (!user || !audioFile || !beatName.trim()) return
        setCreateError(null)
        setCreating(true)
        try {
            const { beat_id } = await createBeat(beatName.trim(), audioFile)
            setOpen(false)
            router.push(`/dashboard/beats/${beat_id}`)
        } catch (e) {
            setCreateError(e instanceof Error ? e.message : 'Failed to create beat.')
            setCreating(false)
        }
    }

    function handlePlayBeat(e: React.MouseEvent, beat: BeatRow) {
        e.stopPropagation()
        if (!beat.audioStorageUrl) return
        if (player.isItemActive(beat.id)) {
            player.isPlaying ? player.pause() : player.play()
        } else {
            playSong({
                id: beat.id,
                title: beat.name || 'Untitled',
                artist: beat.artists?.length ? formatArtists(beat.artists) : undefined,
                src: beat.audioStorageUrl,
                bpm: beat.bpm,
                key: beat.key,
                scale: beat.scale,
            })
        }
    }

    const canCreate = !!beatName.trim() && !!audioFile && !creating

    const rowVariants = {
        hidden: { opacity: 0, x: -8 },
        visible: (i: number) => ({
            opacity: 1, x: 0,
            transition: { duration: 0.22, delay: i * 0.04, ease: 'easeOut' as const },
        }),
    }

    return (
        <div className="flex flex-col w-full h-full min-h-0 min-h-0 p-6 gap-4">
            <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
            >
                <div>
                    <h1 className="text-xl font-semibold">Your Beats</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage your beats and generate videos</p>
                </div>
                <Button onClick={openDialog}>
                    <Plus className="mr-2 size-4" />
                    New Beat
                </Button>
            </motion.div>

            <AnimatePresence mode="wait">
            {loading ? (
                <motion.div
                    key="skeletons"
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-md" />
                    ))}
                </motion.div>
            ) : beats.length === 0 ? (
                <motion.div
                    key="empty"
                    className="flex flex-col items-center justify-center flex-1 gap-3 text-center"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="rounded-full bg-muted p-4">
                        <Music className="size-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">No beats yet</p>
                    <p className="text-sm text-muted-foreground">Create your first beat to get started</p>
                    <Button onClick={openDialog}>
                        <Plus className="mr-2 size-4" />
                        New Beat
                    </Button>
                </motion.div>
            ) : (
                <motion.div
                    key="table"
                    className="flex-1 min-h-0 rounded-md border overflow-hidden"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    <div className="h-full overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-background">
                            <TableRow>
                                <TableHead className="w-10" />
                                <TableHead>Name</TableHead>
                                <TableHead>Artists</TableHead>
                                <TableHead>BPM</TableHead>
                                <TableHead>Key</TableHead>
                                <TableHead>Video</TableHead>
                                <TableHead>Created</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {/* <ScrollArea className='w-full min-h-0 h-full'> */}
                            {beats.map((beat, i) => {
                                const isActive = player.isItemActive(beat.id)
                                const isThisPlaying = isActive && player.isPlaying
                                return (
                                    <motion.tr
                                        key={beat.id}
                                        custom={i}
                                        variants={rowVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="w-full border-b transition-colors hover:bg-muted/50 cursor-pointer"
                                        onClick={() => router.push(`/dashboard/beats/${beat.id}`)}
                                    >
                                        <TableCell onClick={(e) => handlePlayBeat(e, beat)}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                                disabled={!beat.audioStorageUrl}
                                                tabIndex={-1}
                                            >
                                                {isThisPlaying
                                                    ? <Pause className="size-3.5 fill-current" />
                                                    : <Play className="size-3.5 fill-current" />
                                                }
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {beat.name || <span className="text-muted-foreground italic">Untitled</span>}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {beat.artists?.length ? beat.artists.join(', ') : '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground tabular-nums">
                                            {beat.bpm ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {beat.key ? `${beat.key} ${beat.scale}` : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {beat.videoStorageUrl
                                                ? <Badge variant="secondary" className="text-xs">Ready</Badge>
                                                : <span className="text-muted-foreground">—</span>
                                            }
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {formatDate(beat.createdAt)}
                                        </TableCell>
                                    </motion.tr>
                                )
                            })}
                        </TableBody>
                    </Table>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>New Beat</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Beat Name</label>
                            <Input
                                placeholder="e.g. Midnight"
                                value={beatName}
                                onChange={(e) => setBeatName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && canCreate) handleCreate() }}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Audio File</label>
                            <label
                                htmlFor="dialog-audio-upload"
                                onDragOver={(e) => { e.preventDefault(); setAudioDragging(true) }}
                                onDragLeave={() => setAudioDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault()
                                    setAudioDragging(false)
                                    const f = e.dataTransfer.files[0]
                                    if (f) handleAudioPick(f)
                                }}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-2 cursor-pointer rounded-md border-2 border-dashed p-6 transition-colors',
                                    audioDragging ? 'border-primary bg-primary/5'
                                        : audioFile ? 'border-primary/40 bg-primary/5'
                                            : 'border-border hover:border-primary/50 hover:bg-muted/50',
                                )}
                            >
                                <input
                                    id="dialog-audio-upload"
                                    type="file"
                                    accept=".mp3,.wav"
                                    className="sr-only"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAudioPick(f) }}
                                />
                                {audioFile ? (
                                    <>
                                        <Music className="size-6 text-primary" />
                                        <span className="text-sm font-medium text-center truncate max-w-full px-2">{audioFile.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="size-6 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground text-center">Drop .mp3 or .wav, or click to browse</span>
                                    </>
                                )}
                            </label>
                        </div>

                        {analysis.status === 'loading' && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="size-3.5 animate-spin" />
                                Detecting BPM & Key…
                            </div>
                        )}
                        {analysis.status === 'done' && (
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">{analysis.bpm} BPM</Badge>
                                <Badge variant="secondary">{analysis.key} {analysis.scale}</Badge>
                            </div>
                        )}
                        {analysis.status === 'error' && (
                            <p className="text-xs text-destructive">{analysis.message}</p>
                        )}
                        {createError && (
                            <p className="text-sm text-destructive">{createError}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!canCreate}>
                            {creating
                                ? <><Loader2 className="mr-2 size-4 animate-spin" /> Creating…</>
                                : 'Create Beat'
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
