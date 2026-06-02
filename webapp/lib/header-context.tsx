'use client'

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'

interface HeaderContextValue {
    title: string
    setTitle: (title: string) => void
}

const HeaderContext = createContext<HeaderContextValue | null>(null)

export function HeaderProvider({ children }: { children: ReactNode }) {
    const [title, setTitle] = useState('Dashboard')
    return (
        <HeaderContext.Provider value={{ title, setTitle }}>
            {children}
        </HeaderContext.Provider>
    )
}

export function useHeaderTitle(title: string) {
    const ctx = useContext(HeaderContext)
    const setTitle = ctx?.setTitle
    const titleRef = useRef(title)
    titleRef.current = title

    useEffect(() => {
        setTitle?.(titleRef.current)
        return () => setTitle?.('Dashboard')
    }, [setTitle])
}

export function useHeader() {
    const ctx = useContext(HeaderContext)
    if (!ctx) throw new Error('useHeader must be used inside HeaderProvider')
    return ctx
}