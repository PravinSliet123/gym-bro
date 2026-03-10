"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { gymSchema, type GymInput } from "@/lib/validations"
import { createGym } from "@/actions/gym"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function CreateGymPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<GymInput>({
        resolver: zodResolver(gymSchema),
    })

    const onSubmit = async (data: GymInput) => {
        setIsLoading(true)
        try {
            const result = await createGym(data)
            if (result.success) {
                toast.success(result.message)
                router.push("/admin/gyms")
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
                <Link href="/admin/gyms">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Gym</h1>
                    <p className="text-muted-foreground mt-1">Register a new gym on the platform</p>
                </div>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Gym Details</CardTitle>
                    <CardDescription>Fill in the details for the new gym account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Gym Name</Label>
                                <Input id="name" placeholder="Iron Paradise Gym" {...register("name")} />
                                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" placeholder="+91 98765 43210" {...register("phone")} />
                                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Gym Email</Label>
                            <Input id="email" type="email" placeholder="gym@example.com" {...register("email")} />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" placeholder="123 Main St, City" {...register("address")} />
                            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-base font-semibold mb-4">Owner Information</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="ownerName">Owner Name</Label>
                                    <Input id="ownerName" placeholder="John Doe" {...register("ownerName")} />
                                    {errors.ownerName && <p className="text-xs text-destructive">{errors.ownerName.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ownerEmail">Owner Email (Login)</Label>
                                    <Input id="ownerEmail" type="email" placeholder="owner@example.com" {...register("ownerEmail")} />
                                    {errors.ownerEmail && <p className="text-xs text-destructive">{errors.ownerEmail.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2 mt-4">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
                                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Gym"
                                )}
                            </Button>
                            <Link href="/admin/gyms">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
