/**
 * React 18+ 适配器
 *
 * 提供 hooks 和 Provider 模式，与 React 应用无缝集成
 *
 * @example
 * ```tsx
 * // 方式一：直接使用 hook
 * import { useAjaxWatcher } from 'ajax-watcher/react';
 *
 * function DebugPanel() {
 *   const { isActive, open, close, requests } = useAjaxWatcher();
 *   return (
 *     <button onClick={() => isActive ? close() : open()}>
 *       {isActive ? '关闭调试' : '开启调试'}
 *     </button>
 *   );
 * }
 *
 * // 方式二：使用 Provider 自动开启
 * import { AjaxWatcherProvider } from 'ajax-watcher/react';
 *
 * function App() {
 *   return (
 *     <AjaxWatcherProvider autoOpen keepingTime={600000}>
 *       <YourApp />
 *     </AjaxWatcherProvider>
 *   );
 * }
 * ```
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
  type FC,
} from 'react';
import { ajaxWatcher } from '../index';
import type { AjaxWatcherOptions, AjaxWatcherInstance, NetworkRequest } from '../core/types';

export interface AjaxWatcherContextValue {
  watcher: AjaxWatcherInstance;
  isActive: boolean;
  requests: NetworkRequest[];
  open: (options?: AjaxWatcherOptions) => void;
  close: () => void;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  clearRequests: () => void;
}

const AjaxWatcherContext = createContext<AjaxWatcherContextValue | null>(null);

export interface AjaxWatcherProviderProps extends AjaxWatcherOptions {
  children: ReactNode;
  /**
   * 是否在 Provider 挂载时自动开启调试
   * @default false
   */
  autoOpen?: boolean;
}

/**
 * AjaxWatcher Provider 组件
 *
 * 在 React 应用根部使用，自动管理调试生命周期
 */
export const AjaxWatcherProvider: FC<AjaxWatcherProviderProps> = ({
  children,
  autoOpen = false,
  ...options
}) => {
  const [isActive, setIsActive] = useState(() => ajaxWatcher.isActive());
  const [requests, setRequests] = useState<NetworkRequest[]>(() => ajaxWatcher.getRequests());

  useEffect(() => {
    if (autoOpen && !ajaxWatcher.isActive()) {
      ajaxWatcher.open(options);
    }

    const sync = () => {
      setIsActive(ajaxWatcher.isActive());
      setRequests(ajaxWatcher.getRequests());
    };
    sync();
    return ajaxWatcher.subscribe(sync);
  }, [autoOpen]);

  const open = useCallback((opts?: AjaxWatcherOptions) => {
    ajaxWatcher.open({ ...options, ...opts });
    setIsActive(true);
  }, [options]);

  const close = useCallback(() => {
    ajaxWatcher.close();
    setIsActive(false);
    setRequests([]);
  }, []);

  const clearRequests = useCallback(() => {
    ajaxWatcher.clearRequests();
    setRequests([]);
  }, []);

  const value: AjaxWatcherContextValue = {
    watcher: ajaxWatcher,
    isActive,
    requests,
    open,
    close,
    show: ajaxWatcher.show.bind(ajaxWatcher),
    hide: ajaxWatcher.hide.bind(ajaxWatcher),
    toggle: ajaxWatcher.toggle.bind(ajaxWatcher),
    clearRequests,
  };

  return (
    <AjaxWatcherContext.Provider value={value}>
      {children}
    </AjaxWatcherContext.Provider>
  );
};

/**
 * 从 Context 获取 AjaxWatcher
 *
 * 必须在 AjaxWatcherProvider 内部使用
 */
export function useAjaxWatcherContext(): AjaxWatcherContextValue {
  const context = useContext(AjaxWatcherContext);
  if (!context) {
    throw new Error('useAjaxWatcherContext must be used within an AjaxWatcherProvider');
  }
  return context;
}

/**
 * AjaxWatcher 主 Hook
 *
 * 可以独立使用（不需要 Provider），提供完整的调试控制能力
 *
 * @example
 * ```tsx
 * function DebugButton() {
 *   const { isActive, open, close, requests } = useAjaxWatcher();
 *
 *   return (
 *     <div>
 *       <button onClick={() => isActive ? close() : open({ keepingTime: 300000 })}>
 *         {isActive ? '关闭' : '开启'} 调试
 *       </button>
 *       <span>已捕获 {requests.length} 个请求</span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAjaxWatcher(options?: AjaxWatcherOptions): AjaxWatcherContextValue {
  const contextValue = useContext(AjaxWatcherContext);

  const [isActive, setIsActive] = useState(() => ajaxWatcher.isActive());
  const [requests, setRequests] = useState<NetworkRequest[]>(() => ajaxWatcher.getRequests());

  useEffect(() => {
    const sync = () => {
      setIsActive(ajaxWatcher.isActive());
      setRequests(ajaxWatcher.getRequests());
    };
    sync();
    return ajaxWatcher.subscribe(sync);
  }, []);

  const open = useCallback((opts?: AjaxWatcherOptions) => {
    ajaxWatcher.open({ ...options, ...opts });
    setIsActive(true);
  }, [options]);

  const close = useCallback(() => {
    ajaxWatcher.close();
    setIsActive(false);
    setRequests([]);
  }, []);

  const clearRequests = useCallback(() => {
    ajaxWatcher.clearRequests();
    setRequests([]);
  }, []);

  if (contextValue) {
    return contextValue;
  }

  return {
    watcher: ajaxWatcher,
    isActive,
    requests,
    open,
    close,
    show: ajaxWatcher.show.bind(ajaxWatcher),
    hide: ajaxWatcher.hide.bind(ajaxWatcher),
    toggle: ajaxWatcher.toggle.bind(ajaxWatcher),
    clearRequests,
  };
}

/**
 * 订阅网络请求列表
 *
 * 使用 useSyncExternalStore 实现高效更新
 *
 * @example
 * ```tsx
 * function RequestList() {
 *   const requests = useNetworkRequests();
 *   return (
 *     <ul>
 *       {requests.map(req => (
 *         <li key={req.id}>{req.method} {req.url} - {req.status}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useNetworkRequests(): NetworkRequest[] {
  return useSyncExternalStore(
    (onStoreChange) => ajaxWatcher.subscribe(onStoreChange),
    () => ajaxWatcher.getRequests(),
    () => ajaxWatcher.getRequests()
  );
}

/**
 * 监听调试状态变化
 */
export function useIsActive(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => ajaxWatcher.subscribe(onStoreChange),
    () => ajaxWatcher.isActive(),
    () => ajaxWatcher.isActive()
  );
}

export { ajaxWatcher };
export type { AjaxWatcherOptions, AjaxWatcherInstance, NetworkRequest };
export default ajaxWatcher;
