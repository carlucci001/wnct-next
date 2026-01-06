import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * Uses strict configuration to only allow safe tags and attributes.
 * Works on both server and client (SSR safe).
 *
 * @param dirty - The potentially unsafe HTML string.
 * @returns The sanitized HTML string.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
      'img', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'figure', 'figcaption'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'src', 'alt', 'title', 'class', 'id', 'width', 'height', 'style'
    ],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout'],
  });
}

/**
 * Validates a URL to ensure it's safe to use (prevent SSRF/XSS).
 *
 * @param url - The URL to check.
 * @returns boolean - True if the URL is safe.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'http://dummy.com'); // Provide base for relative URLs
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
