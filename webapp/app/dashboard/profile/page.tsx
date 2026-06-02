'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Loader2, Check } from 'lucide-react'

interface ProfileData {
    producerName: string
    businessEmail: string
    instagramUsername: string
    xUsername: string
    discordUsername: string
    soundcloudUrl: string
    beatstarsUrl: string
    youtubeUrl: string
}

const empty: ProfileData = {
    producerName: '',
    businessEmail: '',
    instagramUsername: '',
    xUsername: '',
    discordUsername: '',
    soundcloudUrl: '',
    beatstarsUrl: '',
    youtubeUrl: '',
}

export default function ProfilePage() {
    const { user } = useAuth()
    const [form, setForm] = useState<ProfileData>(empty)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        if (!user) return
        getDoc(doc(db, 'users', user.uid, 'profile', 'data')).then((snap) => {
            if (snap.exists()) {
                const d = snap.data()
                setForm({
                    producerName: d.producerName ?? '',
                    businessEmail: d.businessEmail ?? '',
                    instagramUsername: d.instagramUsername ?? '',
                    xUsername: d.xUsername ?? '',
                    discordUsername: d.discordUsername ?? '',
                    soundcloudUrl: d.soundcloudUrl ?? '',
                    beatstarsUrl: d.beatstarsUrl ?? '',
                    youtubeUrl: d.youtubeUrl ?? '',
                })
            }
        }).finally(() => setLoading(false))
    }, [user])

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        if (!user) return
        setSaving(true)
        await setDoc(doc(db, 'users', user.uid, 'profile', 'data'), form, { merge: true })
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    function field(key: keyof ProfileData, value: string) {
        setForm(f => ({ ...f, [key]: value }))
    }

    return (
            <motion.div
                className="p-6 w-full h-full"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Producer Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="producerName">Producer Name</Label>
                                    <Input
                                        id="producerName"
                                        placeholder="e.g. Metro Boomin"
                                        value={form.producerName}
                                        onChange={(e) => field('producerName', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="businessEmail">Business Email</Label>
                                    <Input
                                        id="businessEmail"
                                        type="email"
                                        placeholder="beats@example.com"
                                        value={form.businessEmail}
                                        onChange={(e) => field('businessEmail', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="instagramUsername">Instagram Username</Label>
                                    <Input
                                        id="instagramUsername"
                                        placeholder="yourhandle"
                                        value={form.instagramUsername}
                                        onChange={(e) => field('instagramUsername', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="xUsername">X (Twitter) Username</Label>
                                    <Input
                                        id="xUsername"
                                        placeholder="yourhandle"
                                        value={form.xUsername}
                                        onChange={(e) => field('xUsername', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="discordUsername">Discord Username</Label>
                                    <Input
                                        id="discordUsername"
                                        placeholder="yourname or server invite"
                                        value={form.discordUsername}
                                        onChange={(e) => field('discordUsername', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="soundcloudUrl">SoundCloud URL</Label>
                                    <Input
                                        id="soundcloudUrl"
                                        type="url"
                                        placeholder="https://soundcloud.com/..."
                                        value={form.soundcloudUrl}
                                        onChange={(e) => field('soundcloudUrl', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="beatstarsUrl">Beatstars URL</Label>
                                    <Input
                                        id="beatstarsUrl"
                                        type="url"
                                        placeholder="https://www.beatstars.com/..."
                                        value={form.beatstarsUrl}
                                        onChange={(e) => field('beatstarsUrl', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="youtubeUrl">YouTube Channel URL</Label>
                                    <Input
                                        id="youtubeUrl"
                                        type="url"
                                        placeholder="https://youtube.com/@..."
                                        value={form.youtubeUrl}
                                        onChange={(e) => field('youtubeUrl', e.target.value)}
                                    />
                                </div>

                                <Button type="submit" disabled={saving} className="w-full">
                                    {saving
                                        ? <><Loader2 className="mr-2 size-4 animate-spin" /> Saving…</>
                                        : saved
                                            ? <><Check className="mr-2 size-4" /> Saved!</>
                                            : 'Save Profile'
                                    }
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
    )
}
