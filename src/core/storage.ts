/**
 * 存储管理模块
 * 处理 localStorage 中的调试配置和时效管理
 */

import type { StoredConfig, AjaxWatcherOptions } from './types';

const STORAGE_KEY = 'ajax-watcher';

/**
 * 保存调试配置到 localStorage
 */
export function saveConfig(options: Required<Pick<AjaxWatcherOptions, 'keepingTime' | 'console' | 'autoShow'>>): void {
  const config: StoredConfig = {
    openTime: Date.now(),
    settings: options,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    console.warn('[ajax-watcher] 无法保存配置到 localStorage');
  }
}

/**
 * 从 localStorage 读取调试配置
 */
export function loadConfig(): StoredConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const config = JSON.parse(stored) as StoredConfig;

    if (!config.openTime || !config.settings) {
      return null;
    }

    return config;
  } catch {
    return null;
  }
}

/**
 * 清除存储的配置
 */
export function clearConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.warn('[ajax-watcher] 无法清除 localStorage 配置');
  }
}

/**
 * 检查配置是否仍在有效期内
 */
export function isConfigValid(config: StoredConfig): boolean {
  const now = Date.now();
  const expiryTime = config.openTime + config.settings.keepingTime;
  return now < expiryTime;
}

/**
 * 计算剩余有效时间（毫秒）
 */
export function getRemainingTime(config: StoredConfig): number {
  const now = Date.now();
  const expiryTime = config.openTime + config.settings.keepingTime;
  return Math.max(0, expiryTime - now);
}

/**
 * 尝试从存储恢复有效配置
 */
export function tryRestoreConfig(): StoredConfig | null {
  const config = loadConfig();
  if (config && isConfigValid(config)) {
    return config;
  }

  if (config) {
    clearConfig();
  }

  return null;
}
