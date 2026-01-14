
import { isSafeUrl } from '../../lib/security';

describe('isSafeUrl', () => {
  it('should allow valid public URLs', () => {
    expect(isSafeUrl('https://example.com/image.png')).toBe(true);
    expect(isSafeUrl('http://google.com')).toBe(true);
    expect(isSafeUrl('https://images.unsplash.com/photo-123')).toBe(true);
  });

  it('should block localhost and loopback IPs', () => {
    expect(isSafeUrl('http://localhost:3000')).toBe(false);
    expect(isSafeUrl('http://127.0.0.1')).toBe(false);
    expect(isSafeUrl('http://127.0.0.1:8080')).toBe(false);
    expect(isSafeUrl('http://[::1]')).toBe(false);
    expect(isSafeUrl('http://0.0.0.0')).toBe(false);
  });

  it('should block private IPv4 ranges', () => {
    expect(isSafeUrl('http://10.0.0.1')).toBe(false);
    expect(isSafeUrl('http://10.255.255.255')).toBe(false);
    expect(isSafeUrl('http://192.168.1.1')).toBe(false);
    expect(isSafeUrl('http://172.16.0.1')).toBe(false);
    expect(isSafeUrl('http://172.31.255.255')).toBe(false);
    expect(isSafeUrl('http://169.254.169.254')).toBe(false); // Link-local (cloud metadata)
  });

  it('should block private IPv6 ranges', () => {
    expect(isSafeUrl('http://[fd00::1]')).toBe(false);
    expect(isSafeUrl('http://[fc00::1]')).toBe(false);
    expect(isSafeUrl('http://[fe80::1]')).toBe(false);
    // Compressed forms
    expect(isSafeUrl('http://[fd::1]')).toBe(false);
  });

  it('should block IPv4-mapped IPv6 addresses', () => {
    expect(isSafeUrl('http://[::ffff:127.0.0.1]')).toBe(false);
    expect(isSafeUrl('http://[::ffff:10.0.0.1]')).toBe(false);
    expect(isSafeUrl('http://[::ffff:192.168.1.1]')).toBe(false);
  });

  it('should allow public IPs that look similar to private ones but are not', () => {
    expect(isSafeUrl('http://11.0.0.1')).toBe(true);
    expect(isSafeUrl('http://172.32.0.1')).toBe(true);
    expect(isSafeUrl('http://192.169.1.1')).toBe(true);
  });

  it('should block non-http protocols', () => {
    expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeUrl('ftp://example.com')).toBe(false);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
  });

  it('should handle invalid URLs gracefully', () => {
    expect(isSafeUrl('not-a-url')).toBe(false);
    expect(isSafeUrl('')).toBe(false);
  });
});
