/**
 * 调试面板 UI 组件
 * 纯 DOM 实现，无外部依赖
 */

import type { NetworkRequest, AjaxWatcherOptions } from '../core/types';
import type { ConsoleEntry } from '../core/console-capture';
import { renderJson, tryParseJson } from './json-viewer';
import { injectStyles, removeStyles } from './styles';

const ICON_NETWORK = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`;
const ICON_CLOSE = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
const ICON_EMPTY = `<svg viewBox="0 0 24 24"><path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`;

export interface PanelOptions {
  panelPosition: AjaxWatcherOptions['panelPosition'];
  triggerPosition: AjaxWatcherOptions['triggerPosition'];
  consoleEnabled?: boolean;
  onClear?: () => void;
}

export class Panel {
  private trigger: HTMLButtonElement | null = null;
  private panel: HTMLDivElement | null = null;
  private listContainer: HTMLDivElement | null = null;
  private consoleContainer: HTMLDivElement | null = null;
  private badge: HTMLSpanElement | null = null;
  private requests: Map<string, NetworkRequest> = new Map();
  private expandedItems: Set<string> = new Set();
  private logCount = 0;
  private options: PanelOptions;
  private visible = false;
  private activeTab: 'network' | 'console' = 'network';

  constructor(options: PanelOptions) {
    this.options = options;
  }

  mount(): void {
    injectStyles();
    this.createTrigger();
    this.createPanel();
  }

  unmount(): void {
    this.trigger?.remove();
    this.panel?.remove();
    this.trigger = null;
    this.panel = null;
    this.listContainer = null;
    this.consoleContainer = null;
    this.badge = null;
    this.logCount = 0;
    removeStyles();
  }

  show(): void {
    if (this.panel) {
      this.panel.classList.add('visible');
      this.visible = true;
    }
  }

  hide(): void {
    if (this.panel) {
      this.panel.classList.remove('visible');
      this.visible = false;
    }
  }

  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  updateRequest(request: NetworkRequest): void {
    this.requests.set(request.id, request);
    this.renderList();
    this.updateBadge();
  }

  clearRequests(): void {
    this.requests.clear();
    this.expandedItems.clear();
    this.renderList();
    this.updateBadge();
  }

  appendLog(entry: ConsoleEntry): void {
    if (!this.consoleContainer) return;

    this.consoleContainer.querySelector('.ajax-watcher-empty')?.remove();

    const row = document.createElement('div');
    row.className = `ajax-watcher-log ajax-watcher-log-${entry.level}`;

    const level = document.createElement('span');
    level.className = 'ajax-watcher-log-level';
    level.textContent = entry.level;

    const text = document.createElement('span');
    text.className = 'ajax-watcher-log-text';
    text.textContent = entry.text;

    row.append(level, text);
    this.consoleContainer.appendChild(row);
    this.logCount += 1;

    while (this.logCount > 200 && this.consoleContainer.firstElementChild) {
      this.consoleContainer.firstElementChild.remove();
      this.logCount -= 1;
    }

    this.consoleContainer.scrollTop = this.consoleContainer.scrollHeight;
  }

  private createTrigger(): void {
    this.trigger = document.createElement('button');
    this.trigger.className = `ajax-watcher-trigger ${this.options.triggerPosition}`;
    this.trigger.innerHTML = ICON_NETWORK;
    this.trigger.setAttribute('aria-label', '打开网络调试面板');
    this.trigger.setAttribute('title', 'Ajax Watcher');

    this.badge = document.createElement('span');
    this.badge.className = 'ajax-watcher-trigger-badge';
    this.badge.style.display = 'none';
    this.trigger.appendChild(this.badge);

    this.trigger.addEventListener('click', () => this.toggle());

    document.body.appendChild(this.trigger);
  }

  private createPanel(): void {
    this.panel = document.createElement('div');
    this.panel.className = `ajax-watcher-panel ${this.options.panelPosition}`;
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-label', '网络请求调试面板');

    const header = document.createElement('div');
    header.className = 'ajax-watcher-header';
    header.innerHTML = `
      <div class="ajax-watcher-title">
        ${ICON_NETWORK}
        <span>Network Requests</span>
      </div>
      <div class="ajax-watcher-actions">
        <button class="ajax-watcher-btn ajax-watcher-btn-clear" data-action="clear">清除</button>
        <button class="ajax-watcher-btn ajax-watcher-btn-close" data-action="close" aria-label="关闭">${ICON_CLOSE}</button>
      </div>
    `;

    header.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('[data-action]') as HTMLElement;
      if (btn) {
        const action = btn.getAttribute('data-action');
        if (action === 'close') {
          this.hide();
        } else if (action === 'clear') {
          this.clearActiveView();
        }
      }
    });

    const tabs = document.createElement('div');
    tabs.className = 'ajax-watcher-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.innerHTML = `
      <button type="button" class="ajax-watcher-tab active" data-tab="network" role="tab" aria-selected="true">网络</button>
      <button type="button" class="ajax-watcher-tab" data-tab="console" role="tab" aria-selected="false">控制台</button>
    `;
    tabs.addEventListener('click', (e) => {
      const tab = (e.target as HTMLElement).closest('[data-tab]') as HTMLElement | null;
      const name = tab?.getAttribute('data-tab');
      if (name === 'network' || name === 'console') {
        this.showTab(name);
      }
    });

    this.listContainer = document.createElement('div');
    this.listContainer.className = 'ajax-watcher-list';
    this.listContainer.setAttribute('role', 'tabpanel');

    this.consoleContainer = document.createElement('div');
    this.consoleContainer.className = 'ajax-watcher-console hidden';
    this.consoleContainer.setAttribute('role', 'tabpanel');

    this.panel.append(header, tabs, this.listContainer, this.consoleContainer);

    document.body.appendChild(this.panel);
    this.renderList();
    this.renderConsoleEmpty();
  }

  private showTab(tab: 'network' | 'console'): void {
    this.activeTab = tab;
    this.panel?.querySelectorAll<HTMLElement>('[data-tab]').forEach((button) => {
      const selected = button.getAttribute('data-tab') === tab;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    this.listContainer?.classList.toggle('hidden', tab !== 'network');
    this.consoleContainer?.classList.toggle('hidden', tab !== 'console');
    const title = this.panel?.querySelector('.ajax-watcher-title span');
    if (title) {
      title.textContent = tab === 'console' ? 'Console' : 'Network Requests';
    }
  }

  private clearActiveView(): void {
    if (this.activeTab === 'console') {
      this.logCount = 0;
      this.renderConsoleEmpty();
      return;
    }
    this.clearRequests();
    this.options.onClear?.();
  }

  private renderConsoleEmpty(): void {
    if (!this.consoleContainer) return;
    const message = this.options.consoleEnabled
      ? '暂无日志。console.log / info / warn / error 会显示在这里'
      : '未开启控制台。调用 open({ console: true }) 后才会收集日志';
    this.consoleContainer.innerHTML = `
      <div class="ajax-watcher-empty">
        <div>${message}</div>
      </div>
    `;
  }

  private renderList(): void {
    if (!this.listContainer) return;

    const requestArray = Array.from(this.requests.values()).reverse();

    if (requestArray.length === 0) {
      this.listContainer.innerHTML = `
        <div class="ajax-watcher-empty">
          ${ICON_EMPTY}
          <div>暂无请求记录</div>
          <div style="font-size: 12px; margin-top: 4px;">发起网络请求后会在这里显示</div>
        </div>
      `;
      return;
    }

    this.listContainer.innerHTML = '';

    requestArray.forEach((request) => {
      const item = this.createRequestItem(request);
      this.listContainer!.appendChild(item);
    });
  }

  private createRequestItem(request: NetworkRequest): HTMLElement {
    const item = document.createElement('div');
    item.className = `ajax-watcher-item${this.expandedItems.has(request.id) ? ' expanded' : ''}`;
    item.setAttribute('data-id', request.id);

    const statusClass = this.getStatusClass(request);
    const statusText = this.getStatusText(request);
    const urlPath = this.extractUrlPath(request.url);

    item.innerHTML = `
      <div class="ajax-watcher-item-header">
        <span class="ajax-watcher-method ${request.method}">${request.method}</span>
        <span class="ajax-watcher-url" title="${this.escapeHtml(request.url)}">${urlPath}</span>
        <span class="ajax-watcher-status ${statusClass}">${statusText}</span>
        ${request.duration ? `<span class="ajax-watcher-time">${request.duration}ms</span>` : ''}
      </div>
      <div class="ajax-watcher-item-details"></div>
    `;

    const headerEl = item.querySelector('.ajax-watcher-item-header')!;
    const detailsEl = item.querySelector('.ajax-watcher-item-details')!;

    headerEl.addEventListener('click', () => {
      const isExpanded = item.classList.toggle('expanded');
      if (isExpanded) {
        this.expandedItems.add(request.id);
        this.renderRequestDetails(detailsEl as HTMLElement, request);
      } else {
        this.expandedItems.delete(request.id);
        detailsEl.innerHTML = '';
      }
    });

    if (this.expandedItems.has(request.id)) {
      this.renderRequestDetails(detailsEl as HTMLElement, request);
    }

    return item;
  }

  private renderRequestDetails(container: HTMLElement, request: NetworkRequest): void {
    container.innerHTML = '';

    const sections: Array<{ title: string; content: HTMLElement | string }> = [];

    sections.push({
      title: 'URL',
      content: `<div class="ajax-watcher-detail-content">${this.escapeHtml(request.url)}</div>`,
    });

    if (request.requestHeaders && Object.keys(request.requestHeaders).length > 0) {
      const headersEl = renderJson(request.requestHeaders);
      sections.push({
        title: 'Request Headers',
        content: headersEl.outerHTML,
      });
    }

    if (request.requestBody) {
      const parsed = tryParseJson(request.requestBody);
      const bodyEl = parsed ? renderJson(parsed) : document.createTextNode(request.requestBody);
      const wrapper = document.createElement('div');
      wrapper.className = 'ajax-watcher-detail-content';
      wrapper.appendChild(bodyEl instanceof Node ? bodyEl : document.createTextNode(String(bodyEl)));
      sections.push({
        title: 'Request Body',
        content: wrapper,
      });
    }

    if (request.responseHeaders && Object.keys(request.responseHeaders).length > 0) {
      const headersEl = renderJson(request.responseHeaders);
      sections.push({
        title: 'Response Headers',
        content: headersEl.outerHTML,
      });
    }

    if (request.responseBody) {
      const parsed = tryParseJson(request.responseBody);
      const bodyEl = parsed ? renderJson(parsed) : document.createTextNode(request.responseBody);
      const wrapper = document.createElement('div');
      wrapper.className = 'ajax-watcher-detail-content';
      wrapper.appendChild(bodyEl instanceof Node ? bodyEl : document.createTextNode(String(bodyEl)));
      sections.push({
        title: 'Response Body',
        content: wrapper,
      });
    }

    if (request.error) {
      sections.push({
        title: 'Error',
        content: `<div class="ajax-watcher-detail-content" style="color: #ff6b6b;">${this.escapeHtml(request.error)}</div>`,
      });
    }

    sections.forEach(({ title, content }) => {
      const section = document.createElement('div');
      section.className = 'ajax-watcher-detail-section';
      section.innerHTML = `<div class="ajax-watcher-detail-title">${title}</div>`;

      if (typeof content === 'string') {
        section.innerHTML += content;
      } else {
        section.appendChild(content);
      }

      container.appendChild(section);
    });
  }

  private getStatusClass(request: NetworkRequest): string {
    if (request.state === 'pending') return 'pending';
    if (request.state === 'error') return 'error';
    if (request.status && request.status >= 200 && request.status < 400) return 'success';
    return 'error';
  }

  private getStatusText(request: NetworkRequest): string {
    if (request.state === 'pending') return '...';
    if (request.error) return request.error;
    return String(request.status || '???');
  }

  private extractUrlPath(url: string): string {
    try {
      const urlObj = new URL(url, window.location.href);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  private updateBadge(): void {
    if (!this.badge) return;

    const pendingCount = Array.from(this.requests.values()).filter((r) => r.state === 'pending').length;

    if (pendingCount > 0) {
      this.badge.textContent = String(pendingCount);
      this.badge.style.display = 'flex';
    } else {
      this.badge.style.display = 'none';
    }
  }
}
