"use client";

import React, { useState, useEffect } from "react";
import { Download, X, PlusSquare, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if it's iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Listen for the beforeinstallprompt event (Android/PC)
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Check if already installed
            if (!window.matchMedia('(display-mode: standalone)').matches) {
                setShowPrompt(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handler);

        // For iOS, check if it's already in standalone mode
        if (isIOSDevice && !window.matchMedia('(display-mode: standalone)').matches) {
            // Show iOS prompt after a short delay
            const hasSeenPrompt = localStorage.getItem("pwa_prompt_dismissed");
            if (!hasSeenPrompt) {
                setTimeout(() => setShowPrompt(true), 3000);
            }
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const dismissPrompt = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa_prompt_dismissed", "true");
    };

    if (!showPrompt) return null;

    return (
        <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="bg-purple-600/20 p-2 rounded-xl mb-2">
                            <PlusSquare className="w-6 h-6 text-purple-500" />
                        </div>
                        <button
                            onClick={dismissPrompt}
                            className="p-1 hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>
                    <DialogTitle className="text-xl font-bold">Install GymBro</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {isIOS
                            ? "Add GymBro to your home screen for quick access and a better experience."
                            : "Install our app on your device for a splash screen, offline support, and full-screen access."}
                    </DialogDescription>
                </DialogHeader>

                {isIOS ? (
                    <div className="space-y-4 py-4">
                        <div className="flex items-start gap-4 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                            <div className="bg-blue-500/10 p-2 rounded-lg">
                                <Share className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">1. Tap the Share button</p>
                                <p className="text-xs text-zinc-500">Found at the bottom center of your Safari browser.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                            <div className="bg-orange-500/10 p-2 rounded-lg">
                                <PlusSquare className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">2. Select 'Add to Home Screen'</p>
                                <p className="text-xs text-zinc-500">Scroll down the menu to find this option.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 pt-4">
                        <Button
                            onClick={handleInstallClick}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 rounded-xl"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Install App Now
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={dismissPrompt}
                            className="text-zinc-500 hover:text-white hover:bg-transparent"
                        >
                            Maybe later
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
