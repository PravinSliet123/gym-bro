import mongoose, { Schema, model, models } from "mongoose";

const AdminSchema = new Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const Admin = models.Admin || model("Admin", AdminSchema);
