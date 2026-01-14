
/**
 * Security utilities for the application.
 */

/**
 * Validates if a URL is safe to fetch server-side (SSRF protection).
 * Blocks private IPs, localhost, and non-http/https schemes.
 *
 * Note: This function performs string-based validation of the URL.
 * It does not perform DNS resolution, so it cannot prevent DNS rebinding attacks
 * or block domains that resolve to private IPs.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // 1. Check scheme
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // 2. Check hostname
    const hostname = parsedUrl.hostname.toLowerCase();

    // Block localhost
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      return false;
    }

    // Check if hostname is an IPv4 address
    // simple regex for ipv4
    const isIpV4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

    if (isIpV4) {
      // Block private IPv4 ranges
      // 127.0.0.0/8 (Loopback)
      if (hostname.startsWith('127.')) return false;
      // 10.0.0.0/8 (Private)
      if (hostname.startsWith('10.')) return false;
      // 192.168.0.0/16 (Private)
      if (hostname.startsWith('192.168.')) return false;
      // 172.16.0.0/12 (Private) - 172.16.x.x to 172.31.x.x
      if (hostname.startsWith('172.')) {
        const parts = hostname.split('.');
        if (parts.length === 4) {
          const secondOctet = parseInt(parts[1], 10);
          if (secondOctet >= 16 && secondOctet <= 31) return false;
        }
      }
      // 0.0.0.0 (Any)
      if (hostname === '0.0.0.0') return false;
      // 169.254.0.0/16 (Link-local / Cloud metadata)
      if (hostname.startsWith('169.254.')) return false;
    }

    // Block IPv6 Loopback/Private
    // Simple check for IPv6 literals or localhost
    if (hostname === '::1' || hostname === '0:0:0:0:0:0:0:1') return false;
    // Unique Local Address (ULA) fc00::/7
    if (hostname.startsWith('fc') || hostname.startsWith('fd')) return false;

    return true;
  } catch {
    return false;
  }
}
