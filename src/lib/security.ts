/**
 * Validates if a URL is safe to fetch (prevents SSRF).
 * @param urlString The URL to validate
 * @returns boolean True if safe, false if unsafe
 */
export function isSafeUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Only allow http and https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    // Block localhost and private IP ranges
    const hostname = url.hostname.toLowerCase();

    // Block localhost
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      return false;
    }

    // Check for IP addresses
    // This is a basic check. A production robust check would resolve DNS and check the IP.
    // However, this catches direct IP usage.

    // 1. Check for Integer/Hex/Octal IP representations (often used to bypass regex)
    // e.g., 2130706433 = 127.0.0.1, 0x7F000001 = 127.0.0.1, 0177.0.0.1
    // If it looks like a number or hex, it might be an IP.
    if (/^(\d+|0x[0-9a-fA-F]+)$/.test(hostname)) {
      // If it's a pure number/hex, assume it's an IP (or obscure domain) and block it for safety
      // in the context of an image proxy.
      return false;
    }

    // 2. IPv4 private ranges
    // 127.0.0.0/8 (Loopback)
    // 10.0.0.0/8 (Private)
    // 172.16.0.0/12 (Private)
    // 192.168.0.0/16 (Private)
    // 169.254.0.0/16 (Link-local)
    // 0.0.0.0/8 (Current network)

    if (hostname.match(/^127\./) ||
        hostname.match(/^10\./) ||
        hostname.match(/^192\.168\./) ||
        hostname.match(/^169\.254\./) ||
        hostname.match(/^0\./)) {
      return false;
    }

    // Check for 172.16.x.x - 172.31.x.x
    if (hostname.match(/^172\./)) {
      const parts = hostname.split('.');
      const second = parseInt(parts[1], 10);
      if (second >= 16 && second <= 31) {
        return false;
      }
    }

    // IPv6 Loopback
    if (hostname === '[::1]' || hostname === '::1') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
