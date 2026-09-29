/**
 * 样式定义
 * 使用 CSS-in-JS 方式注入样式
 */

export const STYLE_ID = 'ajax-watcher-styles';

export const styles = `
.ajax-watcher-trigger {
  position: fixed;
  z-index: 99998;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  touch-action: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.ajax-watcher-trigger:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.ajax-watcher-trigger:active {
  transform: scale(0.95);
}

.ajax-watcher-trigger svg {
  width: 24px;
  height: 24px;
  fill: white;
}

.ajax-watcher-trigger-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #ff4757;
  color: white;
  font-size: 11px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.ajax-watcher-trigger.top-left { top: 16px; left: 16px; }
.ajax-watcher-trigger.top-right { top: 16px; right: 16px; }
.ajax-watcher-trigger.bottom-left { bottom: 16px; left: 16px; }
.ajax-watcher-trigger.bottom-right { bottom: 16px; right: 16px; }

.ajax-watcher-panel {
  position: fixed;
  z-index: 99999;
  background: #1a1a2e;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  display: none;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  font-size: 14px;
  color: #e8e8e8;
  overflow: hidden;
  max-height: 70vh;
  max-width: 95vw;
}

.ajax-watcher-panel.visible {
  display: flex;
}

.ajax-watcher-panel.top-left { top: 72px; left: 16px; }
.ajax-watcher-panel.top-right { top: 72px; right: 16px; }
.ajax-watcher-panel.bottom-left { bottom: 72px; left: 16px; }
.ajax-watcher-panel.bottom-right { bottom: 72px; right: 16px; }

@media (max-width: 600px) {
  .ajax-watcher-panel {
    left: 8px !important;
    right: 8px !important;
    max-width: calc(100vw - 16px);
    width: auto !important;
  }
}

.ajax-watcher-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #16213e;
  border-bottom: 1px solid #2a2a4a;
}

.ajax-watcher-title {
  font-weight: 600;
  font-size: 15px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ajax-watcher-title svg {
  width: 18px;
  height: 18px;
  fill: #667eea;
}

.ajax-watcher-actions {
  display: flex;
  gap: 8px;
}

.ajax-watcher-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ajax-watcher-btn-clear {
  background: #2a2a4a;
  color: #a0a0c0;
}

.ajax-watcher-btn-clear:hover {
  background: #3a3a5a;
}

.ajax-watcher-btn-close {
  background: transparent;
  color: #888;
  padding: 6px;
}

.ajax-watcher-btn-close:hover {
  color: #fff;
}

.ajax-watcher-btn-close svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.ajax-watcher-list {
  flex: 1;
  overflow-y: auto;
  min-height: 160px;
  max-height: 50vh;
  width: 380px;
  scrollbar-width: thin;
  scrollbar-color: rgba(168, 176, 214, 0.55) transparent;
}

.ajax-watcher-list::-webkit-scrollbar,
.ajax-watcher-detail-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.ajax-watcher-list::-webkit-scrollbar-track,
.ajax-watcher-detail-content::-webkit-scrollbar-track {
  background: transparent;
}

.ajax-watcher-list::-webkit-scrollbar-thumb,
.ajax-watcher-detail-content::-webkit-scrollbar-thumb {
  background: rgba(168, 176, 214, 0.45);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.ajax-watcher-list::-webkit-scrollbar-thumb:hover,
.ajax-watcher-detail-content::-webkit-scrollbar-thumb:hover {
  background: rgba(168, 176, 214, 0.75);
  background-clip: padding-box;
  border: 2px solid transparent;
}

@media (max-width: 600px) {
  .ajax-watcher-list {
    width: 100%;
  }
}

.ajax-watcher-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #666;
}

.ajax-watcher-empty svg {
  width: 48px;
  height: 48px;
  fill: #444;
  margin-bottom: 12px;
}

.ajax-watcher-item {
  padding: 12px 16px;
  border-bottom: 1px solid #2a2a4a;
  cursor: pointer;
  transition: background 0.2s ease;
}

.ajax-watcher-item:hover {
  background: #22223a;
}

.ajax-watcher-item.expanded {
  background: #22223a;
}

.ajax-watcher-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ajax-watcher-method {
  font-weight: 600;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  min-width: 40px;
  text-align: center;
}

.ajax-watcher-method.GET { background: #0984e3; color: white; }
.ajax-watcher-method.POST { background: #00b894; color: white; }
.ajax-watcher-method.PUT { background: #fdcb6e; color: #2d3436; }
.ajax-watcher-method.PATCH { background: #e17055; color: white; }
.ajax-watcher-method.DELETE { background: #d63031; color: white; }
.ajax-watcher-method.OPTIONS { background: #6c5ce7; color: white; }
.ajax-watcher-method.HEAD { background: #636e72; color: white; }

.ajax-watcher-url {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #c8c8e8;
}

.ajax-watcher-status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}

.ajax-watcher-status.pending {
  background: #636e72;
  color: white;
}

.ajax-watcher-status.success {
  background: rgba(0, 184, 148, 0.2);
  color: #00b894;
}

.ajax-watcher-status.error {
  background: rgba(214, 48, 49, 0.2);
  color: #ff6b6b;
}

.ajax-watcher-time {
  font-size: 11px;
  color: #888;
}

.ajax-watcher-item-details {
  margin-top: 12px;
  display: none;
}

.ajax-watcher-item.expanded .ajax-watcher-item-details {
  display: block;
}

.ajax-watcher-detail-section {
  margin-bottom: 12px;
}

.ajax-watcher-detail-title {
  font-size: 11px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.ajax-watcher-detail-content {
  background: #12122a;
  border-radius: 6px;
  padding: 10px 12px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 200px;
  overflow: auto;
  overflow-wrap: anywhere;
  word-break: break-word;
  scrollbar-width: thin;
  scrollbar-color: rgba(168, 176, 214, 0.55) transparent;
}

.ajax-watcher-json {
  margin: 0;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.ajax-watcher-json-key { color: #f8c291; }
.ajax-watcher-json-string { color: #78e08f; }
.ajax-watcher-json-number { color: #82ccdd; }
.ajax-watcher-json-boolean { color: #e056fd; }
.ajax-watcher-json-null { color: #636e72; }
.ajax-watcher-json-bracket { color: #dfe6e9; }

.ajax-watcher-json-toggle {
  cursor: pointer;
  user-select: none;
  display: inline;
}

.ajax-watcher-json-toggle::before {
  content: '▼';
  display: inline-block;
  margin-right: 4px;
  font-size: 10px;
  transition: transform 0.2s;
}

.ajax-watcher-json-toggle.collapsed::before {
  transform: rotate(-90deg);
}

.ajax-watcher-json-collapsible {
  margin-left: 16px;
}

.ajax-watcher-json-collapsible.hidden {
  display: none;
}

.ajax-watcher-json-ellipsis {
  color: #636e72;
  font-style: italic;
}
`;

let styleElement: HTMLStyleElement | null = null;

export function injectStyles(): void {
  if (styleElement || document.getElementById(STYLE_ID)) {
    return;
  }

  styleElement = document.createElement('style');
  styleElement.id = STYLE_ID;
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

export function removeStyles(): void {
  if (styleElement) {
    styleElement.remove();
    styleElement = null;
  }

  const existing = document.getElementById(STYLE_ID);
  if (existing) {
    existing.remove();
  }
}
