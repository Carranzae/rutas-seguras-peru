import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Routes that don't require authentication
const publicRoutes = ["/login", "/register", "/forgot-password"]

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Check if route is public
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.next()
    }

    // Check for auth token in cookies
    const token = request.cookies.get("agency_token")?.value

    // Redirect to login if not authenticated
    if (!token) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
    }

    // TODO: Validate JWT token with backend
    // For now, just check if token exists

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|public).*)",
    ],
}
