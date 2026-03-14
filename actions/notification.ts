"use server";

import { connectDB } from "@/lib/db";
import { Member } from "@/models/Member";
import { Notification } from "@/models/Notification";
import { sendEmail } from "@/lib/email-service";
import { sendWhatsAppMessage } from "@/lib/whatsapp-service";

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


export async function sendBulkMessage(
    gymId: string,
    memberIds: string[],
    type: "email" | "whatsapp",
    message: string,
    subject?: string
) {
    try {
        await connectDB();

        // Handle potential serialization issues where undefined becomes a string
        const cleanSubject = (subject === "undefined" || subject === "$undefined" || !subject) ? undefined : subject;

        const gym = await (await import("@/models/Gym")).Gym.findById(gymId);
        if (gym?.subscriptionPlan === "free") {
            return { success: false, error: "Messaging is not allowed in the Free Plan. Please upgrade to a paid plan." };
        }

        const members = await Member.find({ _id: { $in: memberIds }, gymId, isDeleted: false });

        let successCount = 0;
        let failCount = 0;

        for (const member of members) {
            let result;
            const recipient = type === "email" ? member.email : member.mobile;

            if (!recipient) {
                failCount++;
                continue;
            }

            if (type === "email") {
                result = await sendEmail({
                    to: recipient,
                    subject: subject || "Message from your Gym",
                    html: `<p>${message}</p>`,
                });
            } else {
                result = await sendWhatsAppMessage({ to: recipient, message });
            }

            // Log notification
            await Notification.create({
                gymId,
                memberId: member._id,
                type,
                category: "bulk_message",
                recipient,
                subject: cleanSubject,
                content: message,
                status: result.success ? "sent" : "failed",
                error: result.success ? undefined : result.error,
            });

            if (result.success) successCount++;
            else failCount++;
        }

        return {
            success: true,
            message: `Sent ${successCount} messages, ${failCount} failed.`,
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function processAutomatedReminders() {
    try {
        await connectDB();
        const now = new Date();
        const warningDays = [10, 5, 1]; // Reminder days before expiry

        let totalSent = 0;

        for (const days of warningDays) {
            const targetDateStart = new Date();
            targetDateStart.setDate(targetDateStart.getDate() + days);
            targetDateStart.setHours(0, 0, 0, 0);

            const targetDateEnd = new Date(targetDateStart);
            targetDateEnd.setHours(23, 59, 59, 999);

            const members = await Member.find({
                isDeleted: false,
                planEndDate: { $gte: targetDateStart, $lte: targetDateEnd },
            }).populate("gymId");

            for (const member of members) {
                const gym = member.gymId as any;
                if (gym?.subscriptionPlan === "free") continue;
                // Check if reminder already sent today for this category
                const existing = await Notification.findOne({
                    memberId: member._id,
                    category: "expiry_reminder",
                    createdAt: {
                        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                });

                if (existing) continue;

                const message = `Hi ${member.name}, your membership at ${(member.gymId as any).name} is expiring in ${days} days on ${member.planEndDate.toLocaleDateString()}. Please renew at your earliest convenience!`;

                // Send Email if available
                if (member.email) {
                    const emailResult = await sendEmail({
                        to: member.email,
                        subject: "Membership Expiry Reminder",
                        html: `<p>${message}</p>`,
                    });

                    await Notification.create({
                        gymId: member.gymId,
                        memberId: member._id,
                        type: "email",
                        category: "expiry_reminder",
                        recipient: member.email,
                        subject: "Membership Expiry Reminder",
                        content: message,
                        status: emailResult.success ? "sent" : "failed",
                        error: emailResult.success ? undefined : emailResult.error,
                    });
                }

                // Send WhatsApp
                const waResult = await sendWhatsAppMessage({
                    to: member.mobile,
                    message,
                });

                await Notification.create({
                    gymId: member.gymId,
                    memberId: member._id,
                    type: "whatsapp",
                    category: "expiry_reminder",
                    recipient: member.mobile,
                    content: message,
                    status: waResult.success ? "sent" : "failed",
                    error: waResult.success ? undefined : waResult.error,
                });

                totalSent++;
            }
        }

        return { success: true, message: `Processed ${totalSent} reminders.` };
    } catch (error: any) {
        console.error("Cron Process Error:", error);
        return { success: false, error: error.message };
    }
}
