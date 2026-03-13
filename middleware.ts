import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const { pathname } = req.nextUrl;

        // Public routes
        if (pathname === "/login") {
            if (token) {
                const role = (token as any).role;
                if (role === "ADMIN") {
                    return NextResponse.redirect(new URL("/admin", req.url));
                }
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }
            return NextResponse.next();
        }

        // We don't need !token check here because `authorized` callback below 
        // handles redirecting unauthenticated users automatically.
        const role = (token as any)?.role;

        // Admin routes - only accessible by admins
        if (pathname.startsWith("/admin") && role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        // Dashboard routes - only accessible by gym owners
        if (pathname.startsWith("/dashboard") && role !== "GYM_OWNER") {
            return NextResponse.redirect(new URL("/admin", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                const { pathname } = req.nextUrl;
                // Allow public routes. The middleware function will handle redirect if they are logged in.
                if (pathname === "/login" || pathname.startsWith("/api/auth")) {
                    return true;
                }
                // Require a token for everything else matched by config
                return !!token;
            },
        },
        pages: {
            signIn: "/login",
        },
        secret: process.env.NEXTAUTH_SECRET,
    }
);

export const config = {
    matcher: ["/admin/:path*", "/dashboard/:path*", "/login"],
};
