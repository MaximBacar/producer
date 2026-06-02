'use client'

import Link from 'next/link'
import { LogoIcon } from '@/components/logo'
import { Menu, X, Video, Zap, FolderOpen, PlaySquare, ImageIcon, Upload, Package, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import React from 'react'
import { cn } from '@/lib/utils'

const features = [
    { name: 'Beat Video Generation', href: '#features', icon: Video, description: 'Dynamic & static beat videos from your cover art + audio' },
    { name: 'Key & BPM Finder', href: '#features', icon: Zap, description: 'Detect tempo and key from any sample or audio file' },
    { name: 'Beat Storage', href: '#features', icon: FolderOpen, description: 'Store and organize all your beats in one place' },
    { name: 'YouTube Metadata', href: '#features', icon: PlaySquare, description: 'Auto-generate titles, descriptions, and tags' },
    { name: 'AI Beat Covers', href: '#features', icon: ImageIcon, description: 'Genre-matched artwork generation — coming soon' },
    { name: 'Auto YouTube Upload', href: '#features', icon: Upload, description: 'Upload beats with no watermarks, fully automated — coming soon' },
    { name: 'Drumkit & Artwork Box', href: '#features', icon: Package, description: 'Generate and package drumkits with artwork — coming soon' },
]

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [featuresOpen, setFeaturesOpen] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header>
            <nav data-state={menuState && 'active'} className="fixed z-20 w-full px-2">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link href="/" aria-label="home" className="flex items-center gap-2">
                                <LogoIcon />
                                <span className="font-semibold text-sm">AutoProducer</span>
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        {/* Desktop nav */}
                        <div className="absolute inset-0 m-auto hidden size-fit lg:flex lg:items-center">
                            <NavigationMenu>
                                <NavigationMenuList className="gap-1">
                                    <NavigationMenuItem>
                                        <NavigationMenuTrigger className="bg-transparent text-sm text-muted-foreground hover:text-foreground h-auto px-3 py-1.5">
                                            Features
                                        </NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <ul className="grid w-[520px] grid-cols-2 gap-1 p-3">
                                                {features.map((feature) => (
                                                    <li key={feature.name}>
                                                        <NavigationMenuLink asChild>
                                                            <Link
                                                                href={feature.href}
                                                                className="flex items-start gap-3 rounded-md p-2.5 hover:bg-muted transition-colors group">
                                                                <feature.icon className="size-4 mt-0.5 text-primary shrink-0" />
                                                                <div>
                                                                    <div className="text-sm font-medium leading-none mb-1">{feature.name}</div>
                                                                    <p className="text-xs text-muted-foreground leading-snug">{feature.description}</p>
                                                                </div>
                                                            </Link>
                                                        </NavigationMenuLink>
                                                    </li>
                                                ))}
                                            </ul>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <NavigationMenuLink asChild>
                                            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors inline-block">
                                                Pricing
                                            </Link>
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>

                        {/* Mobile menu + CTA */}
                        <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden w-full">
                                <div className="mb-4">
                                    <button
                                        onClick={() => setFeaturesOpen(!featuresOpen)}
                                        className="flex items-center gap-1 text-base font-medium text-muted-foreground hover:text-foreground transition-colors mb-2">
                                        Features
                                        <ChevronDown className={cn('size-4 transition-transform duration-200', featuresOpen && 'rotate-180')} />
                                    </button>
                                    {featuresOpen && (
                                        <ul className="space-y-3 pl-2 pt-1">
                                            {features.map((feature) => (
                                                <li key={feature.name}>
                                                    <Link
                                                        href={feature.href}
                                                        onClick={() => setMenuState(false)}
                                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                                        <feature.icon className="size-4 text-primary shrink-0" />
                                                        <span>{feature.name}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <Link
                                    href="/pricing"
                                    onClick={() => setMenuState(false)}
                                    className="block text-base text-muted-foreground hover:text-foreground transition-colors">
                                    Pricing
                                </Link>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <Button asChild size="sm">
                                    <Link href="/dashboard">
                                        <span>Get Started</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
