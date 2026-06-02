export type VideoPhase =
    | { phase: 'idle' }
    | { phase: 'generating'; jobId: string; progress: number; statusText: string }
    | { phase: 'done' }
    | { phase: 'failed'; error: string }
