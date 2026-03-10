"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { getDashboardStats, getMonthlyMemberData, getExpiringMembersData } from "@/actions/member"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, UserCheck, UserX, Clock, TrendingUp, AlertTriangle } from "lucide-react"
import { formatDate, getDaysRemaining } from "@/lib/utils"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts"

const CHART_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444"]

export default function DashboardPage() {
    const { data: session } = useSession()
    const gymId = (session?.user as any)?.gymId
    const [stats, setStats] = useState<any>(null)
    const [chartData, setChartData] = useState<any[]>([])
    const [expiringMembers, setExpiringMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!gymId) return
        const fetchData = async () => {
            const [statsResult, chartResult, expiringResult] = await Promise.all([
                getDashboardStats(gymId),
                getMonthlyMemberData(gymId),
                getExpiringMembersData(gymId),
            ])
            if (statsResult.success) setStats(statsResult.data)
            if (chartResult.success) setChartData(chartResult.data || [])
            if (expiringResult.success) setExpiringMembers(expiringResult.data || [])
            setLoading(false)
        }
        fetchData()
    }, [gymId])

    if (loading) {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-5 w-72 mt-2" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    <Skeleton className="h-80" />
                    <Skeleton className="h-80" />
                </div>
            </div>
        )
    }

    const pieData = [
        { name: "Active", value: stats?.activeMembers || 0 },
        { name: "Expired", value: stats?.expiredMembers || 0 },
        { name: "Expiring Soon", value: stats?.expiringSoon || 0 },
    ].filter((d) => d.value > 0)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, {session?.user?.name?.split(" ")[0]} 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                    Here&apos;s what&apos;s happening with your gym today
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Members"
                    value={stats?.totalMembers || 0}
                    icon={Users}
                    iconColor="text-violet-600 dark:text-violet-400"
                    description={`${stats?.newThisMonth || 0} new this month`}
                />
                <StatsCard
                    title="Active Members"
                    value={stats?.activeMembers || 0}
                    icon={UserCheck}
                    iconColor="text-emerald-600 dark:text-emerald-400"
                />
                <StatsCard
                    title="Expired"
                    value={stats?.expiredMembers || 0}
                    icon={UserX}
                    iconColor="text-red-500 dark:text-red-400"
                />
                <StatsCard
                    title="Expiring Soon"
                    value={stats?.expiringSoon || 0}
                    icon={Clock}
                    iconColor="text-amber-600 dark:text-amber-400"
                    description="Next 7 days"
                />
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Bar Chart — New Members */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            New Members (Last 6 Months)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {chartData.length === 0 ? (
                            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                                No data available yet
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="month" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Bar dataKey="members" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Pie Chart — Member Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5 text-primary" />
                            Member Status Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pieData.length === 0 ? (
                            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                                No members yet
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Expiring Members Table */}
            {expiringMembers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Members Expiring Soon
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {expiringMembers.map((member: any) => {
                                const daysLeft = getDaysRemaining(member.planEndDate)
                                return (
                                    <div key={member._id} className="flex items-center justify-between py-2 border-b last:border-0">
                                        <div>
                                            <p className="font-medium">{member.name}</p>
                                            <p className="text-sm text-muted-foreground">{member.mobile}</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={daysLeft <= 3 ? "destructive" : "warning"}>
                                                {daysLeft <= 0 ? "Expired" : `${daysLeft} days left`}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Expires: {formatDate(member.planEndDate)}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
