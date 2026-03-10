import mongoose, { Schema, model, models } from "mongoose";

const MembershipPlanSchema = new Schema(
    {
        gymId: { type: Schema.Types.ObjectId, ref: "Gym", required: true, index: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        durationDays: { type: Number, required: true },
        description: { type: String, default: "" },
    },
    { timestamps: true }
);

export const MembershipPlan = models.MembershipPlan || model("MembershipPlan", MembershipPlanSchema);
