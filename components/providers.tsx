'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/lib/auth-context'
import { PlayerProvider } from '@/lib/player-context'
import { FloatingPlayer } from '@/components/floating-player'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ThemeProvider>
                <PlayerProvider>
                    {children}
                    <FloatingPlayer />
                </PlayerProvider>
            </ThemeProvider>
        </AuthProvider>
    )
}
