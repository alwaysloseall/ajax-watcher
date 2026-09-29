/**
 * ajax-watcher
 * 轻量级网络请求调试工具，专为移动端/微信等难以调试的环境设计
 *
 * @example
 * ```ts
 * import { ajaxWatcher } from 'ajax-watcher';
 *
 * // 开启调试（5分钟后自动关闭）
 * ajaxWatcher.open();
 *
 * // 自定义配置
 * ajaxWatcher.open({
 *   keepingTime: 10 * 60 * 1000, // 10分钟
 *   autoShow: true,
 *   console: true,
 * });
 *
 * // 手动关闭
 * ajaxWatcher.close();
 * ```
 */

import type {
  AjaxWatcherOptions,
  AjaxWatcherInstance,
  NetworkRequest,
  EventCallback,
} from './core/types';
import { DEFAULT_OPTIONS } from './core/types';
import { saveConfig, clearConfig, tryRestoreConfig, getRemainingTime } from './core/storage';
import { interceptXHR, interceptFetch, restoreAll } from './core/interceptor';
import { captureConsole } from './core/console-capture';
import { Panel } from './ui/panel';

export type { AjaxWatcherOptions, AjaxWatcherInstance, NetworkRequest } from './core/types';

class AjaxWatcher implements AjaxWatcherInstance {
  private options: Required<AjaxWatcherOptions> = { ...DEFAULT_OPTIONS };
  private active = false;
  private panel: Panel | null = null;
  private requests: NetworkRequest[] = [];
  private requestMap: Map<string, NetworkRequest> = new Map();
  private listeners: Set<EventCallback> = new Set();
  private changeListeners: Set<() => void> = new Set();
  private requestSnapshot: NetworkRequest[] = [];
  private cleanupXHR: (() => void) | null = null;
  private cleanupFetch: (() => void) | null = null;
  private cleanupConsole: (() => void) | null = null;
  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.tryAutoRestore();
    }
  }

  open(options?: AjaxWatcherOptions): void {
    if (this.active) {
      console.warn('[ajax-watcher] 已经处于调试状态');
      return;
    }

    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.active = true;

    saveConfig({
      keepingTime: this.options.keepingTime,
      console: this.options.console,
      autoShow: this.options.autoShow,
    });

    this.setupInterceptors();
    this.setupPanel();
    this.installConsole();

    if (this.options.autoShow) {
      this.show();
    }

    this.scheduleAutoClose(this.options.keepingTime);
    this.emitChange();

    if (this.options.console) {
      console.log(
        `[ajax-watcher] 调试已开启，将在 ${Math.round(this.options.keepingTime / 60000)} 分钟后自动关闭`
      );
    }
  }

  close(): void {
    if (!this.active) {
      return;
    }

    this.active = false;
    clearConfig();

    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }

    this.cleanupXHR?.();
    this.cleanupFetch?.();
    this.cleanupConsole?.();
    this.cleanupXHR = null;
    this.cleanupFetch = null;
    this.cleanupConsole = null;

    this.panel?.unmount();
    this.panel = null;
    this.emitChange();

    if (this.options.console) {
      console.log('[ajax-watcher] 调试已关闭');
    }
  }

  getRequests(): NetworkRequest[] {
    return this.requestSnapshot;
  }

  clearRequests(): void {
    this.requests = [];
    this.requestMap.clear();
    this.publishRequests();
  }

  isActive(): boolean {
    return this.active;
  }

  show(): void {
    this.panel?.show();
  }

  hide(): void {
    this.panel?.hide();
  }

  toggle(): void {
    this.panel?.toggle();
  }

  destroy(): void {
    this.close();
    restoreAll();
    this.requests = [];
    this.requestMap.clear();
    this.requestSnapshot = [];
    this.listeners.clear();
    this.changeListeners.clear();
  }

  on(event: 'request', callback: EventCallback): () => void {
    if (event === 'request') {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }
    return () => {};
  }

  subscribe(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  private publishRequests(): void {
    this.requestSnapshot = this.requests.slice();
    this.emitChange();
  }

  private emitChange(): void {
    this.changeListeners.forEach((listener) => listener());
  }

  private tryAutoRestore(): void {
    const config = tryRestoreConfig();
    if (config) {
      this.options = {
        ...DEFAULT_OPTIONS,
        keepingTime: config.settings.keepingTime,
        console: config.settings.console,
        autoShow: config.settings.autoShow,
      };

      this.active = true;
      this.setupInterceptors();
      this.setupPanel();
      this.installConsole();

      if (this.options.autoShow) {
        this.show();
      }

      const remaining = getRemainingTime(config);
      this.scheduleAutoClose(remaining);
      this.emitChange();

      if (this.options.console) {
        console.log(
          `[ajax-watcher] 从存储恢复调试状态，剩余 ${Math.round(remaining / 60000)} 分钟`
        );
      }
    }
  }

  private setupInterceptors(): void {
    const handleRequest = (request: NetworkRequest) => {
      const existing = this.requestMap.get(request.id);
      if (existing) {
        Object.assign(existing, request);
      } else {
        this.requestMap.set(request.id, request);
        this.requests.push(request);

        if (this.requests.length > this.options.maxRecords) {
          const removed = this.requests.shift();
          if (removed) {
            this.requestMap.delete(removed.id);
          }
        }
      }

      this.publishRequests();
      this.panel?.updateRequest(request);
      this.options.onRequest?.(request);
      this.listeners.forEach((cb) => cb(request));
    };

    const interceptorOptions = {
      console: this.options.console,
      filter: this.options.filter,
    };

    if (this.options.interceptXHR) {
      this.cleanupXHR = interceptXHR(handleRequest, interceptorOptions);
    }

    if (this.options.interceptFetch) {
      this.cleanupFetch = interceptFetch(handleRequest, interceptorOptions);
    }
  }

  private setupPanel(): void {
    this.panel = new Panel({
      panelPosition: this.options.panelPosition,
      triggerPosition: this.options.triggerPosition,
      consoleEnabled: this.options.console,
      onClear: () => this.clearRequests(),
    });
    this.panel.mount();
  }

  private installConsole(): void {
    if (!this.options.console) return;
    this.cleanupConsole = captureConsole((entry) => {
      this.panel?.appendLog(entry);
    });
  }

  private scheduleAutoClose(delay: number): void {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
    }

    this.autoCloseTimer = setTimeout(() => {
      if (this.options.console) {
        console.log('[ajax-watcher] 调试时间到期，自动关闭');
      }
      this.close();
    }, delay);
  }
}

export const ajaxWatcher = new AjaxWatcher();

export default ajaxWatcher;

declare global {
  interface Window {
    ajaxWatcher: AjaxWatcherInstance;
    AjaxWatcher: { default: AjaxWatcherInstance; ajaxWatcher: AjaxWatcherInstance };
  }
}

if (typeof window !== 'undefined') {
  window.ajaxWatcher = ajaxWatcher;
}
