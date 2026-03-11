import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function seed() {
    const MONGODB_URI = process.env.MONGODB_URI;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!MONGODB_URI) {
        console.error("MONGODB_URI is not defined in environment variables");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const AdminModel = mongoose.models.Admin || mongoose.model("Admin", new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            passwordHash: { type: String, required: true },
            name: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
        }));

        const existing = await AdminModel.findOne({ email: ADMIN_EMAIL });
        if (existing) {
            console.log("Admin user already exists");
            process.exit(0);
        }

        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
        await AdminModel.create({
            email: ADMIN_EMAIL,
            passwordHash,
            name: "Super Admin",
        });

        console.log(`Admin user created: ${ADMIN_EMAIL}`);
        process.exit(0);
    } catch (error) {
        console.error("Seed error:", error);
        process.exit(1);
    }
}

seed();
