import { consumeRateLimit, getApiRateLimitOptions } from "./rateLimit";
import { NextResponse } from "next/server";
import { canAccessApplicationPath, type PortalAccessType } from "./roles";

/** Always pass the user returned by the database-backed session validator. */
export async function authorizeAPIRequest(
  user: { id: number; role: string; portal?: PortalAccessType } | null,
  pathname: string,
  method = "GET",
): Promise<NextResponse | null> {
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessApplicationPath(user.role, user.portal ?? "general", pathname, method)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const rate = await consumeRateLimit(getApiRateLimitOptions(user.id));
    if (!rate.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests" }, {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      });
    }
  } catch (error) {
    console.error("[API rate limit] Store unavailable", error);
    return NextResponse.json({ success: false, error: "Service temporarily unavailable" }, { status: 503 });
  }
  return null;
}

export { parsePositiveIntegerId } from "./roles";
