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
    password?: string;
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

        // Auto-generate password if not provided
        let rawPassword = validated.password;
        if (!rawPassword) {
            const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
            rawPassword = "";
            for (let i = 0, n = charset.length; i < 8; ++i) {
                rawPassword += charset.charAt(Math.floor(Math.random() * n));
            }
        }

        const passwordHash = await bcrypt.hash(rawPassword, 12);

        const newGym = await Gym.create({
            name: validated.name,
            address: validated.address,
            phone: validated.phone,
            email: validated.email,
            ownerName: validated.ownerName,
            ownerEmail: validated.ownerEmail,
            passwordHash,
        });

        // Send Welcome Email
        const { sendEmail } = await import("@/lib/email-service");
        const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const appIconUrl = `${appUrl}/icons/icon-192x192.png`;

        await sendEmail({
            to: validated.ownerEmail,
            subject: `Welcome to Gym Bro - ${validated.name}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                    <div style="background-color: #0f172a; padding: 32px; text-align: center;">
                        <img src="${appIconUrl}" alt="Gym Bro" style="width: 64px; height: 64px; margin-bottom: 16px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to Gym Bro!</h1>
                    </div>
                    <div style="padding: 32px; color: #334155; line-height: 1.6;">
                        <p style="font-size: 18px; margin-top: 0;">Hello <strong>${validated.ownerName}</strong>,</p>
                        <p>We are thrilled to have <strong>${validated.name}</strong> join the Gym Bro community! Your account has been successfully created and is ready for use.</p>
                        
                        <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px dashed #cbd5e1;">
                            <h2 style="margin-top: 0; font-size: 16px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Your Login Credentials</h2>
                            <p style="margin: 8px 0;"><strong>Email:</strong> ${validated.ownerEmail}</p>
                            <p style="margin: 8px 0;"><strong>Password:</strong> <code style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${rawPassword}</code></p>
                        </div>

                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${appUrl}/login" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Login to Your Dashboard</a>
                        </div>

                        <p>If you have any questions or need assistance setting up your gym, feel free to reply to this email.</p>
                        <p>Stay strong,<br>The Gym Bro Team</p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8;">
                        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Gym Bro. All rights reserved.</p>
                        <p style="margin: 4px 0;">This is an automated message, please do not reply directly to this email unless you need support.</p>
                    </div>
                </div>
            `,
        });

        revalidatePath("/admin/gyms");
        return { success: true, message: "Gym created successfully and welcome email sent" };
    } catch (error: any) {
        console.error("Create Gym Error:", error);
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
