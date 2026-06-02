'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Loader2 } from 'lucide-react'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { HeaderProvider, useHeader } from '@/lib/header-context'

function DashboardHeader() {
    const { title } = useHeader()
    return (
        <header className="flex flex-row h-16 shrink-0 items-center gap-2 border-b p-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-full" />
            <span className="font-semibold text-sm">{title}</span>
        </header>
    )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) router.push('/login')
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="min-h-svh flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!user) return null

    return (
        <HeaderProvider>
            <div className='h-screen overflow-hidden'>
                <SidebarProvider className='h-full min-h-0'>
                    <AppSidebar />
                    <SidebarInset className='flex flex-col min-h-0 overflow-hidden'>
                        <DashboardHeader />
                        <main className='flex flex-1 min-h-0 overflow-hidden'>
                            {children}
                        </main>
                    </SidebarInset>
                </SidebarProvider>
            </div>
        </HeaderProvider>
    )
}
