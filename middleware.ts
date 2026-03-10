import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = request.nextUrl;

    // Public routes
    if (pathname === "/login" || pathname.startsWith("/api/auth")) {
        if (token) {
            const role = (token as any).role;
            if (role === "ADMIN") {
                return NextResponse.redirect(new URL("/admin", request.url));
            }
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.next();
    }

    // Protected routes - redirect to login if not authenticated
    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = (token as any).role;

    // Admin routes - only accessible by admins
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Dashboard routes - only accessible by gym owners
    if (pathname.startsWith("/dashboard") && role !== "GYM_OWNER") {
        return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/dashboard/:path*", "/login"],
};
