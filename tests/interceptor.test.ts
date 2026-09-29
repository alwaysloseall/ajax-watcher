import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { interceptXHR, interceptFetch, restoreAll } from '../src/core/interceptor';
import type { NetworkRequest } from '../src/core/types';

describe('Interceptor Module', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    restoreAll();
    vi.useRealTimers();
  });

  describe('interceptXHR', () => {
    it('should intercept XHR requests', () => {
      const requests: NetworkRequest[] = [];
      const cleanup = interceptXHR(
        (req) => requests.push({ ...req }),
        { console: false, filter: () => true }
      );

      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://example.com/api/test');
      xhr.send();

      expect(requests.length).toBeGreaterThan(0);
      expect(requests[0].url).toBe('https://example.com/api/test');
      expect(requests[0].method).toBe('GET');
      expect(requests[0].type).toBe('xhr');
      expect(requests[0].state).toBe('pending');

      cleanup();
    });

    it('should capture request headers', () => {
      const requests: NetworkRequest[] = [];
      const cleanup = interceptXHR(
        (req) => requests.push({ ...req }),
        { console: false, filter: () => true }
      );

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://example.com/api/test');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Custom', 'value');
      xhr.send('{"test": true}');

      const lastRequest = requests[requests.length - 1];
      expect(lastRequest.requestHeaders).toBeDefined();
      expect(lastRequest.requestHeaders!['content-type']).toBe('application/json');
      expect(lastRequest.requestHeaders!['x-custom']).toBe('value');

      cleanup();
    });

    it('should capture request body', () => {
      const requests: NetworkRequest[] = [];
      const cleanup = interceptXHR(
        (req) => requests.push({ ...req }),
        { console: false, filter: () => true }
      );

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://example.com/api/test');
      xhr.send('test body');

      const lastRequest = requests[requests.length - 1];
      expect(lastRequest.requestBody).toBe('test body');

      cleanup();
    });

    it('should respect filter option', () => {
      const requests: NetworkRequest[] = [];
      const cleanup = interceptXHR(
        (req) => requests.push({ ...req }),
        {
          console: false,
          filter: (req) => !req.url.includes('ignore'),
        }
      );

      const xhr1 = new XMLHttpRequest();
      xhr1.open('GET', 'https://example.com/api/test');
      xhr1.send();

      const xhr2 = new XMLHttpRequest();
      xhr2.open('GET', 'https://example.com/api/ignore');
      xhr2.send();

      const capturedUrls = requests.map((r) => r.url);
      expect(capturedUrls).toContain('https://example.com/api/test');
      expect(capturedUrls).not.toContain('https://example.com/api/ignore');

      cleanup();
    });

    it('should restore original XHR after cleanup', () => {
      const OriginalXHR = window.XMLHttpRequest;
      const cleanup = interceptXHR(
        () => {},
        { console: false, filter: () => true }
      );

      expect(window.XMLHttpRequest).not.toBe(OriginalXHR);

      cleanup();

      expect(window.XMLHttpRequest).toBe(OriginalXHR);
    });
  });

  describe('interceptFetch', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        clone: () => ({
          text: () => Promise.resolve('{"result": "ok"}'),
        }),
      });
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should intercept fetch requests', async () => {
      const requests: NetworkRequest[] = [];
      const cleanup = interceptFetch(
        (req) => requests.push({ ...req }),
        { console: false, filter: () => true }
      );

      await fetch('https://example.com/api/test');

      await vi.runAllTimersAsync();

      expect(requests.length).toBeGreaterThan(0);
      expect(requests[0].url).toBe('https://example.com/api/test');
      expect(requests[0].method).toBe('GET');
      expect(requests[0].type).toBe('fetch');

      cleanup();
    });

    it('should capture POST method and body', async () => {
      const requests: NetworkRequest[] = [];
      const cleanup = interceptFetch(
        (req) => requests.push({ ...req }),
        { console: false, filter: () => true }
      );

      await fetch('https://example.com/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: 'value' }),
      });

      await vi.runAllTimersAsync();

      const postRequests = requests.filter((r) => r.method === 'POST');
      expect(postRequests.length).toBeGreaterThan(0);
      expect(postRequests[0].requestBody).toBe('{"key":"value"}');

      cleanup();
    });

    it('should respect filter option', async () => {
      const requests: NetworkRequest[] = [];
      const cleanup = interceptFetch(
        (req) => requests.push({ ...req }),
        {
          console: false,
          filter: (req) => !req.url.includes('ignore'),
        }
      );

      await fetch('https://example.com/api/test');
      await fetch('https://example.com/api/ignore');

      await vi.runAllTimersAsync();

      const capturedUrls = requests.map((r) => r.url);
      expect(capturedUrls).toContain('https://example.com/api/test');
      expect(capturedUrls).not.toContain('https://example.com/api/ignore');

      cleanup();
    });

    it('should handle fetch errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const requests: NetworkRequest[] = [];
      const cleanup = interceptFetch(
        (req) => requests.push({ ...req }),
        { console: false, filter: () => true }
      );

      try {
        await fetch('https://example.com/api/test');
      } catch {
        // Expected error
      }

      await vi.runAllTimersAsync();

      const errorRequests = requests.filter((r) => r.state === 'error');
      expect(errorRequests.length).toBeGreaterThan(0);
      expect(errorRequests[0].error).toBe('Network error');

      cleanup();
    });
  });

  describe('restoreAll', () => {
    it('should restore both XHR and fetch', () => {
      const OriginalXHR = window.XMLHttpRequest;
      const originalFetch = window.fetch;

      interceptXHR(() => {}, { console: false, filter: () => true });
      interceptFetch(() => {}, { console: false, filter: () => true });

      expect(window.XMLHttpRequest).not.toBe(OriginalXHR);

      restoreAll();

      expect(window.XMLHttpRequest).toBe(OriginalXHR);
    });
  });
});
