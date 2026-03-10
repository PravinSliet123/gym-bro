import mongoose, { Schema, model, models } from "mongoose";

const GymSchema = new Schema(
    {
        name: { type: String, required: true },
        address: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        ownerName: { type: String, required: true },
        ownerEmail: { type: String, required: true },
        passwordHash: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        // SaaS billing (future-ready)
        subscriptionPlan: {
            type: String,
            enum: ["free", "basic", "pro"],
            default: "free",
        },
        subscriptionStatus: {
            type: String,
            enum: ["active", "expired", "cancelled"],
            default: "active",
        },
        subscriptionExpiry: { type: Date },
        memberLimit: { type: Number, default: 50 },
    },
    { timestamps: true }
);

export const Gym = models.Gym || model("Gym", GymSchema);
