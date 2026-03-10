"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { getPlans, createPlan, updatePlan, deletePlan } from "@/actions/plan"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { planSchema, type PlanInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, CreditCard, Loader2, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

export default function PlansPage() {
    const { data: session } = useSession()
    const gymId = (session?.user as any)?.gymId
    const [plans, setPlans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<any>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PlanInput>({
        resolver: zodResolver(planSchema),
    })

    const fetchPlans = async () => {
        if (!gymId) return
        const result = await getPlans(gymId)
        if (result.success) setPlans(result.data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchPlans()
    }, [gymId])

    const openCreate = () => {
        setEditingPlan(null)
        reset({ name: "", price: 0, durationDays: 30, description: "" })
        setDialogOpen(true)
    }

    const openEdit = (plan: any) => {
        setEditingPlan(plan)
        setValue("name", plan.name)
        setValue("price", plan.price)
        setValue("durationDays", plan.durationDays)
        setValue("description", plan.description || "")
        setDialogOpen(true)
    }

    const onSubmit = async (data: PlanInput) => {
        if (!gymId) return
        setSubmitting(true)
        try {
            const result = editingPlan
                ? await updatePlan(editingPlan._id, gymId, data)
                : await createPlan(gymId, data)

            if (result.success) {
                toast.success(result.message)
                setDialogOpen(false)
                fetchPlans()
            } else {
                toast.error(result.error)
            }
        } catch {
            toast.error("Something went wrong")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteConfirm || !gymId) return
        setSubmitting(true)
        const result = await deletePlan(deleteConfirm, gymId)
        if (result.success) {
            toast.success(result.message)
            fetchPlans()
        } else {
            toast.error(result.error)
        }
        setDeleteConfirm(null)
        setSubmitting(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Membership Plans</h1>
                    <p className="text-muted-foreground mt-1">Create and manage membership plans for your gym</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Create Plan
                </Button>
            </div>

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52" />)}
                </div>
            ) : plans.length === 0 ? (
                <EmptyState
                    icon={CreditCard}
                    title="No plans yet"
                    description="Create your first membership plan to start enrolling members"
                    actionLabel="Create Plan"
                    onAction={openCreate}
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <Card key={plan._id} className="group transition-all duration-300 hover:shadow-md relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50" />
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(plan)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(plan._id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                {plan.description && (
                                    <CardDescription>{plan.description}</CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end gap-1 mb-4">
                                    <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                                </div>
                                <Badge variant="secondary" className="gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {plan.durationDays} days
                                </Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? "Edit Plan" : "Create Plan"}</DialogTitle>
                        <DialogDescription>
                            {editingPlan
                                ? "Update the details of this membership plan"
                                : "Create a new membership plan for your gym"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="plan-name">Plan Name</Label>
                            <Input id="plan-name" placeholder="e.g. Monthly Plan" {...register("name")} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="grid gap-4 grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (₹)</Label>
                                <Input id="price" type="number" placeholder="1000" {...register("price", { valueAsNumber: true })} />
                                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (Days)</Label>
                                <Input id="duration" type="number" placeholder="30" {...register("durationDays", { valueAsNumber: true })} />
                                {errors.durationDays && <p className="text-xs text-destructive">{errors.durationDays.message}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" placeholder="Optional description..." {...register("description")} />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {editingPlan ? "Update" : "Create"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <ConfirmDialog
                open={!!deleteConfirm}
                onOpenChange={() => setDeleteConfirm(null)}
                title="Delete Plan"
                description="Are you sure you want to delete this plan? This action cannot be undone."
                onConfirm={handleDelete}
                loading={submitting}
            />
        </div>
    )
}
