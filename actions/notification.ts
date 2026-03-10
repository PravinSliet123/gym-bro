"use server";

import { connectDB } from "@/lib/db";
import { Member } from "@/models/Member";

export async function getExpiringMembers(gymId: string, days: number = 7) {
    try {
        await connectDB();
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const members = await Member.find({
            gymId,
            isDeleted: false,
            planEndDate: { $gte: now, $lte: futureDate },
        })
            .populate("planId", "name")
            .sort({ planEndDate: 1 })
            .lean();

        return { success: true, data: JSON.parse(JSON.stringify(members)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export function generateWhatsAppLink(mobile: string, message: string): string {
    const cleanNumber = mobile.replace(/\D/g, "");
    const formattedNumber = cleanNumber.startsWith("91") ? cleanNumber : `91${cleanNumber}`;
    return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
}
