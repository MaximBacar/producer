import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Video, Zap, PlaySquare } from 'lucide-react'
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
                                Produce faster.{' '}
                                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                    Ship more beats.
                                </span>
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
                                AutoProducer automates everything around your music — video generation, BPM & key detection, metadata writing, and beat storage — so you spend less time on admin and more time creating.
                            </p>

                            <div className="mt-10 flex flex-wrap justify-center gap-4">
                                <Button asChild size="lg">
                                    <Link href="/dashboard">Get Started Free</Link>
                                </Button>
                                <Button asChild size="lg" variant="outline">
                                    <Link href="#features">See Features</Link>
                                </Button>
                            </div>

                            <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Video className="size-4 text-primary" />
                                    <span>Beat Video Generation</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap className="size-4 text-primary" />
                                    <span>BPM & Key Detection</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <PlaySquare className="size-4 text-primary" />
                                    <span>YouTube Metadata</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}
