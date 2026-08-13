import type { Request } from "../http";
import { isIP } from "node:net";

const CITY_LOOKUP_TIMEOUT_MS = 2500;

function requestIp(request: Request): string | null {
  const forwarded = request.headers["x-forwarded-for"];
  const forwardedIps = Array.isArray(forwarded)
    ? forwarded.flatMap((value) => value.split(","))
    : forwarded?.split(",") ?? [];
  const candidates = [
    ...forwardedIps.map((value) => value.trim()),
    request.ip?.trim() ?? "",
  ];

  return candidates.find((candidate) => isIP(candidate) && !isPrivateOrLocalIp(candidate)) ?? null;
}

function isPrivateOrLocalIp(ip: string) {
  if (ip.startsWith("::ffff:")) {
    return isPrivateOrLocalIp(ip.slice("::ffff:".length));
  }
  if (ip === "::1" || ip === "127.0.0.1" || ip === "0.0.0.0") return true;
  if (ip.includes(":")) {
    const normalized = ip.toLowerCase();
    return normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8")
      || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb");
  }
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet))) return true;
  const [first, second] = octets;
  return first === 10
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
    || first === 127;
}

/**
 * Detects only the requester's city. The IP is used for the outbound lookup
 * and is never returned to callers or persisted.
 */
export async function detectCityFromRequest(request: Request): Promise<string | null> {
  const ip = requestIp(request);
  if (!ip || isPrivateOrLocalIp(ip)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CITY_LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const body = await response.json() as { city?: unknown };
    if (typeof body.city !== "string") return null;
    const city = body.city.trim();
    return city && city.length <= 120 ? city : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}