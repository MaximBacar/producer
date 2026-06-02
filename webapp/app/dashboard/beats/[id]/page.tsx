'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import type { BeatDoc } from '@/lib/beats'
import { buildDescription, buildTitle, formatArtists } from '@/lib/beats'
import { deleteBeat, generateBeatVideo, getVideoStatus } from '@/lib/api'
import { BeatPlayer } from '@/components/beat-player'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { VideoPhase } from './types'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { BeatInfoCard } from './components/beat-info-card'
import { BeatVideoCard } from './components/beat-video-card'
import { GenerateVideoSheet } from './components/generate-video-sheet'
import { YoutubeContentCard } from './components/youtube-content-card'

export default function BeatDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user, loading } = useAuth()

    // ── Beat data ─────────────────────────────────────────────────────────────
    const [beat, setBeat] = useState<BeatDoc | null>(null)
    const [beatLoading, setBeatLoading] = useState(true)

    // ── Beat form ─────────────────────────────────────────────────────────────
    const [beatName, setBeatName] = useState('')
    const [artists, setArtists] = useState<string[]>([])
    const [artistInput, setArtistInput] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // ── BPM / key ─────────────────────────────────────────────────────────────
    const [showManual, setShowManual] = useState(false)
    const [manualBpm, setManualBpm] = useState('')
    const [manualKeyLetter, setManualKeyLetter] = useState('')
    const [manualAccidental, setManualAccidental] = useState('none')
    const [manualScale, setManualScale] = useState('major')
    const [editedBpm, setEditedBpm] = useState<number | null>(null)
    const [editedKey, setEditedKey] = useState<string | null>(null)
    const [editedScale, setEditedScale] = useState<string | null>(null)

    // ── Audio ─────────────────────────────────────────────────────────────────
    const [localAudioFile, setLocalAudioFile] = useState<File | null>(null)
    const [audioDragging, setAudioDragging] = useState(false)
    const [audioUploading, setAudioUploading] = useState(false)
    const [audioUploadProgress, setAudioUploadProgress] = useState<number | null>(null)

    // ── Profile ───────────────────────────────────────────────────────────────
    const [producerName, setProducerName] = useState('')
    const [emailContact, setEmailContact] = useState('')
    const [instagramUsername, setInstagramUsername] = useState('')
    const [xUsername, setXUsername] = useState('')
    const [discordUsername, setDiscordUsername] = useState('')
    const [soundcloudUrl, setSoundcloudUrl] = useState('')
    const [beatstarsUrl, setBeatstarsUrl] = useState('')

    // ── Video ─────────────────────────────────────────────────────────────────
    const [videoPhase, setVideoPhase] = useState<VideoPhase>({ phase: 'idle' })
    const [videoSrc, setVideoSrc] = useState<string | null>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // ── YouTube content ───────────────────────────────────────────────────────
    const [ytTitle, setYtTitle] = useState<string | null>(null)
    const [ytDesc, setYtDesc] = useState<string | null>(null)
    const [ytTitleCopied, setYtTitleCopied] = useState(false)
    const [ytDescCopied, setYtDescCopied] = useState(false)

    // ── Delete ────────────────────────────────────────────────────────────────
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // ── Sheet ─────────────────────────────────────────────────────────────────
    const [sheetOpen, setSheetOpen] = useState(false)
    const [sheetImageMode, setSheetImageMode] = useState<'file' | 'url'>('file')
    const [sheetImageFile, setSheetImageFile] = useState<File | null>(null)
    const [sheetImageUrl, setSheetImageUrl] = useState('')
    const [sheetImagePreview, setSheetImagePreview] = useState<string | null>(null)
    const [sheetImageDragging, setSheetImageDragging] = useState(false)
    const [sheetSubmitting, setSheetSubmitting] = useState(false)
    const [sheetError, setSheetError] = useState<string | null>(null)

    // ── Load beat + profile ───────────────────────────────────────────────────
    useEffect(() => {
        if (loading || !user || !id) return
        Promise.all([
            getDoc(doc(db, 'users', user.uid, 'beats', id)),
            getDoc(doc(db, 'users', user.uid, 'profile', 'data')),
        ]).then(([beatSnap, profileSnap]) => {
            if (!beatSnap.exists()) { router.push('/dashboard/beats'); return }
            const d = beatSnap.data() as BeatDoc
            setBeat(d)
            setBeatName(d.name ?? '')
            setArtists(d.artists ?? [])
            setEditedBpm(d.bpm ?? null)
            setEditedKey(d.key ?? null)
            setEditedScale(d.scale ?? null)

            if (d.videoStorageUrl) {
                setVideoPhase({ phase: 'done' })
                setVideoSrc(d.videoStorageUrl)
                setYtTitle(prev => prev ?? (d.videoTitle ?? null))
                setYtDesc(prev => prev ?? (d.videoDescription ?? null))
            } else if (d.is_generating && d.video_job_id) {
                setVideoPhase({ phase: 'generating', jobId: d.video_job_id, progress: 5, statusText: 'Resuming…' })
            }

            if (profileSnap.exists()) {
                const p = profileSnap.data()
                setProducerName(p.producerName ?? '')
                setEmailContact(p.businessEmail ?? '')
                setInstagramUsername(p.instagramUsername ?? '')
                setXUsername(p.xUsername ?? '')
                setDiscordUsername(p.discordUsername ?? '')
                setSoundcloudUrl(p.soundcloudUrl ?? '')
                setBeatstarsUrl(p.beatstarsUrl ?? '')
            }
        }).finally(() => setBeatLoading(false))
    }, [user, id, router])

    // ── Sheet image preview ───────────────────────────────────────────────────
    useEffect(() => {
        if (!sheetImageFile) { setSheetImagePreview(null); return }
        const url = URL.createObjectURL(sheetImageFile)
        setSheetImagePreview(url)
        return () => URL.revokeObjectURL(url)
    }, [sheetImageFile])

    // ── Poll video status ─────────────────────────────────────────────────────
    useEffect(() => {
        if (videoPhase.phase !== 'generating') {
            if (pollRef.current) clearInterval(pollRef.current)
            return
        }
        const { jobId } = videoPhase
        pollRef.current = setInterval(async () => {
            try {
                const result = await getVideoStatus(jobId)
                if (result.status === 'pending' || result.status === 'processing') {
                    setVideoPhase(s => s.phase === 'generating'
                        ? { ...s, progress: Math.max(s.progress, result.progress), statusText: result.status === 'pending' ? 'Queued…' : 'Processing…' }
                        : s)
                } else if (result.status === 'done') {
                    clearInterval(pollRef.current!)
                    setVideoPhase(s => s.phase === 'generating' ? { ...s, progress: 100, statusText: 'Complete!' } : s)
                    setTimeout(() => handleVideoGenerated(), 600)
                } else if (result.status === 'failed') {
                    clearInterval(pollRef.current!)
                    setVideoPhase({ phase: 'failed', error: result.error ?? 'Generation failed.' })
                }
            } catch {
                clearInterval(pollRef.current!)
                setVideoPhase({ phase: 'failed', error: 'Job no longer available. Please try again.' })
            }
        }, 2000)
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [videoPhase.phase])

    // ── Handlers ──────────────────────────────────────────────────────────────

    async function handleVideoGenerated() {
        if (!user) return
        try {
            const snap = await getDoc(doc(db, 'users', user.uid, 'beats', id))
            if (snap.exists()) {
                const d = snap.data() as BeatDoc
                setVideoSrc(d.videoStorageUrl ?? null)
                setYtTitle(d.videoTitle ?? null)
                setYtDesc(d.videoDescription ?? null)
                setVideoPhase({ phase: 'done' })
            }
        } catch (e) {
            setVideoPhase({ phase: 'failed', error: e instanceof Error ? e.message : 'Failed to retrieve video.' })
        }
    }

    async function handleSaveBeat() {
        if (!user) return
        setSaving(true)
        await updateDoc(doc(db, 'users', user.uid, 'beats', id), {
            name: beatName, artists, bpm: editedBpm, key: editedKey, scale: editedScale,
            updatedAt: serverTimestamp(),
        })
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    async function handleAudioDrop(file: File) {
        if (!user) return
        setLocalAudioFile(file)
        setAudioUploading(true)
        setAudioUploadProgress(0)
        const ext = file.name.split('.').pop() ?? 'mp3'
        const storageRef = ref(storage, `users/${user.uid}/beats/${id}/audio.${ext}`)
        const task = uploadBytesResumable(storageRef, file)
        task.on(
            'state_changed',
            (snap) => setAudioUploadProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
            () => { setAudioUploading(false); setAudioUploadProgress(null) },
            async () => {
                const url = await getDownloadURL(task.snapshot.ref)
                await updateDoc(doc(db, 'users', user.uid, 'beats', id), {
                    audioStorageUrl: url, updatedAt: serverTimestamp(),
                })
                setBeat(b => b ? { ...b, audioStorageUrl: url } : b)
                setAudioUploading(false)
                setAudioUploadProgress(null)
            }
        )
    }

    function handleAddArtist() {
        const name = artistInput.trim().replace(/,+$/, '')
        if (name && !artists.includes(name)) setArtists(a => [...a, name])
        setArtistInput('')
    }

    function handleApplyManual() {
        const bpm = parseInt(manualBpm)
        if (!bpm || bpm <= 0 || !manualKeyLetter) return
        const accidental = manualAccidental === 'none' ? '' : manualAccidental
        setEditedBpm(bpm)
        setEditedKey(`${manualKeyLetter}${accidental}`)
        setEditedScale(manualScale)
        setShowManual(false)
    }

    async function handleStartGeneration() {
        if (!user) return
        setSheetError(null)
        setSheetSubmitting(true)
        try {
            let imageFile: File | null = null
            if (sheetImageMode === 'url') {
                if (!sheetImageUrl) { setSheetError('Please provide a cover image URL.'); return }
                const res = await fetch(`http://localhost:8000/image/proxy?url=${encodeURIComponent(sheetImageUrl)}`)
                if (!res.ok) throw new Error('Failed to fetch image.')
                const blob = await res.blob()
                const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
                imageFile = new File([blob], `cover.${ext}`, { type: blob.type })
            } else {
                imageFile = sheetImageFile
            }
            if (!imageFile) { setSheetError('Please provide a cover image.'); return }

            const { job_id } = await generateBeatVideo(id, imageFile)

            setSheetOpen(false)
            setSheetImageFile(null)
            setSheetImageUrl('')
            setVideoPhase({ phase: 'generating', jobId: job_id, progress: 5, statusText: 'Queued…' })
        } catch (e) {
            setSheetError(e instanceof Error ? e.message : 'Failed to start generation.')
        } finally {
            setSheetSubmitting(false)
        }
    }

    function handleGenerateYoutube() {
        setYtTitle(buildTitle(artists, producerName, beatName))
        setYtDesc(buildDescription(
            artists, editedBpm ?? 0, editedKey ?? '', editedScale ?? '',
            emailContact, instagramUsername, xUsername, discordUsername,
            beatstarsUrl, soundcloudUrl,
        ))
    }

    async function handleCopyYtTitle() {
        if (!ytTitle) return
        await navigator.clipboard.writeText(ytTitle)
        setYtTitleCopied(true)
        setTimeout(() => setYtTitleCopied(false), 2000)
    }

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteBeat(id)
            router.push('/dashboard/beats')
        } catch {
            setDeleting(false)
        }
    }

    async function handleCopyYtDesc() {
        if (!ytDesc) return
        await navigator.clipboard.writeText(ytDesc)
        setYtDescCopied(true)
        setTimeout(() => setYtDescCopied(false), 2000)
    }

    // ── Derived ───────────────────────────────────────────────────────────────
    const hasAudio = !!(localAudioFile ?? beat?.audioStorageUrl)
    const audioSrc = localAudioFile
        ? URL.createObjectURL(localAudioFile)
        : (beat?.audioStorageUrl ?? undefined)

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (beatLoading) {
        return (
            <div className="flex flex-col flex-1 min-h-0 p-6 gap-6">
                <Skeleton className="h-5 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-96 rounded-lg" />
                    <Skeleton className="h-96 rounded-lg" />
                </div>
                <Skeleton className="h-64 rounded-lg" />
            </div>
        )
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
                {/* Breadcrumb */}
                <div className="flex items-center justify-between px-6 pt-5 pb-2">
                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard/beats"
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronLeft className="size-4" />
                            Your Beats
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-sm font-medium truncate">{beatName || 'Untitled'}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteOpen(true)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>

                <motion.div
                    className="flex flex-col gap-6 p-6"
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                >
                    {/* Row 1: Player + Video */}
                    <motion.div
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
                        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                    >
                        <BeatPlayer
                            beatId={id}
                            src={audioSrc}
                            title={beatName || beat?.name || undefined}
                            artist={artists.length ? formatArtists(artists) : undefined}
                            bpm={editedBpm}
                            keyName={editedKey}
                            scale={editedScale}
                        />
                        <BeatVideoCard
                            videoPhase={videoPhase}
                            videoSrc={videoSrc}
                            hasAudio={hasAudio}
                            onOpenSheet={() => { setSheetError(null); setSheetOpen(true) }}
                        />
                    </motion.div>

                    {/* Row 2: Beat Info */}
                    <motion.div
                        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                    >
                        <BeatInfoCard
                            beatName={beatName}
                            onBeatNameChange={setBeatName}
                            artists={artists}
                            onArtistsChange={setArtists}
                            artistInput={artistInput}
                            onArtistInputChange={setArtistInput}
                            onAddArtist={handleAddArtist}
                            showManual={showManual}
                            onToggleManual={() => setShowManual(m => !m)}
                            editedBpm={editedBpm}
                            editedKey={editedKey}
                            editedScale={editedScale}
                            manualBpm={manualBpm}
                            onManualBpmChange={setManualBpm}
                            manualKeyLetter={manualKeyLetter}
                            onManualKeyLetterChange={setManualKeyLetter}
                            manualAccidental={manualAccidental}
                            onManualAccidentalChange={setManualAccidental}
                            manualScale={manualScale}
                            onManualScaleChange={setManualScale}
                            onApplyManual={handleApplyManual}
                            audioStorageUrl={beat?.audioStorageUrl}
                            localAudioFile={localAudioFile}
                            audioDragging={audioDragging}
                            onAudioDraggingChange={setAudioDragging}
                            audioUploading={audioUploading}
                            audioUploadProgress={audioUploadProgress}
                            onAudioDrop={handleAudioDrop}
                            saving={saving}
                            saved={saved}
                            onSave={handleSaveBeat}
                        />
                    </motion.div>

                    {/* Row 3: YouTube Content */}
                    <motion.div
                        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                    >
                        <YoutubeContentCard
                            ytTitle={ytTitle}
                            ytDesc={ytDesc}
                            ytTitleCopied={ytTitleCopied}
                            ytDescCopied={ytDescCopied}
                            canGenerate={!!(beatName || artists.length)}
                            onGenerate={handleGenerateYoutube}
                            onTitleChange={setYtTitle}
                            onDescChange={setYtDesc}
                            onCopyTitle={handleCopyYtTitle}
                            onCopyDesc={handleCopyYtDesc}
                        />
                    </motion.div>
                </motion.div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete beat?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <strong>{beatName || 'Untitled'}</strong> and all associated files. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Generate Video Sheet */}
            <GenerateVideoSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                beatName={beatName}
                imageMode={sheetImageMode}
                onImageModeChange={setSheetImageMode}
                imageFile={sheetImageFile}
                onImageFileChange={setSheetImageFile}
                imageUrl={sheetImageUrl}
                onImageUrlChange={setSheetImageUrl}
                imagePreview={sheetImagePreview}
                imageDragging={sheetImageDragging}
                onImageDraggingChange={setSheetImageDragging}
                submitting={sheetSubmitting}
                error={sheetError}
                onSubmit={handleStartGeneration}
            />
        </>
    )
}