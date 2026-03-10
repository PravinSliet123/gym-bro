"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import {
    Dumbbell,
    LayoutDashboard,
    Users,
    CreditCard,
    Settings,
    LogOut,
    Building2,
    PlusCircle,
    Menu,
    X,
} from "lucide-react"
import { useState } from "react"

interface NavItem {
    label: string
    href: string
    icon: React.ElementType
}

const adminNavItems: NavItem[] = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "All Gyms", href: "/admin/gyms", icon: Building2 },
    { label: "Create Gym", href: "/admin/create-gym", icon: PlusCircle },
]

const gymNavItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Members", href: "/dashboard/members", icon: Users },
    { label: "Plans", href: "/dashboard/plans", icon: CreditCard },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar({ role }: { role: "ADMIN" | "GYM_OWNER" }) {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [mobileOpen, setMobileOpen] = useState(false)
    const navItems = role === "ADMIN" ? adminNavItems : gymNavItems

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-lg font-bold">GymBro</h1>
                    <p className="text-xs text-muted-foreground">
                        {role === "ADMIN" ? "Admin Panel" : "Dashboard"}
                    </p>
                </div>
            </div>

            <Separator />

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                    const isActive =
                        item.href === pathname ||
                        (item.href !== "/admin" && item.href !== "/dashboard" && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <Separator />

            {/* User info & actions */}
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 px-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {session?.user?.name?.[0] || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                    </div>
                    <ThemeToggle />
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile toggle button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="fixed top-4 left-4 z-50 lg:hidden rounded-lg bg-background border p-2 shadow-md"
            >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 border-r bg-card transition-transform duration-300 lg:translate-x-0",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <SidebarContent />
            </aside>
        </>
    )
}
