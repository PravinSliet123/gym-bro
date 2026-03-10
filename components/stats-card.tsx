import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    description?: string
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
    iconColor?: string
}

export function StatsCard({ title, value, icon: Icon, description, trend, className, iconColor = "text-primary" }: StatsCardProps) {
    return (
        <Card className={cn("transition-all duration-300 hover:shadow-md", className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold tracking-tight">{value}</p>
                        {description && (
                            <p className="text-xs text-muted-foreground">{description}</p>
                        )}
                        {trend && (
                            <p className={cn("text-xs font-medium", trend.isPositive ? "text-emerald-600" : "text-red-500")}>
                                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </p>
                        )}
                    </div>
                    <div className={cn("rounded-xl bg-primary/10 p-3", iconColor)}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
