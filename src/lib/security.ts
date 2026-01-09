
/**
 * Security utilities for the application.
 */

/**
 * Checks if a URL is safe to be fetched server-side (SSRF protection).
 * Blocks private IP ranges, localhost, and non-http/https protocols.
 *
 * @param urlString The URL to check
 * @returns boolean True if the URL is considered safe
 */
export function isSafeUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Only allow http and https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    const hostname = url.hostname;

    // Check for localhost and general blocklist
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '0.0.0.0') {
      return false;
    }

    // IPv4 checks
    if (hostname.match(/^127\.\d+\.\d+\.\d+$/)) return false;
    if (hostname.match(/^10\.\d+\.\d+\.\d+$/)) return false;
    if (hostname.match(/^192\.168\.\d+\.\d+$/)) return false;
    if (hostname.match(/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/)) return false;
    if (hostname.match(/^169\.254\.\d+\.\d+$/)) return false;

    // IPv6 checks
    // Remove square brackets for IPv6 checks
    let ipv6 = hostname.startsWith('[') && hostname.endsWith(']')
      ? hostname.slice(1, -1)
      : hostname;

    // Handle IPv4-mapped IPv6 addresses (e.g., ::ffff:127.0.0.1)
    // Note: Node's URL parser converts ::ffff:127.0.0.1 to ::ffff:7f00:1 (hex)
    // So we need to be careful.
    // Actually, simple check for ::ffff: prefix is good, but we need to check the suffix.
    // If it starts with ::ffff:, it IS an IPv4 mapped address, and we should treat it as potentially private if we can't easily decode it back to IPv4 string to regex against.
    // But since this is a security filter, we can be aggressive and block *all* IPv4-mapped IPv6 addresses if they are used to obscure internal IPs.
    // However, public IPv4s can also be mapped.
    // The issue is decoding the hex part back to decimal for the regex check.

    // Simpler approach: If it starts with ::ffff:, block it.
    // Wait, that blocks valid public IPs if mapped.
    // Is that acceptable? Usually `fetch` uses IPv4 if available. Using IPv4-mapped IPv6 is rare for legitimate public URLs unless specific needs.
    // But let's try to decode if possible.

    if (ipv6.toLowerCase().startsWith('::ffff:')) {
       // It could be ::ffff:1.2.3.4 OR ::ffff:102:304 (hex)
       // Node seems to convert to hex.
       // Let's block ::ffff: entirely for now as "small security fix" to be safe against obfuscation,
       // unless we want to implement full hex->ip parsing which exceeds 50 lines.
       // Blocking ::ffff: is a safe default for an SSRF filter on a web app that shouldn't need to talk to weirdly formatted public IPs.
       return false;
    }

    // fc00::/7 (Unique Local Address) -> starts with fc or fd
    if (ipv6.match(/^[fF][cCdD][0-9a-fA-F]*:/)) return false;
    // fe80::/10 (Link-local) -> starts with fe8, fe9, fea, feb
    if (ipv6.match(/^[fF][eE][89abAB][0-9a-fA-F]*:/)) return false;

    return true;
  } catch (error) {
    return false;
  }
}
