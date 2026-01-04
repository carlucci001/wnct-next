import { isSafeUrl } from '../../lib/security';

describe('isSafeUrl', () => {
  test('allows safe URLs', () => {
    expect(isSafeUrl('https://example.com/image.png')).toBe(true);
    expect(isSafeUrl('http://google.com/logo.jpg')).toBe(true);
    expect(isSafeUrl('https://subdomain.example.co.uk/path?query=1')).toBe(true);
  });

  test('blocks invalid URLs', () => {
    expect(isSafeUrl('not-a-url')).toBe(false);
    expect(isSafeUrl('ftp://example.com/file')).toBe(false);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
  });

  test('blocks obscure IP formats', () => {
    expect(isSafeUrl('http://2130706433')).toBe(false); // Integer for 127.0.0.1
    expect(isSafeUrl('http://0x7F000001')).toBe(false); // Hex for 127.0.0.1
    expect(isSafeUrl('http://017700000001')).toBe(false); // Octal for 127.0.0.1
  });

  test('blocks localhost', () => {
    expect(isSafeUrl('http://localhost:3000')).toBe(false);
    expect(isSafeUrl('http://localhost/foo')).toBe(false);
    expect(isSafeUrl('https://sub.localhost')).toBe(false);
  });

  test('blocks private IPv4 ranges', () => {
    // 127.0.0.0/8
    expect(isSafeUrl('http://127.0.0.1/')).toBe(false);
    expect(isSafeUrl('http://127.0.0.1:8080/')).toBe(false);

    // 10.0.0.0/8
    expect(isSafeUrl('http://10.0.0.1/')).toBe(false);
    expect(isSafeUrl('http://10.255.255.255/')).toBe(false);

    // 192.168.0.0/16
    expect(isSafeUrl('http://192.168.1.1/')).toBe(false);
    expect(isSafeUrl('http://192.168.0.254/')).toBe(false);

    // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    expect(isSafeUrl('http://172.16.0.1/')).toBe(false);
    expect(isSafeUrl('http://172.31.255.255/')).toBe(false);

    // 169.254.0.0/16
    expect(isSafeUrl('http://169.254.169.254/')).toBe(false);
  });

  test('allows public IPs', () => {
    expect(isSafeUrl('http://8.8.8.8/')).toBe(true);
    expect(isSafeUrl('http://1.1.1.1/')).toBe(true);

    // 172.x ranges outside private block
    expect(isSafeUrl('http://172.15.0.1/')).toBe(true); // < 16
    expect(isSafeUrl('http://172.32.0.1/')).toBe(true); // > 31
  });

  test('blocks IPv6 loopback', () => {
    expect(isSafeUrl('http://[::1]/')).toBe(false);
  });
});
