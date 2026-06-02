'use client'

import { ImageIcon, Link2, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface GenerateVideoSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    beatName: string
    imageMode: 'file' | 'url'
    onImageModeChange: (mode: 'file' | 'url') => void
    imageFile: File | null
    onImageFileChange: (file: File | null) => void
    imageUrl: string
    onImageUrlChange: (url: string) => void
    imagePreview: string | null
    imageDragging: boolean
    onImageDraggingChange: (v: boolean) => void
    submitting: boolean
    error: string | null
    onSubmit: () => void
}

export function GenerateVideoSheet({
    open, onOpenChange, beatName,
    imageMode, onImageModeChange,
    imageFile, onImageFileChange,
    imageUrl, onImageUrlChange,
    imagePreview,
    imageDragging, onImageDraggingChange,
    submitting, error, onSubmit,
}: GenerateVideoSheetProps) {
    return (
        <Sheet open={open} onOpenChange={(v) => { if (!submitting) onOpenChange(v) }}>
            <SheetContent className="min-w-0 flex flex-col w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Generate Video</SheetTitle>
                    <SheetDescription>
                        Upload cover art to create a YouTube video for "{beatName || 'Untitled'}"
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4 px-4">
                    {/* Mode toggle */}
                    <div className="flex gap-1 rounded-md border p-1">
                        <Button
                            variant={imageMode === 'file' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={() => { onImageModeChange('file'); onImageUrlChange('') }}
                        >
                            <Upload className="size-3" /> Upload
                        </Button>
                        <Button
                            variant={imageMode === 'url' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={() => { onImageModeChange('url'); onImageFileChange(null) }}
                        >
                            <Link2 className="size-3" /> URL
                        </Button>
                    </div>

                    {/* File upload */}
                    {imageMode === 'file' && (
                        <label
                            htmlFor="sheet-img-upload"
                            onDragOver={(e) => { e.preventDefault(); onImageDraggingChange(true) }}
                            onDragLeave={() => onImageDraggingChange(false)}
                            onDrop={(e) => {
                                e.preventDefault()
                                onImageDraggingChange(false)
                                const f = e.dataTransfer.files[0]
                                if (f) onImageFileChange(f)
                            }}
                            className={cn(
                                'flex flex-col items-center justify-center gap-3 cursor-pointer rounded-md border-2 border-dashed p-8 transition-colors',
                                imageDragging ? 'border-primary bg-primary/5'
                                    : imageFile ? 'border-primary/40 bg-primary/5'
                                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            )}
                        >
                            <input
                                id="sheet-img-upload"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => onImageFileChange(e.target.files?.[0] ?? null)}
                            />
                            {imagePreview
                                ? <img src={imagePreview} alt="Preview" className="max-h-40 rounded object-cover" />
                                : (
                                    <>
                                        <ImageIcon className="size-8 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground text-center">
                                            Drop image or click to browse
                                        </span>
                                    </>
                                )
                            }
                        </label>
                    )}

                    {/* URL input */}
                    {imageMode === 'url' && (
                        <div className="space-y-3">
                            <div className="relative">
                                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    type="url"
                                    placeholder="https://example.com/cover.jpg"
                                    value={imageUrl}
                                    onChange={(e) => onImageUrlChange(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            {imageUrl && (
                                <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-md border bg-muted/20">
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="max-h-40 max-w-full rounded object-contain"
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                                        onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.display = '' }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <SheetFooter className="w-full flex flex-row gap-2 pt-4 border-t">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={onSubmit}
                        disabled={submitting || (imageMode === 'file' ? !imageFile : !imageUrl)}
                    >
                        {submitting
                            ? <><Loader2 className="mr-2 size-4 animate-spin" /> Starting…</>
                            : 'Start Generation'
                        }
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}