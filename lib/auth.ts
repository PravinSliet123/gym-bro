import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import { Admin } from "@/models/Admin";
import { Gym } from "@/models/Gym";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                await connectDB();

                // Check admin first
                const admin = await Admin.findOne({ email: credentials.email });
                if (admin) {
                    const isValid = await bcrypt.compare(credentials.password, admin.passwordHash);
                    if (!isValid) throw new Error("Invalid credentials");
                    return {
                        id: admin._id.toString(),
                        email: admin.email,
                        name: admin.name,
                        role: "ADMIN",
                    };
                }

                // Check gym owner
                const gym = await Gym.findOne({ ownerEmail: credentials.email });
                if (gym) {
                    if (!gym.isActive) throw new Error("Your gym account has been deactivated");
                    const isValid = await bcrypt.compare(credentials.password, gym.passwordHash);
                    if (!isValid) throw new Error("Invalid credentials");
                    return {
                        id: gym._id.toString(),
                        email: gym.ownerEmail,
                        name: gym.ownerName,
                        role: "GYM_OWNER",
                        gymId: gym._id.toString(),
                    };
                }

                throw new Error("No account found with this email");
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.gymId = (user as any).gymId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.sub;
                (session.user as any).role = token.role;
                (session.user as any).gymId = token.gymId;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
