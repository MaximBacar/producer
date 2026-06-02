import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HeroHeader } from '@/components/header'
import FooterSection from '@/components/footer'
import { Check } from 'lucide-react'
import Link from 'next/link'

const freePlan = {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Everything you need to get started.',
    cta: 'Get Started for Free',
    ctaHref: '/dashboard',
    features: [
        'Beat video generation (3 / month)',
        'BPM & Key detection',
        'Beat storage (up to 10 beats)',
        'YouTube metadata generator',
    ],
}

const proPlan = {
    name: 'Pro',
    price: '$10',
    period: 'per month',
    description: 'Unlimited everything, plus upcoming features as they ship.',
    cta: 'Start Pro',
    ctaHref: '/dashboard',
    features: [
        'Everything in Free',
        'Unlimited beat video generation',
        'Unlimited beat storage',
        'AI beat cover generation',
        'Auto YouTube upload (no watermarks)',
        'Drumkit & artwork box',
        'Priority support',
    ],
    comingSoon: ['AI beat cover generation', 'Auto YouTube upload (no watermarks)', 'Drumkit & artwork box'],
}

export default function PricingPage() {
    return (
        <>
            <HeroHeader />
            <main className="mx-auto max-w-5xl px-6 pb-24 pt-36 lg:pt-48">
                <div className="text-center mb-14">
                    <h1 className="text-4xl font-semibold lg:text-5xl text-balance">Simple pricing</h1>
                    <p className="mt-4 text-muted-foreground max-w-md mx-auto">
                        Start for free. Upgrade when you need more.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
                    {/* Free plan */}
                    <Card className="flex flex-col">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">{freePlan.name}</h2>
                            </div>
                            <div className="mt-2 flex items-end gap-1">
                                <span className="text-4xl font-bold">{freePlan.price}</span>
                                <span className="text-muted-foreground mb-1 text-sm">/ {freePlan.period}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{freePlan.description}</p>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-1 gap-6">
                            <ul className="space-y-3">
                                {freePlan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                                        <Check className="size-4 text-primary shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-auto">
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={freePlan.ctaHref}>{freePlan.cta}</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pro plan */}
                    <Card className="flex flex-col border-primary shadow-md relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">{proPlan.name}</h2>
                                <Badge className="text-xs">Most Popular</Badge>
                            </div>
                            <div className="mt-2 flex items-end gap-1">
                                <span className="text-4xl font-bold">{proPlan.price}</span>
                                <span className="text-muted-foreground mb-1 text-sm">/ {proPlan.period}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{proPlan.description}</p>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-1 gap-6">
                            <ul className="space-y-3">
                                {proPlan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                                        <Check className="size-4 text-primary shrink-0" />
                                        <span>{feature}</span>
                                        {proPlan.comingSoon.includes(feature) && (
                                            <Badge variant="secondary" className="text-xs ml-auto shrink-0">Soon</Badge>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-auto">
                                <Button asChild className="w-full">
                                    <Link href={proPlan.ctaHref}>{proPlan.cta}</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <FooterSection />
        </>
    )
}
