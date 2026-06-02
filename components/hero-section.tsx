import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Zap, Settings2, Sparkles } from 'lucide-react'
import { HeroHeader } from '@/components/header'

export default function HeroSection() {
    return (
        <>
            <HeroHeader />
            <main>
                <section>
                    <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-36 lg:pt-52">
                        <div className="relative z-10 mx-auto max-w-4xl text-center">
                            <h1 className="text-balance text-5xl font-semibold md:text-6xl lg:text-7xl">
                                Share your beats{' '}
                                <span className="bg-gradient-to-r from-violet-500 to-teal-400 bg-clip-text text-transparent">
                                    like a pro
                                </span>
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
                                AutoProducer gives music producers the tools to analyze, present, and share their tracks — from BPM & key detection to professional beat videos.
                            </p>

                            <div className="mt-10 flex flex-wrap justify-center gap-4">
                                <Button asChild size="lg">
                                    <Link href="/dashboard">Get Started</Link>
                                </Button>
                                <Button asChild size="lg" variant="outline">
                                    <Link href="#features">Learn More</Link>
                                </Button>
                            </div>

                            <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Zap className="size-4 text-violet-500" />
                                    <span>BPM Detection</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Settings2 className="size-4 text-teal-500" />
                                    <span>Key Analysis</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-4 text-violet-500" />
                                    <span>Beat Videos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}
