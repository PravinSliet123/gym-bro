import { Sidebar } from "@/components/sidebar"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <PWAInstallPrompt />
            <Sidebar role="GYM_OWNER" />
            <main className="lg:pl-64">
                <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
