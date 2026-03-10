"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { memberSchema, type MemberInput } from "@/lib/validations"
import { getMemberById, updateMember, deleteMember } from "@/actions/member"
import { getPlans } from "@/actions/plan"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ArrowLeft,
    Loader2,
    Pencil,
    Trash2,
    Phone,
    Mail,
    MapPin,
    Calendar,
    CreditCard,
    MessageCircle,
    StickyNote,
} from "lucide-react"
import { formatDate, getMemberStatus, formatCurrency, generateWhatsAppLink } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

export default function MemberDetailPage() {
    const { data: session } = useSession()
    const gymId = (session?.user as any)?.gymId
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const memberId = params.id as string
    const isEditing = searchParams.get("edit") === "true"

    const [member, setMember] = useState<any>(null)
    const [plans, setPlans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editMode, setEditMode] = useState(isEditing)
    const [deleteConfirm, setDeleteConfirm] = useState(false)

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<MemberInput>({
        resolver: zodResolver(memberSchema),
    })

    useEffect(() => {
        if (!gymId) return
        const fetchData = async () => {
            const [memberResult, plansResult] = await Promise.all([
                getMemberById(memberId, gymId),
                getPlans(gymId),
            ])
            if (memberResult.success && memberResult.data) {
                setMember(memberResult.data)
                const m = memberResult.data
                reset({
                    name: m.name,
                    email: m.email || "",
                    mobile: m.mobile,
                    address: m.address || "",
                    planId: m.planId?._id || m.planId,
                    planStartDate: new Date(m.planStartDate).toISOString().split("T")[0],
                    paymentStatus: m.paymentStatus,
                    notes: m.notes || "",
                    profileImage: m.profileImage || "",
                })
            }
            if (plansResult.success) setPlans(plansResult.data || [])
            setLoading(false)
        }
        fetchData()
    }, [gymId, memberId, reset])

    const selectedPlanId = watch("planId")
    const startDate = watch("planStartDate")
    const selectedPlan = plans.find((p) => p._id === selectedPlanId)
    const calculatedEndDate =
        selectedPlan && startDate
            ? new Date(new Date(startDate).getTime() + selectedPlan.durationDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
            : ""

    const onSubmit = async (data: MemberInput) => {
        if (!gymId) return
        setSaving(true)
        try {
            const result = await updateMember(memberId, gymId, data)
            if (result.success) {
                toast.success(result.message)
                setEditMode(false)
                // Refresh member data
                const refreshResult = await getMemberById(memberId, gymId)
                if (refreshResult.success) setMember(refreshResult.data)
            } else {
                toast.error(result.error)
            }
        } catch {
            toast.error("Something went wrong")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!gymId) return
        const result = await deleteMember(memberId, gymId)
        if (result.success) {
            toast.success(result.message)
            router.push("/dashboard/members")
        } else {
            toast.error(result.error)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-96 w-full max-w-2xl" />
            </div>
        )
    }

    if (!member) {
        return (
            <div className="text-center py-16">
                <p className="text-muted-foreground">Member not found</p>
                <Link href="/dashboard/members">
                    <Button variant="outline" className="mt-4">Back to Members</Button>
                </Link>
            </div>
        )
    }

    const status = getMemberStatus(member.planEndDate)

    // View Mode
    if (!editMode) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/members">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold tracking-tight">Member Profile</h1>
                    </div>
                    <Button variant="outline" onClick={() => setEditMode(true)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="outline" className="text-destructive" onClick={() => setDeleteConfirm(true)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Profile Card */}
                    <Card className="lg:col-span-1">
                        <CardContent className="p-6 text-center">
                            <Avatar className="h-24 w-24 mx-auto mb-4">
                                <AvatarImage src={member.profileImage} />
                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                    {member.name?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-xl font-bold">{member.name}</h2>
                            <Badge
                                variant={status === "active" ? "success" : status === "expired" ? "destructive" : "warning"}
                                className="mt-2"
                            >
                                {status === "active" ? "Active" : status === "expired" ? "Expired" : "Expiring Soon"}
                            </Badge>

                            <Separator className="my-4" />

                            <div className="space-y-3 text-left">
                                {member.mobile && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{member.mobile}</span>
                                    </div>
                                )}
                                {member.email && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{member.email}</span>
                                    </div>
                                )}
                                {member.address && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{member.address}</span>
                                    </div>
                                )}
                            </div>

                            <Button
                                className="w-full mt-4"
                                variant="outline"
                                onClick={() => {
                                    const link = generateWhatsAppLink(member.mobile, `Hi ${member.name}, this is a reminder from your gym!`)
                                    window.open(link, "_blank")
                                }}
                            >
                                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Details Cards */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                    Membership Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Plan</p>
                                        <p className="font-medium">{member.planId?.name || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Price</p>
                                        <p className="font-medium">{member.planId?.price ? formatCurrency(member.planId.price) : "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Start Date</p>
                                        <p className="font-medium">{formatDate(member.planStartDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">End Date</p>
                                        <p className="font-medium">{formatDate(member.planEndDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payment Status</p>
                                        <Badge variant={member.paymentStatus === "paid" ? "success" : member.paymentStatus === "pending" ? "warning" : "destructive"}>
                                            {member.paymentStatus}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Joined</p>
                                        <p className="font-medium">{formatDate(member.createdAt)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {member.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <StickyNote className="h-5 w-5 text-primary" />
                                        Notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{member.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                <ConfirmDialog
                    open={deleteConfirm}
                    onOpenChange={setDeleteConfirm}
                    title="Delete Member"
                    description="Are you sure you want to delete this member?"
                    onConfirm={handleDelete}
                />
            </div>
        )
    }

    // Edit Mode
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setEditMode(false)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Member</h1>
                    <p className="text-muted-foreground mt-1">Update member details</p>
                </div>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Member Details</CardTitle>
                    <CardDescription>Update the details below</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" {...register("name")} />
                                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mobile">Mobile *</Label>
                                <Input id="mobile" {...register("mobile")} />
                                {errors.mobile && <p className="text-xs text-destructive">{errors.mobile.message}</p>}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" {...register("email")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" {...register("address")} />
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-base font-semibold mb-4">Membership Details</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Membership Plan *</Label>
                                    <Select value={selectedPlanId} onValueChange={(v) => setValue("planId", v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans.map((plan) => (
                                                <SelectItem key={plan._id} value={plan._id}>
                                                    {plan.name} — ₹{plan.price} ({plan.durationDays} days)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.planId && <p className="text-xs text-destructive">{errors.planId.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Status</Label>
                                    <Select value={watch("paymentStatus")} onValueChange={(v: any) => setValue("paymentStatus", v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="overdue">Overdue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 mt-4">
                                <div className="space-y-2">
                                    <Label>Start Date *</Label>
                                    <Input type="date" {...register("planStartDate")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date (Auto-calculated)</Label>
                                    <Input type="date" value={calculatedEndDate} disabled className="bg-muted" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" {...register("notes")} />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={saving}>
                                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
