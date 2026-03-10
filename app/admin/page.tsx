import { getAdminStats } from "@/actions/gym"
import { StatsCard } from "@/components/stats-card"
import { Building2, Users, CheckCircle, XCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
    const result = await getAdminStats()
    const stats = result.data || { totalGyms: 0, activeGyms: 0, inactiveGyms: 0, totalMembers: 0 }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">Manage all gyms on the platform</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Gyms"
                    value={stats.totalGyms}
                    icon={Building2}
                    iconColor="text-violet-600 dark:text-violet-400"
                />
                <StatsCard
                    title="Active Gyms"
                    value={stats.activeGyms}
                    icon={CheckCircle}
                    iconColor="text-emerald-600 dark:text-emerald-400"
                />
                <StatsCard
                    title="Inactive Gyms"
                    value={stats.inactiveGyms}
                    icon={XCircle}
                    iconColor="text-red-500 dark:text-red-400"
                />
                <StatsCard
                    title="Total Members"
                    value={stats.totalMembers}
                    icon={Users}
                    iconColor="text-blue-600 dark:text-blue-400"
                />
            </div>
        </div>
    )
}
