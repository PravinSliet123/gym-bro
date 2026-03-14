"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { memberSchema, type MemberInput } from "@/lib/validations"
import { createMember } from "@/actions/member"
import { getPlans } from "@/actions/plan"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Camera } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { ImageCapture } from "@/components/image-capture"

export default function NewMemberPage() {
    const { data: session } = useSession()
    const gymId = (session?.user as any)?.gymId
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [plans, setPlans] = useState<any[]>([])

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<MemberInput>({
        resolver: zodResolver(memberSchema),
        defaultValues: {
            paymentStatus: "paid",
            planStartDate: new Date().toISOString().split("T")[0],
        },
    })

    useEffect(() => {
        if (!gymId) return
        const fetchPlans = async () => {
            const result = await getPlans(gymId)
            if (result.success) setPlans(result.data || [])
        }
        fetchPlans()
    }, [gymId])

    const selectedPlanId = watch("planId")
    const startDate = watch("planStartDate")
    const selectedPlan = plans.find((p) => p._id === selectedPlanId)

    const calculatedEndDate = selectedPlan && startDate
        ? new Date(new Date(startDate).getTime() + selectedPlan.durationDays * 24 * 60 * 60 * 1000)
            .toISOString().split("T")[0]
        : ""

    const onSubmit = async (data: MemberInput) => {
        if (!gymId) return
        setIsLoading(true)
        try {
            const result = await createMember(gymId, data)
            if (result.success) {
                toast.success(result.message)
                router.push("/dashboard/members")
            } else {
                toast.error(result.error)
            }
        } catch {
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/members">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add Member</h1>
                    <p className="text-muted-foreground mt-1">Register a new gym member</p>
                </div>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Member Details</CardTitle>
                    <CardDescription>Fill in the details for the new member</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Personal Info */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2 sm:col-span-1">
                                <Label>Profile Picture</Label>
                                <ImageCapture
                                    value={watch("profileImage")}
                                    onChange={(v) => setValue("profileImage", v)}
                                />
                            </div>
                            <div className="space-y-4 sm:col-span-1">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input id="name" placeholder="John Doe" {...register("name")} />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mobile">Mobile *</Label>
                                    <Input id="mobile" placeholder="9876543210" {...register("mobile")} />
                                    {errors.mobile && <p className="text-xs text-destructive">{errors.mobile.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
                                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" placeholder="123 Main St" {...register("address")} />
                            </div>
                        </div>

                        {/* Membership */}
                        <div className="border-t pt-6">
                            <h3 className="text-base font-semibold mb-4">Membership Details</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Membership Plan *</Label>
                                    <Select onValueChange={(v) => setValue("planId", v)}>
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
                                    <Select defaultValue="paid" onValueChange={(v: any) => setValue("paymentStatus", v)}>
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
                                    <Label htmlFor="startDate">Start Date *</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        {...register("planStartDate")}
                                    />
                                    {errors.planStartDate && <p className="text-xs text-destructive">{errors.planStartDate.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date (Auto-calculated)</Label>
                                    <Input type="date" value={calculatedEndDate} disabled className="bg-muted" />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" placeholder="Any additional notes..." {...register("notes")} />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                                ) : (
                                    "Add Member"
                                )}
                            </Button>
                            <Link href="/dashboard/members">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
