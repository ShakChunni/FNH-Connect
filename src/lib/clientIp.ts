/** Only trust forwarded addresses when the deployment explicitly declares its proxy chain. */
export function getClientIP(headers: Headers, trustedHops = process.env.TRUST_PROXY_HOPS): string {
  if (!trustedHops || !/^[1-9]\d*$/.test(trustedHops)) return "unknown";
  const hops = Number(trustedHops);
  const addresses = headers.get("x-forwarded-for")?.split(",").map((ip) => ip.trim()) ?? [];
  if (hops > 20 || addresses.length < hops) return "unknown";
  const ip = addresses[addresses.length - hops];
  // Header values are also used as log keys. Reject delimiters and unbounded input.
  return ip && ip.length <= 45 && /^[\da-fA-F:.]+$/.test(ip) ? ip : "unknown";
}
