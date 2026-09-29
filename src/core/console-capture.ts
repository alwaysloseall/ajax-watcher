/**
 * 把 console.* 和未捕获异常接到页面内控制台。
 * 仍然会调用原始 console，方便同时在浏览器开发者工具里查看。
 */

export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface ConsoleEntry {
  id: string;
  level: ConsoleLevel;
  time: number;
  text: string;
}

const LEVELS: ConsoleLevel[] = ['log', 'info', 'warn', 'error', 'debug'];

let entrySeq = 0;

export function formatConsoleArg(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || value == null) {
    return String(value);
  }
  if (value instanceof Error) {
    return value.stack || value.message;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function captureConsole(onEntry: (entry: ConsoleEntry) => void): () => void {
  const originals = {} as Record<ConsoleLevel, (...args: unknown[]) => void>;

  const push = (level: ConsoleLevel, args: unknown[]) => {
    onEntry({
      id: `log_${Date.now()}_${++entrySeq}`,
      level,
      time: Date.now(),
      text: args.map(formatConsoleArg).join(' '),
    });
  };

  for (const level of LEVELS) {
    const original = console[level].bind(console);
    originals[level] = original;
    console[level] = ((...args: unknown[]) => {
      original(...args);
      push(level, args);
    }) as Console[ConsoleLevel];
  }

  const onError = (event: ErrorEvent) => {
    const location = event.filename ? ` (${event.filename}:${event.lineno}:${event.colno})` : '';
    push('error', [`${event.message}${location}`]);
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    push('error', ['Unhandled rejection:', event.reason]);
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  return () => {
    for (const level of LEVELS) {
      console[level] = originals[level] as Console[ConsoleLevel];
    }
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}
