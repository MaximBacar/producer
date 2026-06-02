'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { collection, getDocs, doc, getDoc, query, orderBy, type Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import type { BeatDoc } from '@/lib/beats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
    Music2, Activity, UserIcon, CheckCircle2, Loader2, Plus,
} from 'lucide-react'

type BeatRow = BeatDoc & { id: string }

function timeAgo(ts: Timestamp | null): string {
    if (!ts) return '—'
    const seconds = Math.floor((Date.now() - ts.toDate().getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
    const weeks = Math.floor(days / 7)
    if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
    return `${Math.floor(months / 12)} year${Math.floor(months / 12) === 1 ? '' : 's'} ago`
}

const quickActions = [
    {
        icon: Music2,
        title: 'Your Beats',
        description: 'Upload, manage, and generate videos for your beats.',
        href: '/dashboard/beats',
        cta: 'Open Beats',
        variant: 'default' as const,
    },
    {
        icon: Activity,
        title: 'Key & BPM Finder',
        description: 'Instantly detect the key and tempo of any audio file.',
        href: '/dashboard/key-bpm',
        cta: 'Analyze Audio',
        variant: 'default' as const,
    },
    {
        icon: UserIcon,
        title: 'Edit Profile',
        description: 'Set your producer name, contact info, and social links.',
        href: '/dashboard/profile',
        cta: 'Edit Profile',
        variant: 'outline' as const,
    },
]

export default function DashboardPage() {
    const { user } = useAuth()
    const router = useRouter()

    const [producerName, setProducerName] = useState<string | null>(null)
    const [recentBeats, setRecentBeats] = useState<BeatRow[]>([])
    const [totalBeats, setTotalBeats] = useState(0)
    const [videosGenerated, setVideosGenerated] = useState(0)
    const [inProgress, setInProgress] = useState(0)
    const [dataState, setDataState] = useState<'loading' | 'done'>('loading')

    useEffect(() => {
        if (!user) return

        async function load() {
            setDataState('loading')
            try {
                const [profileSnap, beatsSnap] = await Promise.all([
                    getDoc(doc(db, 'users', user!.uid, 'profile', 'data')),
                    getDocs(query(
                        collection(db, 'users', user!.uid, 'beats'),
                        orderBy('createdAt', 'desc'),
                    )),
                ])

                if (profileSnap.exists()) {
                    setProducerName(profileSnap.data().producerName ?? null)
                }

                const allBeats: BeatRow[] = beatsSnap.docs.map(d => ({
                    id: d.id,
                    ...(d.data() as BeatDoc),
                }))

                setTotalBeats(allBeats.length)
                setVideosGenerated(allBeats.filter(b => !!b.videoStorageUrl).length)
                setInProgress(allBeats.filter(b => b.is_generating).length)
                setRecentBeats(allBeats.slice(0, 5))
            } finally {
                setDataState('done')
            }
        }

        load()
    }, [user])

    const greeting = producerName ?? user?.displayName ?? 'Producer'

    const container: Variants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
    }
    const item: Variants = {
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
    }
    const rowVariant = {
        hidden: { opacity: 0, x: -8 },
        visible: (i: number) => ({
            opacity: 1, x: 0,
            transition: { duration: 0.22, delay: i * 0.04, ease: 'easeOut' as const },
        }),
    }

    return (
        <motion.div
            className="p-6 space-y-8"
            variants={container}
            initial="hidden"
            animate="visible"
        >
            {/* Welcome header */}
            <motion.div variants={item}>
                <h1 className="text-2xl font-semibold">Welcome back, {greeting} 👋</h1>
                <p className="text-muted-foreground mt-1">What are you creating today?</p>
            </motion.div>

            {/* Stat cards */}
            <motion.div variants={item}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Music2 className="size-4" />
                                Total Beats
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {dataState === 'loading'
                                ? <Skeleton className="h-8 w-12" />
                                : <p className="text-3xl font-bold tabular-nums">{totalBeats}</p>
                            }
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="size-4" />
                                Videos Generated
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {dataState === 'loading'
                                ? <Skeleton className="h-8 w-12" />
                                : <p className="text-3xl font-bold tabular-nums">{videosGenerated}</p>
                            }
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Loader2 className="size-4" />
                                In Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {dataState === 'loading'
                                ? <Skeleton className="h-8 w-12" />
                                : <p className="text-3xl font-bold tabular-nums">{inProgress}</p>
                            }
                        </CardContent>
                    </Card>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={item}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {quickActions.map(({ icon: Icon, title, description, href, cta, variant }) => (
                        <Card key={href} className="hover:bg-muted/30 transition-colors h-full">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Icon className="size-4" />
                                    {title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">{description}</p>
                                <Button asChild size="sm" variant={variant}>
                                    <Link href={href}>{cta}</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </motion.div>

            {/* Recent Beats */}
            <motion.div variants={item}>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Recent Beats
                    </h2>
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/dashboard/beats">View all</Link>
                    </Button>
                </div>

                <AnimatePresence mode="wait">
                    {dataState === 'loading' ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                        >
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-md" />
                            ))}
                        </motion.div>
                    ) : recentBeats.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center gap-3 py-10 text-center"
                        >
                            <div className="rounded-full bg-muted p-4">
                                <Music2 className="size-6 text-muted-foreground" />
                            </div>
                            <p className="font-medium">No beats yet</p>
                            <p className="text-sm text-muted-foreground">Create your first beat to get started</p>
                            <Button asChild size="sm">
                                <Link href="/dashboard/beats">
                                    <Plus className="mr-2 size-4" />
                                    Create a Beat
                                </Link>
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg border divide-y overflow-hidden"
                        >
                            {recentBeats.map((beat, i) => (
                                <motion.div
                                    key={beat.id}
                                    custom={i}
                                    variants={rowVariant}
                                    initial="hidden"
                                    animate="visible"
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => router.push(`/dashboard/beats/${beat.id}`)}
                                >
                                    <span className="flex-1 font-medium text-sm truncate">
                                        {beat.name || <span className="italic text-muted-foreground">Untitled</span>}
                                    </span>

                                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                                        {beat.bpm != null && (
                                            <Badge variant="outline" className="text-xs">{beat.bpm} BPM</Badge>
                                        )}
                                        {beat.key && (
                                            <Badge variant="outline" className="text-xs">{beat.key} {beat.scale}</Badge>
                                        )}
                                    </div>

                                    <div className="shrink-0">
                                        {beat.is_generating ? (
                                            <Badge variant="secondary" className="gap-1 text-xs">
                                                <Loader2 className="size-3 animate-spin" />
                                                Generating
                                            </Badge>
                                        ) : beat.videoStorageUrl ? (
                                            <Badge variant="secondary" className={cn('gap-1 text-xs text-emerald-600')}>
                                                <CheckCircle2 className="size-3" />
                                                Ready
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">No video</span>
                                        )}
                                    </div>

                                    <span className="text-xs text-muted-foreground shrink-0 w-20 text-right">
                                        {timeAgo(beat.createdAt)}
                                    </span>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    )
}
