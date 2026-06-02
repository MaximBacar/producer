'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { VideoIcon, UserIcon } from 'lucide-react'

export default function DashboardPage() {
    const { user } = useAuth()
    const [producerName, setProducerName] = useState<string | null>(null)

    useEffect(() => {
        if (!user) return
        getDoc(doc(db, 'users', user.uid, 'profile', 'data')).then((snap) => {
            if (snap.exists()) setProducerName(snap.data().producerName ?? null)
        })
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

    return (
            <motion.div
                className="p-6 space-y-6"
                variants={container}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={item}>
                    <h1 className="text-2xl font-semibold">Welcome back, {greeting} 👋</h1>
                    <p className="text-muted-foreground mt-1">What are you creating today?</p>
                </motion.div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl">
                    <motion.div variants={item}>
                        <Card className="hover:bg-muted/30 transition-colors h-full">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <VideoIcon className="size-4" />
                                    Beat Video Generator
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Generate a professional YouTube video from your cover art and audio.
                                </p>
                                <Button asChild size="sm">
                                    <Link href="/dashboard/beat-video">Open Generator</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={item}>
                        <Card className="hover:bg-muted/30 transition-colors h-full">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <UserIcon className="size-4" />
                                    Your Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Set your producer name, contact info, and social links.
                                </p>
                                <Button asChild size="sm" variant="outline">
                                    <Link href="/dashboard/profile">Edit Profile</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </motion.div>
    )
}
