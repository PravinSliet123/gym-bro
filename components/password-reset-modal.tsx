"use client"

import { useState } from "react"
import { resetGymPassword } from "@/actions/gym"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { KeyRound, Mail, Loader2, Copy } from "lucide-react"

interface PasswordResetModalProps {
    isOpen: boolean
    onClose: () => void
    gymId: string | null
    gymName: string
    gymEmail: string
}

export function PasswordResetModal({ isOpen, onClose, gymId, gymName, gymEmail }: PasswordResetModalProps) {
    const [loading, setLoading] = useState(false)
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)

    const handleGenerate = async () => {
        if (!gymId) return

        setLoading(true)
        try {
            const result = await resetGymPassword(gymId)

            if (result.success) {
                setGeneratedPassword(result.password || "")
                toast.success(result.message || "Password reset successfully")
            } else {
                toast.error(result.error || "Failed to reset password")
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = () => {
        if (generatedPassword) {
            navigator.clipboard.writeText(generatedPassword)
            toast.success("Password copied to clipboard")
        }
    }

    const handleClose = () => {
        setGeneratedPassword(null)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Generate a new password for {gymName}. It will be emailed to {gymEmail}.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {!generatedPassword ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
                            <div className="rounded-full bg-primary/10 p-3">
                                <KeyRound className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Click the button below to generate a new password and send it to the gym owner immediately.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-md bg-green-50 p-4 border border-green-200">
                                <div className="flex items-center space-x-2 text-green-700 mb-2">
                                    <Mail className="h-4 w-4" />
                                    <p className="text-sm font-medium">Email sent successfully</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <div className="flex gap-2">
                                        <Input readOnly value={generatedPassword} className="bg-white text-green-500 outline-0 border-none font-mono" />
                                        <Button variant="outline" size="icon" onClick={handleCopy} title="Copy password">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {!generatedPassword ? (
                        <>
                            <Button variant="outline" onClick={handleClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button onClick={handleGenerate} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generate & Send
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleClose} className="w-full">
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
