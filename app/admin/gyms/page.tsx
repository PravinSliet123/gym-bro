"use client"

import { useEffect, useState } from "react"
import { getGyms, toggleGymStatus } from "@/actions/gym"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Building2, Plus, Users } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function GymsPage() {
    const [gyms, setGyms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchGyms = async () => {
        const result = await getGyms()
        if (result.success) {
            setGyms(result.data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchGyms()
    }, [])

    const handleToggle = async (gymId: string) => {
        const result = await toggleGymStatus(gymId)
        if (result.success) {
            toast.success(result.message)
            fetchGyms()
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">All Gyms</h1>
                    <p className="text-muted-foreground mt-1">Manage gym accounts on the platform</p>
                </div>
                <Link href="/admin/create-gym">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Gym
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Gym List</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : gyms.length === 0 ? (
                        <EmptyState
                            icon={Building2}
                            title="No gyms yet"
                            description="Create your first gym to get started"
                            actionLabel="Create Gym"
                            onAction={() => window.location.href = "/admin/create-gym"}
                        />
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Gym Name</TableHead>
                                            <TableHead>Owner</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Members</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {gyms.map((gym) => (
                                            <TableRow key={gym._id}>
                                                <TableCell className="font-medium">{gym.name}</TableCell>
                                                <TableCell>{gym.ownerName}</TableCell>
                                                <TableCell className="text-muted-foreground">{gym.ownerEmail}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {gym.memberCount}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={gym.isActive ? "success" : "destructive"}>
                                                        {gym.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant={gym.isActive ? "outline" : "default"}
                                                        size="sm"
                                                        onClick={() => handleToggle(gym._id)}
                                                    >
                                                        {gym.isActive ? "Deactivate" : "Activate"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-3">
                                {gyms.map((gym) => (
                                    <Card key={gym._id} className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold">{gym.name}</h3>
                                            <Badge variant={gym.isActive ? "success" : "destructive"}>
                                                {gym.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1 text-sm text-muted-foreground mb-3">
                                            <p>Owner: {gym.ownerName}</p>
                                            <p>Email: {gym.ownerEmail}</p>
                                            <p className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5" /> {gym.memberCount} members
                                            </p>
                                        </div>
                                        <Button
                                            variant={gym.isActive ? "outline" : "default"}
                                            size="sm"
                                            className="w-full"
                                            onClick={() => handleToggle(gym._id)}
                                        >
                                            {gym.isActive ? "Deactivate" : "Activate"}
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
