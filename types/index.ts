export type UserRole = "ADMIN" | "GYM_OWNER";

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    gymId?: string;
}

export interface IGym {
    _id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    ownerName: string;
    ownerEmail: string;
    passwordHash: string;
    isActive: boolean;
    subscriptionPlan: "free" | "basic" | "pro";
    subscriptionStatus: "active" | "expired" | "cancelled";
    subscriptionExpiry?: Date;
    memberLimit: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMembershipPlan {
    _id: string;
    gymId: string;
    name: string;
    price: number;
    durationDays: number;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMember {
    _id: string;
    gymId: string;
    name: string;
    email: string;
    mobile: string;
    address: string;
    profileImage?: string;
    planId: string | IMembershipPlan;
    planStartDate: Date;
    planEndDate: Date;
    paymentStatus: "paid" | "pending" | "overdue";
    notes?: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAdmin {
    _id: string;
    email: string;
    passwordHash: string;
    name: string;
    createdAt: Date;
}

export interface DashboardStats {
    totalMembers: number;
    activeMembers: number;
    expiredMembers: number;
    expiringSoon: number;
    newThisMonth: number;
    revenue: number;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
