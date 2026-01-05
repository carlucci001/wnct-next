import { isSafeUrl } from '@/lib/security';

describe('isSafeUrl', () => {
  it('should allow public https urls', () => {
    expect(isSafeUrl('https://google.com')).toBe(true);
    expect(isSafeUrl('https://example.com/image.png')).toBe(true);
  });

  it('should allow public http urls', () => {
    expect(isSafeUrl('http://example.com')).toBe(true);
  });

  it('should block localhost and loopback', () => {
    expect(isSafeUrl('http://localhost:3000')).toBe(false);
    expect(isSafeUrl('https://localhost')).toBe(false);
    expect(isSafeUrl('http://127.0.0.1')).toBe(false);
    expect(isSafeUrl('http://[::1]')).toBe(false);
    expect(isSafeUrl('http://0.0.0.0')).toBe(false);
  });

  it('should block private IP ranges', () => {
    expect(isSafeUrl('http://192.168.1.1')).toBe(false);
    expect(isSafeUrl('http://10.0.0.1')).toBe(false);
    expect(isSafeUrl('http://172.16.0.1')).toBe(false);
  });

  it('should block non-http protocols', () => {
    expect(isSafeUrl('ftp://example.com')).toBe(false);
    expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
  });

  it('should handle invalid urls gracefully', () => {
    expect(isSafeUrl('not-a-url')).toBe(false);
    expect(isSafeUrl('')).toBe(false);
  });
});
