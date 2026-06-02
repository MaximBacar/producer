'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { Logo } from '@/components/logo'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleEmailAuth(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            if (mode === 'signup') {
                await createUserWithEmailAndPassword(auth, email, password)
            } else {
                await signInWithEmailAndPassword(auth, email, password)
            }
            router.push('/dashboard')
        } catch (err: unknown) {
            setError(err instanceof Error ? friendlyError(err.message) : 'Authentication failed.')
        } finally {
            setLoading(false)
        }
    }

    async function handleGoogle() {
        setGoogleLoading(true)
        setError(null)
        try {
            await signInWithPopup(auth, googleProvider)
            router.push('/dashboard')
        } catch (err: unknown) {
            setError(err instanceof Error ? friendlyError(err.message) : 'Google sign-in failed.')
        } finally {
            setGoogleLoading(false)
        }
    }

    return (
        <div className="min-h-svh flex items-center justify-center bg-background px-4">
            <motion.div
                className="w-full max-w-sm space-y-6"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
            >
                <motion.div
                    className="flex justify-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                >
                    <Logo />
                </motion.div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-lg">
                            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleGoogle}
                            disabled={googleLoading || loading}
                        >
                            {googleLoading
                                ? <Loader2 className="mr-2 size-4 animate-spin" />
                                : <GoogleIcon />
                            }
                            Continue with Google
                        </Button>

                        <div className="flex items-center gap-3">
                            <Separator className="flex-1" />
                            <span className="text-xs text-muted-foreground">or</span>
                            <Separator className="flex-1" />
                        </div>

                        <form onSubmit={handleEmailAuth} className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}

                            <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                                {mode === 'signin' ? 'Sign In' : 'Create Account'}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="justify-center">
                        <p className="text-sm text-muted-foreground">
                            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
                            <button
                                type="button"
                                className="text-foreground underline underline-offset-2 hover:no-underline"
                                onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null) }}
                            >
                                {mode === 'signin' ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}

function GoogleIcon() {
    return (
        <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )
}

function friendlyError(msg: string): string {
    if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) return 'Invalid email or password.'
    if (msg.includes('email-already-in-use')) return 'This email is already registered.'
    if (msg.includes('weak-password')) return 'Password must be at least 6 characters.'
    if (msg.includes('too-many-requests')) return 'Too many attempts. Try again later.'
    if (msg.includes('popup-closed-by-user')) return ''
    return 'Something went wrong. Please try again.'
}
