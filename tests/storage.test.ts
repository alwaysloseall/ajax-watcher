import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveConfig,
  loadConfig,
  clearConfig,
  isConfigValid,
  getRemainingTime,
  tryRestoreConfig,
} from '../src/core/storage';
import type { StoredConfig } from '../src/core/types';

describe('Storage Module', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('saveConfig', () => {
    it('should save config to localStorage', () => {
      const options = {
        keepingTime: 300000,
        console: true,
        autoShow: true,
      };

      saveConfig(options);

      const stored = localStorage.getItem('ajax-watcher');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.settings).toEqual(options);
      expect(parsed.openTime).toBeTypeOf('number');
    });

    it('should include current timestamp as openTime', () => {
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      saveConfig({
        keepingTime: 300000,
        console: true,
        autoShow: true,
      });

      const stored = JSON.parse(localStorage.getItem('ajax-watcher')!);
      expect(stored.openTime).toBe(Date.now());
    });
  });

  describe('loadConfig', () => {
    it('should return null when no config exists', () => {
      expect(loadConfig()).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('ajax-watcher', 'invalid json');
      expect(loadConfig()).toBeNull();
    });

    it('should return null for incomplete config', () => {
      localStorage.setItem('ajax-watcher', JSON.stringify({ openTime: 123 }));
      expect(loadConfig()).toBeNull();
    });

    it('should return valid config', () => {
      const config: StoredConfig = {
        openTime: Date.now(),
        settings: {
          keepingTime: 300000,
          console: true,
          autoShow: true,
        },
      };

      localStorage.setItem('ajax-watcher', JSON.stringify(config));

      const loaded = loadConfig();
      expect(loaded).toEqual(config);
    });
  });

  describe('clearConfig', () => {
    it('should remove config from localStorage', () => {
      localStorage.setItem('ajax-watcher', 'test');
      clearConfig();
      expect(localStorage.getItem('ajax-watcher')).toBeNull();
    });
  });

  describe('isConfigValid', () => {
    it('should return true for non-expired config', () => {
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      const config: StoredConfig = {
        openTime: Date.now(),
        settings: {
          keepingTime: 300000,
          console: true,
          autoShow: true,
        },
      };

      expect(isConfigValid(config)).toBe(true);
    });

    it('should return false for expired config', () => {
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      const config: StoredConfig = {
        openTime: Date.now() - 400000,
        settings: {
          keepingTime: 300000,
          console: true,
          autoShow: true,
        },
      };

      expect(isConfigValid(config)).toBe(false);
    });

    it('should return true when exactly at expiry time', () => {
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
      const now = Date.now();

      const config: StoredConfig = {
        openTime: now - 299999,
        settings: {
          keepingTime: 300000,
          console: true,
          autoShow: true,
        },
      };

      expect(isConfigValid(config)).toBe(true);
    });
  });

  describe('getRemainingTime', () => {
    it('should return correct remaining time', () => {
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      const config: StoredConfig = {
        openTime: Date.now() - 100000,
        settings: {
          keepingTime: 300000,
          console: true,
          autoShow: true,
        },
      };

      expect(getRemainingTime(config)).toBe(200000);
    });

    it('should return 0 for expired config', () => {
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      const config: StoredConfig = {
        openTime: Date.now() - 400000,
        settings: {
          keepingTime: 300000,
          console: true,
          autoShow: true,
        },
      };

      expect(getRemainingTime(config)).toBe(0);
    });
  });

  describe('tryRestoreConfig', () => {
    it('should return null when no config exists', () => {
      expect(tryRestoreConfig()).toBeNull();
    });

    it('should return valid non-expired config', () => {
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      const config: StoredConfig = {
        openTime: Date.now(),
        settings: {
          keepingTime: 300000,
          console: true,
          autoShow: true,
        },
      };

      localStorage.setItem('ajax-watcher', JSON.stringify(config));

      const restored = tryRestoreConfig();
      expect(restored).toEqual(config);
    });

    it('should return null and clear expired config', () => {
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      const config: StoredConfig = {
        openTime: Date.now() - 400000,
        settings: {
          keepingTime: 300000,
          console: true,
          autoShow: true,
        },
      };

      localStorage.setItem('ajax-watcher', JSON.stringify(config));

      const restored = tryRestoreConfig();
      expect(restored).toBeNull();
      expect(localStorage.getItem('ajax-watcher')).toBeNull();
    });
  });
});
