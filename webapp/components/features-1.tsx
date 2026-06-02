import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Video, Zap, FolderOpen, PlaySquare, ImageIcon, Upload, Package } from 'lucide-react'
import { ReactNode } from 'react'

const liveFeatures = [
    {
        icon: Video,
        title: 'Beat Video Generation',
        description: 'Create dynamic or static beat videos from your cover art and audio in seconds — ready to post anywhere.',
    },
    {
        icon: Zap,
        title: 'Key & BPM Finder',
        description: 'Instantly detect tempo and musical key from any sample or audio file with studio-grade accuracy.',
    },
    {
        icon: FolderOpen,
        title: 'Beat Storage',
        description: 'Store and organize all your beats in one place. Access your catalog from anywhere, anytime.',
    },
    {
        icon: PlaySquare,
        title: 'YouTube Metadata Generator',
        description: 'Auto-generate SEO-optimized titles, descriptions, and tags for your beats — no more blank fields.',
    },
]

const comingFeatures = [
    {
        icon: ImageIcon,
        title: 'AI Beat Cover Generator',
        description: 'Generate genre-matched artwork automatically — girls for R&B type beats, cars and money for trap, and more.',
    },
    {
        icon: Upload,
        title: 'Auto YouTube Upload',
        description: 'Upload your beats directly to YouTube with no watermarks, fully automated from within AutoProducer.',
    },
    {
        icon: Package,
        title: 'Drumkit & Artwork Box',
        description: 'Generate and package drumkits with matching artwork in a single click — ready to sell or share.',
    },
]

export default function Features() {
    return (
        <section className="bg-muted/40 py-16 md:py-32 dark:bg-muted/10">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Everything your workflow needs</h2>
                    <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                        AutoProducer handles the time-consuming parts of music production so you can focus on making music.
                    </p>
                </div>

                {/* Live features */}
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 md:mt-16">
                    {liveFeatures.map((feature) => (
                        <Card key={feature.title} className="group shadow-sm text-center">
                            <CardHeader className="pb-3">
                                <CardDecorator>
                                    <feature.icon className="size-6" aria-hidden />
                                </CardDecorator>
                                <h3 className="mt-6 font-medium">{feature.title}</h3>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Coming soon features */}
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {comingFeatures.map((feature) => (
                        <Card key={feature.title} className="group shadow-sm text-center border-dashed opacity-80">
                            <CardHeader className="pb-3">
                                <CardDecorator>
                                    <feature.icon className="size-6" aria-hidden />
                                </CardDecorator>
                                <div className="mt-4 flex justify-center">
                                    <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                                </div>
                                <h3 className="mt-2 font-medium">{feature.title}</h3>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div className="mask-radial-from-40% mask-radial-to-60% relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-foreground)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-foreground)20%,transparent)]">
        <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-60"
        />
        <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t text-primary">{children}</div>
    </div>
)
