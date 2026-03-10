import mongoose, { Schema, model, models } from "mongoose";

const MemberSchema = new Schema(
    {
        gymId: { type: Schema.Types.ObjectId, ref: "Gym", required: true, index: true },
        name: { type: String, required: true },
        email: { type: String, default: "" },
        mobile: { type: String, required: true },
        address: { type: String, default: "" },
        profileImage: { type: String, default: "" },
        planId: { type: Schema.Types.ObjectId, ref: "MembershipPlan", required: true },
        planStartDate: { type: Date, required: true },
        planEndDate: { type: Date, required: true },
        paymentStatus: {
            type: String,
            enum: ["paid", "pending", "overdue"],
            default: "paid",
        },
        notes: { type: String, default: "" },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Compound index for gym isolation and soft delete queries
MemberSchema.index({ gymId: 1, isDeleted: 1 });
MemberSchema.index({ gymId: 1, planEndDate: 1 });

export const Member = models.Member || model("Member", MemberSchema);
