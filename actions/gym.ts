"use server";

import { connectDB } from "@/lib/db";
import { Gym } from "@/models/Gym";
import { Member } from "@/models/Member";
import { gymSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createGym(data: {
    name: string;
    address: string;
    phone: string;
    email: string;
    ownerName: string;
    ownerEmail: string;
    password: string;
}) {
    try {
        const validated = gymSchema.parse(data);
        await connectDB();

        const existing = await Gym.findOne({
            $or: [{ email: validated.email }, { ownerEmail: validated.ownerEmail }],
        });
        if (existing) {
            return { success: false, error: "A gym with this email already exists" };
        }

        const passwordHash = await bcrypt.hash(validated.password, 12);

        await Gym.create({
            name: validated.name,
            address: validated.address,
            phone: validated.phone,
            email: validated.email,
            ownerName: validated.ownerName,
            ownerEmail: validated.ownerEmail,
            passwordHash,
        });

        revalidatePath("/admin/gyms");
        return { success: true, message: "Gym created successfully" };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create gym" };
    }
}

export async function getGyms() {
    try {
        await connectDB();
        const gyms = await Gym.find().sort({ createdAt: -1 }).lean();

        // Get member counts for each gym
        const gymsWithCounts = await Promise.all(
            gyms.map(async (gym: any) => {
                const memberCount = await Member.countDocuments({
                    gymId: gym._id,
                    isDeleted: false,
                });
                return {
                    ...gym,
                    _id: gym._id.toString(),
                    memberCount,
                };
            })
        );

        return { success: true, data: JSON.parse(JSON.stringify(gymsWithCounts)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleGymStatus(gymId: string) {
    try {
        await connectDB();
        const gym = await Gym.findById(gymId);
        if (!gym) return { success: false, error: "Gym not found" };

        gym.isActive = !gym.isActive;
        await gym.save();

        revalidatePath("/admin/gyms");
        return {
            success: true,
            message: `Gym ${gym.isActive ? "activated" : "deactivated"} successfully`,
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAdminStats() {
    try {
        await connectDB();
        const totalGyms = await Gym.countDocuments();
        const activeGyms = await Gym.countDocuments({ isActive: true });
        const inactiveGyms = await Gym.countDocuments({ isActive: false });
        const totalMembers = await Member.countDocuments({ isDeleted: false });

        return {
            success: true,
            data: { totalGyms, activeGyms, inactiveGyms, totalMembers },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function resetGymPassword(gymId: string) {
    try {
        await connectDB();
        const gym = await Gym.findById(gymId);
        if (!gym) return { success: false, error: "Gym not found" };

        // Generate a random 8-character password
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let newPassword = "";
        for (let i = 0, n = charset.length; i < 8; ++i) {
            newPassword += charset.charAt(Math.floor(Math.random() * n));
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        gym.passwordHash = passwordHash;
        await gym.save();

        const { sendEmail } = await import("@/lib/email-service");

        const emailResult = await sendEmail({
            to: gym.ownerEmail,
            subject: "Your New Gym Access Password",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset</h2>
                    <p>Hello ${gym.ownerName},</p>
                    <p>Your password for accessing the Gym Bro admin dashboard has been reset.</p>
                    <p>Your new password is: <strong>${newPassword}</strong></p>
                    <p>Please log in and change it as soon as possible.</p>
                </div>
            `,
        });

        if (!emailResult.success) {
            return { success: false, error: "Password updated, but failed to send email: " + emailResult.error };
        }

        return {
            success: true,
            message: "Password reset successfully and sent to owner's email",
            password: newPassword, // Returing to show in UI
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
