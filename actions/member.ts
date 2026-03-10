"use server";

import { connectDB } from "@/lib/db";
import { Member } from "@/models/Member";
import { MembershipPlan } from "@/models/MembershipPlan";
import { memberSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";

export async function createMember(gymId: string, data: {
    name: string;
    email?: string;
    mobile: string;
    address?: string;
    planId: string;
    planStartDate: string;
    profileImage?: string;
    notes?: string;
    paymentStatus?: "paid" | "pending" | "overdue";
}) {
    try {
        const validated = memberSchema.parse(data);
        await connectDB();

        // Get plan to calculate end date
        const plan = await MembershipPlan.findOne({ _id: validated.planId, gymId });
        if (!plan) return { success: false, error: "Invalid membership plan" };

        const startDate = new Date(validated.planStartDate);
        const endDate = addDays(startDate, plan.durationDays);

        await Member.create({
            gymId,
            name: validated.name,
            email: validated.email || "",
            mobile: validated.mobile,
            address: validated.address || "",
            profileImage: validated.profileImage || "",
            planId: validated.planId,
            planStartDate: startDate,
            planEndDate: endDate,
            paymentStatus: validated.paymentStatus || "paid",
            notes: validated.notes || "",
        });

        revalidatePath("/dashboard/members");
        return { success: true, message: "Member added successfully" };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to add member" };
    }
}

export async function getMembers(
    gymId: string,
    options: {
        search?: string;
        status?: string;
        planId?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
        page?: number;
        limit?: number;
    } = {}
) {
    try {
        await connectDB();
        const {
            search = "",
            status = "",
            planId = "",
            sortBy = "createdAt",
            sortOrder = "desc",
            page = 1,
            limit = 10,
        } = options;

        const query: any = { gymId, isDeleted: false };

        // Search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { mobile: { $regex: search, $options: "i" } },
            ];
        }

        // Filter by plan
        if (planId) {
            query.planId = planId;
        }

        // Filter by status
        const now = new Date();
        const sevenDays = new Date();
        sevenDays.setDate(sevenDays.getDate() + 7);

        if (status === "active") {
            query.planEndDate = { $gt: sevenDays };
        } else if (status === "expired") {
            query.planEndDate = { $lt: now };
        } else if (status === "expiring-soon") {
            query.planEndDate = { $gte: now, $lte: sevenDays };
        }

        // Sort
        const sort: any = {};
        if (sortBy === "expiry") {
            sort.planEndDate = sortOrder === "asc" ? 1 : -1;
        } else if (sortBy === "name") {
            sort.name = sortOrder === "asc" ? 1 : -1;
        } else {
            sort.createdAt = sortOrder === "asc" ? 1 : -1;
        }

        const skip = (page - 1) * limit;
        const total = await Member.countDocuments(query);
        const members = await Member.find(query)
            .populate("planId", "name price durationDays")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        return {
            success: true,
            data: {
                members: JSON.parse(JSON.stringify(members)),
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getMemberById(memberId: string, gymId: string) {
    try {
        await connectDB();
        const member = await Member.findOne({ _id: memberId, gymId, isDeleted: false })
            .populate("planId")
            .lean();
        if (!member) return { success: false, error: "Member not found" };
        return { success: true, data: JSON.parse(JSON.stringify(member)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateMember(
    memberId: string,
    gymId: string,
    data: {
        name: string;
        email?: string;
        mobile: string;
        address?: string;
        planId: string;
        planStartDate: string;
        profileImage?: string;
        notes?: string;
        paymentStatus?: "paid" | "pending" | "overdue";
    }
) {
    try {
        const validated = memberSchema.parse(data);
        await connectDB();

        const plan = await MembershipPlan.findOne({ _id: validated.planId, gymId });
        if (!plan) return { success: false, error: "Invalid membership plan" };

        const startDate = new Date(validated.planStartDate);
        const endDate = addDays(startDate, plan.durationDays);

        const member = await Member.findOneAndUpdate(
            { _id: memberId, gymId, isDeleted: false },
            {
                name: validated.name,
                email: validated.email || "",
                mobile: validated.mobile,
                address: validated.address || "",
                profileImage: validated.profileImage,
                planId: validated.planId,
                planStartDate: startDate,
                planEndDate: endDate,
                paymentStatus: validated.paymentStatus || "paid",
                notes: validated.notes || "",
            },
            { new: true }
        );
        if (!member) return { success: false, error: "Member not found" };

        revalidatePath("/dashboard/members");
        revalidatePath(`/dashboard/members/${memberId}`);
        return { success: true, message: "Member updated successfully" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteMember(memberId: string, gymId: string) {
    try {
        await connectDB();
        const member = await Member.findOneAndUpdate(
            { _id: memberId, gymId },
            { isDeleted: true },
            { new: true }
        );
        if (!member) return { success: false, error: "Member not found" };

        revalidatePath("/dashboard/members");
        return { success: true, message: "Member deleted successfully" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getDashboardStats(gymId: string) {
    try {
        await connectDB();
        const now = new Date();
        const sevenDays = new Date();
        sevenDays.setDate(sevenDays.getDate() + 7);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [totalMembers, activeMembers, expiredMembers, expiringSoon, newThisMonth] =
            await Promise.all([
                Member.countDocuments({ gymId, isDeleted: false }),
                Member.countDocuments({ gymId, isDeleted: false, planEndDate: { $gt: now } }),
                Member.countDocuments({ gymId, isDeleted: false, planEndDate: { $lt: now } }),
                Member.countDocuments({
                    gymId,
                    isDeleted: false,
                    planEndDate: { $gte: now, $lte: sevenDays },
                }),
                Member.countDocuments({
                    gymId,
                    isDeleted: false,
                    createdAt: { $gte: startOfMonth },
                }),
            ]);

        return {
            success: true,
            data: {
                totalMembers,
                activeMembers,
                expiredMembers,
                expiringSoon,
                newThisMonth,
                revenue: 0,
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getMonthlyMemberData(gymId: string) {
    try {
        await connectDB();
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const data = await Member.aggregate([
            {
                $match: {
                    gymId: { $eq: new (await import("mongoose")).Types.ObjectId(gymId) },
                    isDeleted: false,
                    createdAt: { $gte: sixMonthsAgo },
                },
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const chartData = data.map((item: any) => ({
            month: months[item._id.month - 1],
            members: item.count,
        }));

        return { success: true, data: chartData };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getExpiringMembersData(gymId: string) {
    try {
        await connectDB();
        const now = new Date();
        const thirtyDays = new Date();
        thirtyDays.setDate(thirtyDays.getDate() + 30);

        const members = await Member.find({
            gymId,
            isDeleted: false,
            planEndDate: { $gte: now, $lte: thirtyDays },
        })
            .populate("planId", "name")
            .sort({ planEndDate: 1 })
            .limit(10)
            .lean();

        return { success: true, data: JSON.parse(JSON.stringify(members)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
