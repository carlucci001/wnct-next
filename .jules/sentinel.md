## 2024-02-14 - [SSRF Protection in Next.js API Routes]
**Vulnerability:** Found an unauthenticated SSRF vulnerability in an image proxy route (`/api/proxy-image`).
**Learning:** Next.js API routes are public by default. Developers often forget that server-side `fetch` bypasses browser CORS, allowing access to internal networks.
**Prevention:**
1. Always add authentication (verify tokens/sessions) to API routes performing outbound requests.
2. Validate URLs strictly: allowlist protocols (`http/s`) and deny private IP ranges/localhost.
3. Validate content-type of the response to ensure it's the expected media type (e.g., image).
