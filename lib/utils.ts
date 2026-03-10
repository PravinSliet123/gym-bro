import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function getDaysRemaining(endDate: Date | string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getMemberStatus(endDate: Date | string): "active" | "expired" | "expiring-soon" {
    const days = getDaysRemaining(endDate);
    if (days < 0) return "expired";
    if (days <= 7) return "expiring-soon";
    return "active";
}

export function generateWhatsAppLink(mobile: string, message: string): string {
    const cleanNumber = mobile.replace(/\D/g, "");
    const formattedNumber = cleanNumber.startsWith("91") ? cleanNumber : `91${cleanNumber}`;
    return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
}
