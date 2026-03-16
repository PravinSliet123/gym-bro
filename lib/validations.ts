import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const gymSchema = z.object({
    name: z.string().min(2, "Gym name must be at least 2 characters"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    phone: z.string().min(10, "Phone must be at least 10 characters"),
    email: z.string().email("Invalid email address"),
    ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
    ownerEmail: z.string().email("Invalid owner email"),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

export const planSchema = z.object({
    name: z.string().min(2, "Plan name must be at least 2 characters"),
    price: z.number().min(0, "Price must be a positive number"),
    durationDays: z.number().min(1, "Duration must be at least 1 day"),
    description: z.string().optional(),
});

export const memberSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    mobile: z.string().min(10, "Mobile must be at least 10 digits"),
    address: z.string().optional().or(z.literal("")),
    planId: z.string().min(1, "Please select a membership plan"),
    planStartDate: z.string().min(1, "Please select a start date"),
    profileImage: z.string().optional(),
    notes: z.string().optional(),
    paymentStatus: z.enum(["paid", "pending", "overdue"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type GymInput = z.infer<typeof gymSchema>;
export type PlanInput = z.infer<typeof planSchema>;
export type MemberInput = z.infer<typeof memberSchema>;
