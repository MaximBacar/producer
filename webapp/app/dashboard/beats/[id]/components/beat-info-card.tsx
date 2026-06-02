'use client'

import { Check, CloudUpload, Loader2, Music, Upload, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
    Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface BeatInfoCardProps {
    // name
    beatName: string
    onBeatNameChange: (v: string) => void

    // artists
    artists: string[]
    onArtistsChange: (artists: string[]) => void
    artistInput: string
    onArtistInputChange: (v: string) => void
    onAddArtist: () => void

    // bpm / key
    showManual: boolean
    onToggleManual: () => void
    editedBpm: number | null
    editedKey: string | null
    editedScale: string | null
    manualBpm: string
    onManualBpmChange: (v: string) => void
    manualKeyLetter: string
    onManualKeyLetterChange: (v: string) => void
    manualAccidental: string
    onManualAccidentalChange: (v: string) => void
    manualScale: string
    onManualScaleChange: (v: string) => void
    onApplyManual: () => void

    // audio
    audioStorageUrl?: string | null
    localAudioFile: File | null
    audioDragging: boolean
    onAudioDraggingChange: (v: boolean) => void
    audioUploading: boolean
    audioUploadProgress: number | null
    onAudioDrop: (file: File) => void

    // save
    saving: boolean
    saved: boolean
    onSave: () => void
}

const NOTE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
const SCALES = ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian']

export function BeatInfoCard({
    beatName, onBeatNameChange,
    artists, onArtistsChange, artistInput, onArtistInputChange, onAddArtist,
    showManual, onToggleManual, editedBpm, editedKey, editedScale,
    manualBpm, onManualBpmChange, manualKeyLetter, onManualKeyLetterChange,
    manualAccidental, onManualAccidentalChange, manualScale, onManualScaleChange, onApplyManual,
    audioStorageUrl, localAudioFile, audioDragging, onAudioDraggingChange,
    audioUploading, audioUploadProgress, onAudioDrop,
    saving, saved, onSave,
}: BeatInfoCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Beat Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Beat Name</label>
                        <Input
                            placeholder="e.g. Midnight"
                            value={beatName}
                            onChange={(e) => onBeatNameChange(e.target.value)}
                        />
                    </div>

                    {/* BPM & Key */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">BPM & Key</label>
                        <div className="flex flex-wrap items-center gap-2">
                            {editedBpm && <Badge variant="secondary">{editedBpm} BPM</Badge>}
                            {editedKey && editedScale && (
                                <Badge variant="secondary">{editedKey} {editedScale}</Badge>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground"
                                onClick={onToggleManual}
                            >
                                {showManual ? 'Cancel' : (editedBpm ? 'Edit' : 'Enter manually')}
                            </Button>
                        </div>
                        {showManual && (
                            <div className="space-y-3 rounded-md border p-3 mt-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground">BPM</label>
                                    <Input
                                        type="number"
                                        placeholder="128"
                                        value={manualBpm}
                                        onChange={(e) => onManualBpmChange(e.target.value)}
                                        min={1}
                                        max={300}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground">Key</label>
                                    <div className="flex gap-2">
                                        <Select value={manualKeyLetter} onValueChange={onManualKeyLetterChange}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Note" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {NOTE_LETTERS.map(n => (
                                                        <SelectItem key={n} value={n}>{n}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <Select value={manualAccidental} onValueChange={onManualAccidentalChange}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value="none">♮ Natural</SelectItem>
                                                    <SelectItem value="#">♯ Sharp</SelectItem>
                                                    <SelectItem value="b">♭ Flat</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground">Scale</label>
                                    <Select value={manualScale} onValueChange={onManualScaleChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {SCALES.map(s => (
                                                    <SelectItem key={s} value={s}>
                                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={onApplyManual}
                                    disabled={!manualBpm || !manualKeyLetter}
                                >
                                    Apply
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Artists */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                        Artists <span className="text-muted-foreground/60">(type beat)</span>
                    </label>
                    <div
                        className="flex flex-wrap gap-1.5 rounded-md border px-2 py-1.5 min-h-10 focus-within:ring-1 focus-within:ring-ring cursor-text"
                        onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus()}
                    >
                        {artists.map(a => (
                            <span key={a} className="flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                                {a}
                                <button
                                    type="button"
                                    onClick={() => onArtistsChange(artists.filter(x => x !== a))}
                                    className="hover:text-destructive leading-none"
                                >
                                    <X className="size-3" />
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            placeholder={artists.length ? '' : 'Drake, Future… (Enter to add)'}
                            value={artistInput}
                            onChange={(e) => onArtistInputChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); onAddArtist() }
                                if (e.key === 'Backspace' && !artistInput && artists.length) {
                                    onArtistsChange(artists.slice(0, -1))
                                }
                            }}
                            onBlur={onAddArtist}
                            className="flex-1 min-w-28 bg-transparent text-sm outline-none py-0.5"
                        />
                    </div>
                </div>

                {/* Audio */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Audio File</label>
                    {audioStorageUrl && !localAudioFile ? (
                        <div className="flex items-center gap-2 rounded-md border p-3">
                            <Music className="size-4 text-primary shrink-0" />
                            <span className="text-sm truncate flex-1">Audio uploaded</span>
                            <label
                                htmlFor="audio-replace"
                                className="cursor-pointer text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                            >
                                Replace
                                <input
                                    id="audio-replace"
                                    type="file"
                                    accept=".mp3,.wav"
                                    className="sr-only"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onAudioDrop(f) }}
                                />
                            </label>
                        </div>
                    ) : (
                        <label
                            htmlFor="audio-upload"
                            onDragOver={(e) => { e.preventDefault(); onAudioDraggingChange(true) }}
                            onDragLeave={() => onAudioDraggingChange(false)}
                            onDrop={(e) => {
                                e.preventDefault()
                                onAudioDraggingChange(false)
                                const f = e.dataTransfer.files[0]
                                if (f) onAudioDrop(f)
                            }}
                            className={cn(
                                'flex flex-col items-center justify-center gap-2 cursor-pointer rounded-md border-2 border-dashed p-5 transition-colors',
                                audioDragging ? 'border-primary bg-primary/5'
                                    : localAudioFile ? 'border-primary/40 bg-primary/5'
                                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            )}
                        >
                            <input
                                id="audio-upload"
                                type="file"
                                accept=".mp3,.wav"
                                className="sr-only"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) onAudioDrop(f) }}
                            />
                            {localAudioFile ? (
                                <>
                                    <Music className="size-6 text-primary" />
                                    <span className="text-sm font-medium text-center truncate max-w-full px-2">
                                        {localAudioFile.name}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Upload className="size-6 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground text-center">
                                        Drop .mp3 or .wav or click to browse
                                    </span>
                                </>
                            )}
                        </label>
                    )}
                    {audioUploading && audioUploadProgress !== null && (
                        <div className="space-y-1 mt-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <CloudUpload className="size-3" /> Uploading…
                                </span>
                                <span>{audioUploadProgress}%</span>
                            </div>
                            <Progress value={audioUploadProgress} className="h-1" />
                        </div>
                    )}
                </div>

                <Button className="w-full" onClick={onSave} disabled={saving}>
                    {saving
                        ? <><Loader2 className="mr-2 size-4 animate-spin" /> Saving…</>
                        : saved
                            ? <><Check className="mr-2 size-4" /> Saved!</>
                            : 'Save'
                    }
                </Button>
            </CardContent>
        </Card>
    )
}