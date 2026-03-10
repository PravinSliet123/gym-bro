"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Building2, Mail, Phone, MapPin, CalendarDays, Crown } from "lucide-react"

export default function SettingsPage() {
    const { data: session } = useSession()
    const user = session?.user as any

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">View your gym account details</p>
            </div>

            <div className="grid gap-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Account Information
                        </CardTitle>
                        <CardDescription>Your gym account details managed by the platform admin</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-medium">{user?.name || "—"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{user?.email || "—"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Role</p>
                                <Badge variant="secondary">{user?.role || "GYM_OWNER"}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-amber-500" />
                            Subscription
                        </CardTitle>
                        <CardDescription>Your current plan and usage</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border">
                            <div>
                                <p className="font-semibold text-lg">Free Plan</p>
                                <p className="text-sm text-muted-foreground">Up to 50 members</p>
                            </div>
                            <Badge variant="success">Active</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Upgrade to a paid plan for unlimited members, advanced analytics, and more features.
                            Coming soon!
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
