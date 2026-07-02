/** @jest-environment node */
import { NextRequest } from 'next/server';

import { getClientIp } from '@/lib/api/client-ip';

// Security fix: rate limiting used the FIRST x-forwarded-for entry, which is
// client-controlled when proxies append (the standard behaviour). Only the
// LAST entry is set by our own reverse proxy and therefore trustworthy.
describe('getClientIp', () => {
  function requestWithXff(xff?: string): NextRequest {
    return new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: xff ? { 'x-forwarded-for': xff } : {},
    });
  }

  it('should return the last entry when x-forwarded-for has multiple entries', () => {
    // Arrange: client spoofed "6.6.6.6", proxy appended the real IP last
    const request = requestWithXff('6.6.6.6, 10.0.0.1, 192.168.1.50');

    // Act + Assert
    expect(getClientIp(request)).toBe('192.168.1.50');
  });

  it('should return the single entry when x-forwarded-for has one entry', () => {
    expect(getClientIp(requestWithXff('203.0.113.7'))).toBe('203.0.113.7');
  });

  it('should trim whitespace around the entry', () => {
    expect(getClientIp(requestWithXff('6.6.6.6 ,  203.0.113.7  '))).toBe('203.0.113.7');
  });

  it('should return "unknown" when the header is missing', () => {
    expect(getClientIp(requestWithXff(undefined))).toBe('unknown');
  });

  it('should return "unknown" when the header is empty', () => {
    expect(getClientIp(requestWithXff(''))).toBe('unknown');
  });

  it('should ignore trailing empty entries', () => {
    expect(getClientIp(requestWithXff('203.0.113.7, '))).toBe('203.0.113.7');
  });
});
