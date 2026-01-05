export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol.toLowerCase();

    // Only allow http and https
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname;

    // Remove brackets from IPv6 for checking
    const cleanHostname = hostname.replace(/^\[|\]$/g, '');

    // Block localhost and all-zeros
    if (
        cleanHostname === 'localhost' ||
        cleanHostname === '127.0.0.1' ||
        cleanHostname === '::1' ||
        cleanHostname === '0.0.0.0'
    ) {
      return false;
    }

    // Block private ranges (10.x.x.x, 192.168.x.x, 172.16-31.x.x)
    if (
      /^10\./.test(cleanHostname) ||
      /^192\.168\./.test(cleanHostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanHostname)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
