import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const SECRET_KEY = new TextEncoder().encode(process.env.SECRET_KEY as string);

function logWithTimestamp(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function clearAuthCookies(response: NextResponse) {
  logWithTimestamp("Clearing auth cookies");
  response.cookies.delete("session");
  logWithTimestamp("Session cookie deleted");
  return response;
}

async function validateSession(sessionToken: string) {
  try {
    const { payload } = await jose.jwtVerify(sessionToken, SECRET_KEY);
    const now = Math.floor(Date.now() / 1000);

    if (!payload || !payload.exp || payload.exp < now) {
      logWithTimestamp("Invalid or expired token");
      return null;
    }

    return payload;
  } catch (error) {
    logWithTimestamp("Token validation failed");
    return null;
  }
}

async function handleProtectedRoute(
  request: NextRequest,
  sessionToken: string
) {
  if (!sessionToken) {
    logWithTimestamp("Protected route - no session, redirecting to login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await validateSession(sessionToken);
  if (!payload) {
    logWithTimestamp(
      "Protected route - invalid session, clearing cookies and redirecting to login"
    );
    return clearAuthCookies(
      NextResponse.redirect(new URL("/login", request.url))
    );
  }

  return null;
}

async function handleAdminRoute(request: NextRequest, sessionToken: string) {
  if (!sessionToken) {
    logWithTimestamp("Admin route - no session, redirecting to login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await validateSession(sessionToken);
  if (!payload || payload.role !== "admin") {
    logWithTimestamp("Admin route - unauthorized access, redirecting to home");
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("session")?.value;

  switch (true) {
    case pathname === "/":
      if (!sessionToken) {
        logWithTimestamp("Root path - no session, redirecting to login");
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const rootPayload = await validateSession(sessionToken);
      if (rootPayload) {
        logWithTimestamp("Root path - valid session, redirecting to home");
        return NextResponse.redirect(new URL("/home", request.url));
      }

      logWithTimestamp(
        "Root path - invalid session, clearing cookies and redirecting to login"
      );
      return clearAuthCookies(
        NextResponse.redirect(new URL("/login", request.url))
      );

    case pathname === "/login":
      if (!sessionToken) {
        logWithTimestamp("Login path - no session");
        return NextResponse.next();
      }

      const loginPayload = await validateSession(sessionToken);
      if (loginPayload) {
        logWithTimestamp("Login path - valid session, redirecting to home");
        return NextResponse.redirect(new URL("/home", request.url));
      }

      logWithTimestamp("Login path - invalid session, clearing cookies");
      return clearAuthCookies(NextResponse.next());

    case pathname.startsWith("/home"):
    case pathname.startsWith("/goals"):
      if (sessionToken) {
        return handleProtectedRoute(request, sessionToken);
      } else {
        logWithTimestamp("Protected route - no session, redirecting to login");
        return NextResponse.redirect(new URL("/login", request.url));
      }

    // Special case for goals-analytics - accessible to all authenticated users
    case pathname.startsWith("/admin/goals-analytics"):
      if (sessionToken) {
        const result = await handleProtectedRoute(request, sessionToken);
        if (result) return result; // if there's an error with the session
        return null; // Allow access for any authenticated user
      } else {
        logWithTimestamp("Goals analytics - no session, redirecting to login");
        return NextResponse.redirect(new URL("/login", request.url));
      }

    // All other admin routes require admin role
    case pathname.startsWith("/admin"):
      if (sessionToken) {
        return handleAdminRoute(request, sessionToken);
      } else {
        logWithTimestamp("Admin route - no session, redirecting to login");
        return NextResponse.redirect(new URL("/login", request.url));
      }

    default:
      logWithTimestamp(`Handling path: ${pathname}`);
      return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.*\\.ico|mavn-logo-white.png|mi-favicon-bw-copy.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.png|.*\\.gif).*)",
  ],
};
