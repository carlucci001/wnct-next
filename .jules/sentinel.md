## 2024-03-24 - SSRF Protection via isSafeUrl
**Vulnerability:** The `/api/proxy-image` endpoint was vulnerable to Server-Side Request Forgery (SSRF) as it blindly fetched any provided URL.
**Learning:** URL normalization (e.g., via `new URL()`) and regex-based IP blocking are effective first lines of defense but must handle edge cases like IPv4-mapped IPv6 addresses (e.g., `::ffff:127.0.0.1`) which Node.js normalizes in specific ways.
**Prevention:** Use a centralized `isSafeUrl` validator that blocks localhost, `0.0.0.0`, private IPv4/IPv6 ranges, and IPv4-mapped IPv6 addresses. Ensure regexes account for hex normalization or block the `::ffff:` prefix entirely.
