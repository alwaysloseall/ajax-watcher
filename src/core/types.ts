/**
 * ajax-watcher 核心类型定义
 */

export interface AjaxWatcherOptions {
  /**
   * 调试状态持续时间（毫秒）
   * @default 300000 (5分钟)
   */
  keepingTime?: number;

  /**
   * 是否在控制台输出请求日志
   * @default true
   */
  console?: boolean;

  /**
   * 是否自动显示调试面板
   * @default true
   */
  autoShow?: boolean;

  /**
   * 拦截 XMLHttpRequest
   * @default true
   */
  interceptXHR?: boolean;

  /**
   * 拦截 fetch API
   * @default true
   */
  interceptFetch?: boolean;

  /**
   * 最大记录请求数量（防止内存溢出）
   * @default 100
   */
  maxRecords?: number;

  /**
   * 请求过滤器，返回 false 则忽略该请求
   */
  filter?: (request: NetworkRequest) => boolean;

  /**
   * 请求完成时的回调
   */
  onRequest?: (request: NetworkRequest) => void;

  /**
   * 面板位置
   * @default 'bottom-right'
   */
  panelPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  /**
   * 触发按钮位置
   * @default 'bottom-right'
   */
  triggerPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string | null;
  status?: number;
  statusText?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string | null;
  responseType?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
  state: 'pending' | 'completed' | 'error';
  type: 'xhr' | 'fetch';
}

export interface StoredConfig {
  openTime: number;
  settings: Required<Pick<AjaxWatcherOptions, 'keepingTime' | 'console' | 'autoShow'>>;
}

export interface AjaxWatcherInstance {
  /**
   * 开启调试模式
   */
  open(options?: AjaxWatcherOptions): void;

  /**
   * 关闭调试模式
   */
  close(): void;

  /**
   * 获取所有已记录的请求
   */
  getRequests(): NetworkRequest[];

  /**
   * 清除所有记录
   */
  clearRequests(): void;

  /**
   * 检查是否处于调试状态
   */
  isActive(): boolean;

  /**
   * 显示调试面板
   */
  show(): void;

  /**
   * 隐藏调试面板
   */
  hide(): void;

  /**
   * 切换调试面板显示状态
   */
  toggle(): void;

  /**
   * 销毁实例，恢复原始 XHR/fetch
   */
  destroy(): void;

  /**
   * 监听请求事件
   */
  on(event: 'request', callback: (request: NetworkRequest) => void): () => void;

  /**
   * 订阅请求列表或调试开关变化。回调不带参数，读取最新状态请调用 getRequests / isActive。
   */
  subscribe(listener: () => void): () => void;
}

export type EventCallback = (request: NetworkRequest) => void;

export const DEFAULT_OPTIONS: Required<AjaxWatcherOptions> = {
  keepingTime: 5 * 60 * 1000,
  console: true,
  autoShow: true,
  interceptXHR: true,
  interceptFetch: true,
  maxRecords: 100,
  filter: () => true,
  onRequest: () => {},
  panelPosition: 'bottom-right',
  triggerPosition: 'bottom-right',
};
