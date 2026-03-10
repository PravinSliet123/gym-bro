"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { getMembers, deleteMember } from "@/actions/member"
import { getPlans } from "@/actions/plan"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Search,
    Plus,
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    Users,
    Download,
    MessageCircle,
    Mail,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
} from "lucide-react"
import { formatDate, getMemberStatus, generateWhatsAppLink } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

export default function MembersPage() {
    const { data: session } = useSession()
    const gymId = (session?.user as any)?.gymId
    const router = useRouter()

    const [members, setMembers] = useState<any[]>([])
    const [plans, setPlans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [pages, setPages] = useState(1)
    const [currentPage, setCurrentPage] = useState(1)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [planFilter, setPlanFilter] = useState("")
    const [sortBy, setSortBy] = useState("createdAt")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    const debouncedSearch = useDebounce(search, 300)

    const fetchMembers = useCallback(async () => {
        if (!gymId) return
        setLoading(true)
        const result = await getMembers(gymId, {
            search: debouncedSearch,
            status: statusFilter,
            planId: planFilter,
            sortBy,
            sortOrder,
            page: currentPage,
            limit: 10,
        })
        if (result.success && result.data) {
            setMembers(result.data.members)
            setTotal(result.data.total)
            setPages(result.data.pages)
        }
        setLoading(false)
    }, [gymId, debouncedSearch, statusFilter, planFilter, sortBy, sortOrder, currentPage])

    const fetchPlans = useCallback(async () => {
        if (!gymId) return
        const result = await getPlans(gymId)
        if (result.success) setPlans(result.data || [])
    }, [gymId])

    useEffect(() => { fetchPlans() }, [fetchPlans])
    useEffect(() => { fetchMembers() }, [fetchMembers])

    const handleDelete = async () => {
        if (!deleteId || !gymId) return
        setDeleting(true)
        const result = await deleteMember(deleteId, gymId)
        if (result.success) {
            toast.success(result.message)
            fetchMembers()
        } else {
            toast.error(result.error)
        }
        setDeleteId(null)
        setDeleting(false)
    }

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedIds.length === members.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(members.map((m) => m._id))
        }
    }

    const handleBulkWhatsApp = () => {
        const selected = members.filter((m) => selectedIds.includes(m._id))
        selected.forEach((member) => {
            const link = generateWhatsAppLink(member.mobile, "Hello! This is a message from your gym. Your membership is important to us!")
            window.open(link, "_blank")
        })
    }

    const handleCSVExport = () => {
        const headers = ["Name", "Email", "Mobile", "Plan", "Start Date", "End Date", "Status"]
        const rows = members.map((m) => [
            m.name,
            m.email,
            m.mobile,
            m.planId?.name || "",
            formatDate(m.planStartDate),
            formatDate(m.planEndDate),
            getMemberStatus(m.planEndDate),
        ])
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "members.csv"
        a.click()
        URL.revokeObjectURL(url)
        toast.success("CSV exported successfully")
    }

    const getStatusBadge = (endDate: string) => {
        const status = getMemberStatus(endDate)
        switch (status) {
            case "active":
                return <Badge variant="success">Active</Badge>
            case "expired":
                return <Badge variant="destructive">Expired</Badge>
            case "expiring-soon":
                return <Badge variant="warning">Expiring Soon</Badge>
        }
    }

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortBy(field)
            setSortOrder("asc")
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Members</h1>
                    <p className="text-muted-foreground mt-1">{total} total members</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCSVExport} disabled={members.length === 0}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Link href="/dashboard/members/new">
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Member</Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or mobile..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setCurrentPage(1) }}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v === "all" ? "" : v); setCurrentPage(1) }}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Plan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Plans</SelectItem>
                                {plans.map((plan) => (
                                    <SelectItem key={plan._id} value={plan._id}>{plan.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
                <Card>
                    <CardContent className="p-3 flex items-center gap-3">
                        <span className="text-sm font-medium">{selectedIds.length} selected</span>
                        <Button size="sm" variant="outline" onClick={handleBulkWhatsApp}>
                            <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>
                            Clear
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Members Table (Desktop) */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
            ) : members.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No members found"
                    description={search || statusFilter || planFilter
                        ? "Try adjusting your search or filters"
                        : "Add your first member to get started"}
                    actionLabel={!search && !statusFilter && !planFilter ? "Add Member" : undefined}
                    onAction={!search && !statusFilter && !planFilter ? () => router.push("/dashboard/members/new") : undefined}
                />
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block">
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={selectedIds.length === members.length && members.length > 0}
                                                onCheckedChange={toggleAll}
                                            />
                                        </TableHead>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Mobile</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>
                                            <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("createdAt")}>
                                                Start Date <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead>
                                            <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("expiry")}>
                                                End Date <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.map((member) => (
                                        <TableRow key={member._id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(member._id)}
                                                    onCheckedChange={() => toggleSelect(member._id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={member.profileImage} />
                                                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                            {member.name?.charAt(0)?.toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{member.name}</p>
                                                        {member.email && (
                                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{member.mobile}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{member.planId?.name || "N/A"}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{formatDate(member.planStartDate)}</TableCell>
                                            <TableCell className="text-muted-foreground">{formatDate(member.planEndDate)}</TableCell>
                                            <TableCell>{getStatusBadge(member.planEndDate)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/members/${member._id}`)}>
                                                            <Eye className="mr-2 h-4 w-4" /> View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/members/${member._id}?edit=true`)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            const link = generateWhatsAppLink(member.mobile, "Your membership is expiring soon. Please renew!")
                                                            window.open(link, "_blank")
                                                        }}>
                                                            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(member._id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-3">
                        {members.map((member) => (
                            <Card key={member._id} className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={member.profileImage} />
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {member.name?.charAt(0)?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{member.name}</p>
                                            <p className="text-sm text-muted-foreground">{member.mobile}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(member.planEndDate)}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                    <div>
                                        <p className="text-muted-foreground">Plan</p>
                                        <p className="font-medium">{member.planId?.name || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Expires</p>
                                        <p className="font-medium">{formatDate(member.planEndDate)}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/dashboard/members/${member._id}`)}>
                                        <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const link = generateWhatsAppLink(member.mobile, "Your membership is expiring soon!")
                                        window.open(link, "_blank")
                                    }}>
                                        <MessageCircle className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(member._id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Page {currentPage} of {pages} ({total} members)
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage >= pages}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                >
                                    Next <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Delete Confirm */}
            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                title="Delete Member"
                description="Are you sure you want to delete this member? They can be restored later."
                onConfirm={handleDelete}
                loading={deleting}
            />
        </div>
    )
}
