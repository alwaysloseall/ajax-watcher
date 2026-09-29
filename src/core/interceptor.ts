/**
 * 网络请求拦截器
 * 拦截 XMLHttpRequest 和 fetch API
 */

import type { NetworkRequest, AjaxWatcherOptions } from './types';

type RequestCallback = (request: NetworkRequest) => void;

let originalXHR: typeof XMLHttpRequest | null = null;
let originalFetch: typeof fetch | null = null;
let requestId = 0;

function generateId(): string {
  return `req_${Date.now()}_${++requestId}`;
}

function parseHeaders(headerString: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!headerString) return headers;

  headerString.split('\r\n').forEach((line) => {
    const parts = line.split(': ');
    if (parts.length === 2) {
      headers[parts[0].toLowerCase()] = parts[1];
    }
  });

  return headers;
}

/**
 * 拦截 XMLHttpRequest
 */
export function interceptXHR(
  onRequest: RequestCallback,
  options: Pick<AjaxWatcherOptions, 'console' | 'filter'>
): () => void {
  if (originalXHR) {
    return () => {};
  }

  originalXHR = window.XMLHttpRequest;
  const OriginalXHR = originalXHR;

  const XHRProxy = function (this: XMLHttpRequest) {
    const xhr = new OriginalXHR();
    const request: NetworkRequest = {
      id: generateId(),
      url: '',
      method: '',
      startTime: 0,
      state: 'pending',
      type: 'xhr',
    };

    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    const originalSetRequestHeader = xhr.setRequestHeader;

    const requestHeaders: Record<string, string> = {};

    xhr.open = function (method: string, url: string | URL, ...args: unknown[]) {
      request.method = method.toUpperCase();
      request.url = url.toString();
      return originalOpen.apply(xhr, [method, url, ...args] as Parameters<typeof originalOpen>);
    };

    xhr.setRequestHeader = function (name: string, value: string) {
      requestHeaders[name.toLowerCase()] = value;
      return originalSetRequestHeader.apply(xhr, [name, value]);
    };

    xhr.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      request.startTime = Date.now();
      request.requestHeaders = { ...requestHeaders };
      request.requestBody = body ? String(body) : null;

      if (options.filter && !options.filter(request)) {
        return originalSend.apply(xhr, [body]);
      }

      if (options.console) {
        console.log(`[ajax-watcher] ${request.method} ${request.url}`, {
          headers: request.requestHeaders,
          body: request.requestBody,
        });
      }

      xhr.addEventListener('loadend', () => {
        request.endTime = Date.now();
        request.duration = request.endTime - request.startTime;
        request.status = xhr.status;
        request.statusText = xhr.statusText;
        request.responseHeaders = parseHeaders(xhr.getAllResponseHeaders());
        request.responseType = xhr.responseType || 'text';

        try {
          if (xhr.responseType === '' || xhr.responseType === 'text') {
            request.responseBody = xhr.responseText;
          } else if (xhr.responseType === 'json') {
            request.responseBody = JSON.stringify(xhr.response);
          } else {
            request.responseBody = '[Binary Data]';
          }
        } catch {
          request.responseBody = '[Unable to read response]';
        }

        request.state = xhr.status >= 200 && xhr.status < 400 ? 'completed' : 'error';

        if (options.console) {
          const logMethod = request.state === 'error' ? 'error' : 'log';
          console[logMethod](
            `[ajax-watcher] ${request.method} ${request.url} → ${request.status} (${request.duration}ms)`
          );
        }

        onRequest(request);
      });

      xhr.addEventListener('error', () => {
        request.endTime = Date.now();
        request.duration = request.endTime - request.startTime;
        request.state = 'error';
        request.error = 'Network Error';

        if (options.console) {
          console.error(`[ajax-watcher] ${request.method} ${request.url} → Network Error`);
        }

        onRequest(request);
      });

      xhr.addEventListener('timeout', () => {
        request.endTime = Date.now();
        request.duration = request.endTime - request.startTime;
        request.state = 'error';
        request.error = 'Timeout';

        if (options.console) {
          console.error(`[ajax-watcher] ${request.method} ${request.url} → Timeout`);
        }

        onRequest(request);
      });

      onRequest(request);
      return originalSend.apply(xhr, [body]);
    };

    return xhr;
  } as unknown as typeof XMLHttpRequest;

  XHRProxy.prototype = OriginalXHR.prototype;
  Object.setPrototypeOf(XHRProxy, OriginalXHR);

  (window as { XMLHttpRequest: typeof XMLHttpRequest }).XMLHttpRequest = XHRProxy;

  return () => {
    if (originalXHR) {
      (window as { XMLHttpRequest: typeof XMLHttpRequest }).XMLHttpRequest = originalXHR;
      originalXHR = null;
    }
  };
}

/**
 * 拦截 fetch API
 */
export function interceptFetch(
  onRequest: RequestCallback,
  options: Pick<AjaxWatcherOptions, 'console' | 'filter'>
): () => void {
  if (originalFetch) {
    return () => {};
  }

  originalFetch = window.fetch;
  const OriginalFetch = originalFetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const request: NetworkRequest = {
      id: generateId(),
      url: typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
      method: (init?.method || 'GET').toUpperCase(),
      startTime: Date.now(),
      state: 'pending',
      type: 'fetch',
    };

    if (init?.headers) {
      request.requestHeaders = {};
      const headers = new Headers(init.headers);
      headers.forEach((value, key) => {
        request.requestHeaders![key.toLowerCase()] = value;
      });
    }

    if (init?.body) {
      request.requestBody = typeof init.body === 'string' ? init.body : '[Non-string body]';
    }

    if (options.filter && !options.filter(request)) {
      return OriginalFetch.call(window, input, init);
    }

    if (options.console) {
      console.log(`[ajax-watcher] ${request.method} ${request.url}`, {
        headers: request.requestHeaders,
        body: request.requestBody,
      });
    }

    onRequest(request);

    try {
      const response = await OriginalFetch.call(window, input, init);

      request.endTime = Date.now();
      request.duration = request.endTime - request.startTime;
      request.status = response.status;
      request.statusText = response.statusText;

      request.responseHeaders = {};
      response.headers.forEach((value, key) => {
        request.responseHeaders![key.toLowerCase()] = value;
      });

      const clonedResponse = response.clone();
      try {
        request.responseBody = await clonedResponse.text();
      } catch {
        request.responseBody = '[Unable to read response]';
      }

      request.state = response.ok ? 'completed' : 'error';

      if (options.console) {
        const logMethod = request.state === 'error' ? 'error' : 'log';
        console[logMethod](
          `[ajax-watcher] ${request.method} ${request.url} → ${request.status} (${request.duration}ms)`
        );
      }

      onRequest(request);

      return response;
    } catch (error) {
      request.endTime = Date.now();
      request.duration = request.endTime - request.startTime;
      request.state = 'error';
      request.error = error instanceof Error ? error.message : 'Unknown Error';

      if (options.console) {
        console.error(`[ajax-watcher] ${request.method} ${request.url} → ${request.error}`);
      }

      onRequest(request);
      throw error;
    }
  };

  return () => {
    if (originalFetch) {
      window.fetch = originalFetch;
      originalFetch = null;
    }
  };
}

/**
 * 恢复所有原始实现
 */
export function restoreAll(): void {
  if (originalXHR) {
    (window as { XMLHttpRequest: typeof XMLHttpRequest }).XMLHttpRequest = originalXHR;
    originalXHR = null;
  }
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
}
