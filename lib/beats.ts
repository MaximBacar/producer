import type { Timestamp } from 'firebase/firestore'

export interface BeatDoc {
    name: string
    artists: string[]
    bpm: number | null
    key: string | null
    scale: string | null
    audioStorageUrl: string | null
    videoStorageUrl: string | null
    videoTitle: string | null
    videoDescription: string | null
    is_generating: boolean
    video_job_id: string | null
    createdAt: Timestamp
    updatedAt: Timestamp
}

export function formatArtists(artists: string[]): string {
    if (artists.length === 0) return 'Artist'
    if (artists.length === 1) return artists[0]
    return artists.slice(0, -1).join(', ') + ' & ' + artists[artists.length - 1]
}

export function buildTitle(artists: string[], producerName: string, beatName: string): string {
    return `${formatArtists(artists)} Type Beat (Prod. by ${producerName || 'Producer'}) - "${beatName}"`
}

export function buildDescription(
    artists: string[], bpm: number, key: string, scale: string,
    email: string,
    instagram: string, xHandle: string, discord: string,
    beatstars: string, soundcloud: string,
): string {
    const artistStr = formatArtists(artists)
    const lines = [`🎵 ${artistStr} Type Beat`, '', `Tempo: ${bpm} BPM`, `Key: ${key} ${scale}`, '']
    if (email) lines.push(`📧 Licensing: ${email}`)
    if (instagram) lines.push(`📸 Instagram: @${instagram}`)
    if (xHandle) lines.push(`🐦 X: @${xHandle}`)
    if (discord) lines.push(`💬 Discord: ${discord}`)
    if (soundcloud) lines.push(`🎧 SoundCloud: ${soundcloud}`)
    if (beatstars) lines.push(`🛒 Buy on Beatstars: ${beatstars}`)
    if (email || instagram || xHandle || discord || soundcloud || beatstars) lines.push('')
    lines.push(`#typebeat #${artistStr.toLowerCase().replace(/[^a-z0-9]/g, '')}typebeat #beats #producer #music`)
    return lines.join('\n')
}
