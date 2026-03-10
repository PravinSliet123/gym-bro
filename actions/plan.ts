"use server";

import { connectDB } from "@/lib/db";
import { MembershipPlan } from "@/models/MembershipPlan";
import { planSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createPlan(gymId: string, data: {
    name: string;
    price: number;
    durationDays: number;
    description?: string;
}) {
    try {
        const validated = planSchema.parse(data);
        await connectDB();

        await MembershipPlan.create({
            gymId,
            ...validated,
        });

        revalidatePath("/dashboard/plans");
        return { success: true, message: "Plan created successfully" };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create plan" };
    }
}

export async function getPlans(gymId: string) {
    try {
        await connectDB();
        const plans = await MembershipPlan.find({ gymId }).sort({ createdAt: -1 }).lean();
        return { success: true, data: JSON.parse(JSON.stringify(plans)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updatePlan(planId: string, gymId: string, data: {
    name: string;
    price: number;
    durationDays: number;
    description?: string;
}) {
    try {
        const validated = planSchema.parse(data);
        await connectDB();

        const plan = await MembershipPlan.findOneAndUpdate(
            { _id: planId, gymId },
            validated,
            { new: true }
        );
        if (!plan) return { success: false, error: "Plan not found" };

        revalidatePath("/dashboard/plans");
        return { success: true, message: "Plan updated successfully" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deletePlan(planId: string, gymId: string) {
    try {
        await connectDB();
        const plan = await MembershipPlan.findOneAndDelete({ _id: planId, gymId });
        if (!plan) return { success: false, error: "Plan not found" };

        revalidatePath("/dashboard/plans");
        return { success: true, message: "Plan deleted successfully" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
