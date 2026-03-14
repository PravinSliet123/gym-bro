"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const MAX_SIZE_BYTES = 1 * 1024 * 1024 // 1 MB
const TARGET_WIDTH = 400 // resize to max 400px wide for storage efficiency

interface ImageCaptureProps {
    value?: string
    onChange: (value: string) => void
    className?: string
}

function compressImage(dataUrl: string, maxWidth = TARGET_WIDTH, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement("canvas")
            let width = img.width
            let height = img.height

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width)
                width = maxWidth
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext("2d")
            if (!ctx) return reject(new Error("Canvas not supported"))
            ctx.drawImage(img, 0, 0, width, height)
            const compressed = canvas.toDataURL("image/jpeg", quality)
            resolve(compressed)
        }
        img.onerror = reject
        img.src = dataUrl
    })
}

function base64SizeBytes(dataUrl: string): number {
    // data:image/jpeg;base64,<payload>
    const base64 = dataUrl.split(",")[1] || ""
    return Math.ceil((base64.length * 3) / 4)
}

export function ImageCapture({ value, onChange, className }: ImageCaptureProps) {
    const [isCapturing, setIsCapturing] = useState(false)
    const [preview, setPreview] = useState<string | null>(value || null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleCompressAndSet = async (dataUrl: string) => {
        let compressed = await compressImage(dataUrl)
        // Reduce quality further if still over 1MB
        if (base64SizeBytes(compressed) > MAX_SIZE_BYTES) {
            compressed = await compressImage(dataUrl, TARGET_WIDTH, 0.5)
        }
        if (base64SizeBytes(compressed) > MAX_SIZE_BYTES) {
            toast.error("Image too large. Please use a smaller image (max 1 MB).")
            return
        }
        setPreview(compressed)
        onChange(compressed)
    }

    const startCamera = async () => {
        setIsCapturing(true)
        setPreview(null)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
        } catch (err) {
            console.error("Error accessing camera:", err)
            toast.error("Could not access camera. Please allow camera permissions.")
            setIsCapturing(false)
        }
    }

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
            tracks.forEach((track) => track.stop())
            videoRef.current.srcObject = null
        }
        setIsCapturing(false)
    }

    const captureImage = async () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext("2d")
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth
                canvasRef.current.height = videoRef.current.videoHeight
                context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight)
                const dataUrl = canvasRef.current.toDataURL("image/jpeg")
                stopCamera()
                await handleCompressAndSet(dataUrl)
            }
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Raw file size check before even reading
        if (file.size > MAX_SIZE_BYTES * 3) {
            toast.error("File too large. Please use an image under 3 MB.")
            e.target.value = ""
            return
        }

        const reader = new FileReader()
        reader.onloadend = async () => {
            const dataUrl = reader.result as string
            await handleCompressAndSet(dataUrl)
        }
        reader.readAsDataURL(file)
    }

    const clearImage = () => {
        setPreview(null)
        onChange("")
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    return (
        <div className={cn("space-y-3", className)}>
            <div className="relative aspect-square w-full max-w-[260px] overflow-hidden rounded-lg border-2 border-dashed bg-muted flex items-center justify-center">
                {preview ? (
                    <>
                        <img src={preview} alt="Member preview" className="h-full w-full object-cover" />
                        <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-2 right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </>
                ) : isCapturing ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                        <Camera className="h-10 w-10" />
                        <p className="text-xs">No image selected</p>
                        <p className="text-xs text-muted-foreground/60">Max 1 MB</p>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />

            <div className="flex flex-wrap gap-2">
                {!isCapturing && (
                    <>
                        <Button type="button" variant="outline" size="sm" onClick={startCamera}>
                            <Camera className="mr-2 h-4 w-4" />
                            Take Photo
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                        </Button>
                    </>
                )}
                {isCapturing && (
                    <>
                        <Button type="button" size="sm" onClick={captureImage}>
                            <Check className="mr-2 h-4 w-4" />
                            Capture
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={stopCamera}>
                            Cancel
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
