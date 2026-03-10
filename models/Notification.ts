import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    gymId: mongoose.Types.ObjectId;
    memberId: mongoose.Types.ObjectId;
    type: "email" | "whatsapp";
    category: "expiry_reminder" | "bulk_message" | "manual_reminder";
    recipient: string;
    subject?: string;
    content: string;
    status: "pending" | "sent" | "failed";
    error?: string;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        gymId: { type: Schema.Types.ObjectId, ref: "Gym", required: true },
        memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
        type: { type: String, enum: ["email", "whatsapp"], required: true },
        category: {
            type: String,
            enum: ["expiry_reminder", "bulk_message", "manual_reminder"],
            required: true,
        },
        recipient: { type: String, required: true },
        subject: { type: String },
        content: { type: String, required: true },
        status: {
            type: String,
            enum: ["pending", "sent", "failed"],
            default: "pending",
        },
        error: { type: String },
    },
    { timestamps: true }
);

// Index for checking duplicate expiry reminders in the last 24h
NotificationSchema.index({ memberId: 1, category: 1, createdAt: -1 });

export const Notification =
    mongoose.models.Notification ||
    mongoose.model<INotification>("Notification", NotificationSchema);
