import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ajaxWatcher } from '../src/index';

describe('public watcher API', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    if (ajaxWatcher.isActive()) {
      ajaxWatcher.close();
    }
    ajaxWatcher.clearRequests();
  });

  afterEach(() => {
    if (ajaxWatcher.isActive()) {
      ajaxWatcher.close();
    }
    ajaxWatcher.clearRequests();
  });

  it('keeps getRequests snapshot stable until the list changes', () => {
    ajaxWatcher.open({ keepingTime: 60_000, console: false, autoShow: false });

    const first = ajaxWatcher.getRequests();
    const second = ajaxWatcher.getRequests();
    expect(first).toBe(second);
    expect(first).toEqual([]);
  });

  it('notifies subscribers when debug state or records change', () => {
    const events: string[] = [];
    const unsubscribe = ajaxWatcher.subscribe(() => {
      events.push(ajaxWatcher.isActive() ? 'active' : 'inactive');
    });

    ajaxWatcher.open({ keepingTime: 60_000, console: false, autoShow: false });
    ajaxWatcher.clearRequests();
    ajaxWatcher.close();
    unsubscribe();

    expect(events).toEqual(['active', 'active', 'inactive']);
    expect(ajaxWatcher.getRequests()).toEqual([]);
    expect(ajaxWatcher.getRequests()).toBe(ajaxWatcher.getRequests());
  });
});
