import axios, { isAxiosError } from 'axios'
import { getAuth } from 'firebase/auth'

const apiClient = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000' })

apiClient.interceptors.request.use(async (config) => {
    const user = getAuth().currentUser
    if (user) {
        const token = await user.getIdToken()
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

async function apiCall<T>(fn: () => Promise<{ data: T }>): Promise<T> {
    try {
        const res = await fn()
        return res.data
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            const detail = err.response.data?.detail
            throw new Error(detail ?? `API error ${err.response.status}`)
        }
        throw err
    }
}

export async function analyzeBpmAndKey(audio: File): Promise<{ bpm: number; key: string; scale: string }> {
    const [bpmResult, keyResult] = await Promise.all([
        apiCall(() => { const f = new FormData(); f.append('audio', audio); return apiClient.post<{ bpm: number }>('/audio/bpm', f) }),
        apiCall(() => { const f = new FormData(); f.append('audio', audio); return apiClient.post<{ key: string; scale: string }>('/audio/key', f) }),
    ])
    return { bpm: bpmResult.bpm, key: keyResult.key, scale: keyResult.scale }
}

export type VideoStatus = 'pending' | 'processing' | 'done' | 'failed'

export async function getVideoStatus(jobId: string): Promise<{ status: VideoStatus; progress: number; error?: string }> {
    return apiCall(() => apiClient.get(`/video/status/${jobId}`))
}

export async function createBeat(
    title: string,
    audio: File,
): Promise<{ beat_id: string; bpm: number; key: string; scale: string }> {
    const form = new FormData()
    form.append('title', title)
    form.append('audio', audio)
    return apiCall(() => apiClient.post('/beats', form))
}

export async function generateBeatVideo(
    beatId: string,
    image: File,
): Promise<{ job_id: string }> {
    const form = new FormData()
    form.append('image', image)
    return apiCall(() => apiClient.post(`/beats/${beatId}/generate-video`, form))
}

export async function deleteBeat(beatId: string): Promise<void> {
    await apiClient.delete(`/beats/${beatId}`)
}

export async function fetchImageFromUrl(url: string): Promise<File> {
    const res = await apiClient.get<Blob>('/image/proxy', {
        params: { url },
        responseType: 'blob',
    })
    const blob = res.data
    const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
    return new File([blob], `cover.${ext}`, { type: blob.type })
}
