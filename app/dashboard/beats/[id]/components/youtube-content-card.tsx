'use client'

import { Check, Copy, PlaySquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface YoutubeContentCardProps {
    ytTitle: string | null
    ytDesc: string | null
    ytTitleCopied: boolean
    ytDescCopied: boolean
    canGenerate: boolean
    onGenerate: () => void
    onTitleChange: (v: string) => void
    onDescChange: (v: string) => void
    onCopyTitle: () => void
    onCopyDesc: () => void
}

export function YoutubeContentCard({
    ytTitle, ytDesc,
    ytTitleCopied, ytDescCopied,
    canGenerate, onGenerate,
    onTitleChange, onDescChange,
    onCopyTitle, onCopyDesc,
}: YoutubeContentCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                        <PlaySquare className="size-4" />
                        YouTube Content
                    </span>
                    <Button size="sm" onClick={onGenerate} disabled={!canGenerate}>
                        {ytTitle ? 'Regenerate' : 'Generate'}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {ytTitle === null ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                        <div className="rounded-full bg-muted p-4">
                            <PlaySquare className="size-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium">No content yet</p>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Click "Generate" to create a YouTube title and description from your beat's metadata
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Title</label>
                            <div className="flex gap-2">
                                <Input
                                    value={ytTitle}
                                    onChange={(e) => onTitleChange(e.target.value)}
                                    className="flex-1"
                                />
                                <Button variant="outline" size="icon" onClick={onCopyTitle} className="shrink-0">
                                    {ytTitleCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Description</label>
                            <Textarea
                                value={ytDesc ?? ''}
                                onChange={(e) => onDescChange(e.target.value)}
                                rows={9}
                                className="text-sm resize-none font-mono"
                            />
                            <Button variant="ghost" size="sm" className="w-full" onClick={onCopyDesc}>
                                {ytDescCopied
                                    ? <><Check className="mr-2 size-4" /> Copied!</>
                                    : <><Copy className="mr-2 size-4" /> Copy description</>
                                }
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}