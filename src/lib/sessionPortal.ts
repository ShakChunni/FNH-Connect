import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { PortalType } from "@/types/auth";

interface SessionTokenPayload extends JwtPayload {
  portal?: string;
}

export function isPortalType(value: string | undefined): value is PortalType {
  return value === "general" || value === "infertility";
}

export function normalizePortal(
  value: string | undefined | null,
  fallback: PortalType = "general",
): PortalType {
  const normalizedValue = value ?? undefined;
  return isPortalType(normalizedValue) ? normalizedValue : fallback;
}

export function getPortalFromSessionToken(
  sessionToken: string | undefined,
  fallback: PortalType = "general",
): PortalType {
  const secretKey = process.env.SECRET_KEY;

  if (!sessionToken || !secretKey) {
    return fallback;
  }

  try {
    const payload = jwt.verify(sessionToken, secretKey);

    if (typeof payload === "string") {
      return fallback;
    }

    const portal = (payload as SessionTokenPayload).portal;
    return normalizePortal(portal, fallback);
  } catch {
    return fallback;
  }
}
