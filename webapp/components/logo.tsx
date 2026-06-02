import { AudioWaveform } from 'lucide-react';
import { cn } from '../lib/utils'

export const Logo = ({ className }: { className?: string; uniColor?: boolean }) => {
    return (
        <span className={cn('flex items-center gap-2', className)}>
            <LogoIcon />
            <span className="font-semibold text-base tracking-tight">AutoProducer</span>
        </span>
    )
}

export const LogoIcon = ({ className, uniColor }: { className?: string; uniColor?: boolean }) => {
    return (
        <AudioWaveform className={cn('size-6', className)}/>
    )
}
