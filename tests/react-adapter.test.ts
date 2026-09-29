import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('react', () => {
  const actualReact = {
    createContext: vi.fn((defaultValue) => ({
      Provider: ({ children, value }: { children: unknown; value: unknown }) => ({
        type: 'Provider',
        props: { children, value },
      }),
      Consumer: ({ children }: { children: (value: unknown) => unknown }) => ({
        type: 'Consumer',
        props: { children },
      }),
      _currentValue: defaultValue,
    })),
    useContext: vi.fn(),
    useState: vi.fn((initial) => {
      const value = typeof initial === 'function' ? initial() : initial;
      return [value, vi.fn()];
    }),
    useEffect: vi.fn((effect) => {
      effect();
    }),
    useCallback: vi.fn((fn) => fn),
    useSyncExternalStore: vi.fn((subscribe, getSnapshot) => getSnapshot()),
  };
  return actualReact;
});

describe('React Adapter Module', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should export useAjaxWatcher hook', async () => {
    const { useAjaxWatcher } = await import('../src/adapters/react.tsx');
    expect(typeof useAjaxWatcher).toBe('function');
  });

  it('should export useNetworkRequests hook', async () => {
    const { useNetworkRequests } = await import('../src/adapters/react.tsx');
    expect(typeof useNetworkRequests).toBe('function');
  });

  it('should export useIsActive hook', async () => {
    const { useIsActive } = await import('../src/adapters/react.tsx');
    expect(typeof useIsActive).toBe('function');
  });

  it('should export AjaxWatcherProvider component', async () => {
    const { AjaxWatcherProvider } = await import('../src/adapters/react.tsx');
    expect(typeof AjaxWatcherProvider).toBe('function');
  });

  it('should export ajaxWatcher instance', async () => {
    const { ajaxWatcher } = await import('../src/adapters/react.tsx');
    expect(ajaxWatcher).toBeDefined();
    expect(typeof ajaxWatcher.open).toBe('function');
    expect(typeof ajaxWatcher.close).toBe('function');
  });

  it('should export type definitions', async () => {
    const module = await import('../src/adapters/react.tsx');
    expect(module.default).toBeDefined();
  });

  describe('useAjaxWatcher hook', () => {
    it('should return watcher control methods', async () => {
      const React = await import('react');
      React.useContext = vi.fn().mockReturnValue(null);
      React.useState = vi.fn()
        .mockReturnValueOnce([false, vi.fn()])
        .mockReturnValueOnce([[], vi.fn()]);
      React.useEffect = vi.fn();
      React.useCallback = vi.fn((fn) => fn);

      const { useAjaxWatcher } = await import('../src/adapters/react.tsx');
      const result = useAjaxWatcher();

      expect(result).toHaveProperty('watcher');
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('requests');
      expect(result).toHaveProperty('open');
      expect(result).toHaveProperty('close');
      expect(result).toHaveProperty('show');
      expect(result).toHaveProperty('hide');
      expect(result).toHaveProperty('toggle');
      expect(result).toHaveProperty('clearRequests');
    });
  });

  describe('useNetworkRequests hook', () => {
    it('should return array of requests', async () => {
      const React = await import('react');
      React.useSyncExternalStore = vi.fn().mockReturnValue([]);
      React.useCallback = vi.fn((fn) => fn);

      const { useNetworkRequests } = await import('../src/adapters/react.tsx');
      const result = useNetworkRequests();

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
