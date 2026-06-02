'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeIcon, SearchIcon, UserIcon, MusicIcon } from 'lucide-react'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import { NavUser } from '@/components/nav-user'
import { Logo } from '@/components/logo'

const navItems = [
    { title: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { title: 'Your Beats', href: '/dashboard/beats', icon: MusicIcon },
    { title: 'Key & BPM Finder', href: '/dashboard/key-bpm', icon: SearchIcon },
    { title: 'Profile', href: '/dashboard/profile', icon: UserIcon },
]

function isActive(href: string, pathname: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <Logo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu>
                    {navItems.map(({ title, href, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                            <SidebarMenuButton asChild isActive={isActive(href, pathname)}>
                                <Link href={href}>
                                    <Icon className="size-4" />
                                    {title}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}
