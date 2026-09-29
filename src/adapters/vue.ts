/**
 * Vue 3 适配器
 *
 * @example
 * ```ts
 * import { createApp } from 'vue';
 * import { ajaxWatcherPlugin } from 'ajax-watcher/vue';
 *
 * const app = createApp(App);
 * app.use(ajaxWatcherPlugin, {
 *   keepingTime: 10 * 60 * 1000,
 *   autoShow: false,
 * });
 * ```
 */

import { ajaxWatcher } from '../index';
import type { AjaxWatcherOptions, AjaxWatcherInstance } from '../core/types';

export interface VueAjaxWatcherPluginOptions extends AjaxWatcherOptions {
  /**
   * 是否在插件安装时自动开启调试
   * @default false
   */
  autoOpen?: boolean;
}

export interface AjaxWatcherPlugin {
  install: (app: VueApp, options?: VueAjaxWatcherPluginOptions) => void;
}

interface VueApp {
  config: {
    globalProperties: Record<string, unknown>;
  };
  provide: (key: string | symbol, value: unknown) => VueApp;
}

export const AJAX_WATCHER_KEY = Symbol('ajaxWatcher');

export const ajaxWatcherPlugin: AjaxWatcherPlugin = {
  install(app: VueApp, options?: VueAjaxWatcherPluginOptions) {
    app.config.globalProperties.$ajaxWatcher = ajaxWatcher;

    app.provide(AJAX_WATCHER_KEY, ajaxWatcher);

    if (options?.autoOpen) {
      ajaxWatcher.open(options);
    }
  },
};

export function useAjaxWatcher(): AjaxWatcherInstance {
  return ajaxWatcher;
}

export { ajaxWatcher };
export type { AjaxWatcherOptions, AjaxWatcherInstance };
export default ajaxWatcherPlugin;
