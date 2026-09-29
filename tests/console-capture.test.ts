import { describe, it, expect, afterEach } from 'vitest';
import { captureConsole } from '../src/core/console-capture';

describe('console capture', () => {
  const previous = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  afterEach(() => {
    console.log = previous.log;
    console.info = previous.info;
    console.warn = previous.warn;
    console.error = previous.error;
    console.debug = previous.debug;
  });

  it('shows console output in the page console and still forwards it', () => {
    const forwarded: string[] = [];
    console.log = ((...args: unknown[]) => {
      forwarded.push(args.map((item) => String(item)).join(' '));
    }) as Console['log'];

    const entries: string[] = [];
    const stop = captureConsole((entry) => entries.push(`${entry.level}:${entry.text}`));

    console.log('hello', 1);
    console.error('boom');
    stop();
    console.log('after');

    expect(entries).toEqual(['log:hello 1', 'error:boom']);
    expect(forwarded).toEqual(['hello 1', 'after']);
  });
});
