/**
 * JSON 可视化组件
 * 支持折叠/展开和语法高亮
 */

export function formatJson(data: unknown, indent = 0): string {
  if (data === null) {
    return '<span class="ajax-watcher-json-null">null</span>';
  }

  if (data === undefined) {
    return '<span class="ajax-watcher-json-null">undefined</span>';
  }

  if (typeof data === 'boolean') {
    return `<span class="ajax-watcher-json-boolean">${data}</span>`;
  }

  if (typeof data === 'number') {
    return `<span class="ajax-watcher-json-number">${data}</span>`;
  }

  if (typeof data === 'string') {
    const escaped = escapeHtml(data);
    if (isUrl(data)) {
      return `<span class="ajax-watcher-json-string">"<a href="${escaped}" target="_blank" rel="noopener">${escaped}</a>"</span>`;
    }
    return `<span class="ajax-watcher-json-string">"${escaped}"</span>`;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return '<span class="ajax-watcher-json-bracket">[]</span>';
    }

    const id = generateUniqueId();
    const items = data.map((item, index) => {
      const isLast = index === data.length - 1;
      return `${formatJson(item, indent + 1)}${isLast ? '' : ','}`;
    });

    return `<span class="ajax-watcher-json-bracket ajax-watcher-json-toggle" data-id="${id}">[</span>
<span class="ajax-watcher-json-collapsible" data-target="${id}">
${items.map((item) => `${'  '.repeat(indent + 1)}${item}`).join('\n')}
${'  '.repeat(indent)}</span><span class="ajax-watcher-json-bracket">]</span>`;
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return '<span class="ajax-watcher-json-bracket">{}</span>';
    }

    const id = generateUniqueId();
    const items = keys.map((key, index) => {
      const value = (data as Record<string, unknown>)[key];
      const isLast = index === keys.length - 1;
      return `${'  '.repeat(indent + 1)}<span class="ajax-watcher-json-key">"${escapeHtml(key)}"</span>: ${formatJson(value, indent + 1)}${isLast ? '' : ','}`;
    });

    return `<span class="ajax-watcher-json-bracket ajax-watcher-json-toggle" data-id="${id}">{</span>
<span class="ajax-watcher-json-collapsible" data-target="${id}">
${items.join('\n')}
${'  '.repeat(indent)}</span><span class="ajax-watcher-json-bracket">}</span>`;
  }

  return `<span class="ajax-watcher-json-null">${String(data)}</span>`;
}

export function renderJson(data: unknown): HTMLElement {
  const container = document.createElement('pre');
  container.className = 'ajax-watcher-json';
  container.innerHTML = formatJson(data);

  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('ajax-watcher-json-toggle')) {
      const id = target.getAttribute('data-id');
      if (id) {
        const collapsible = container.querySelector(`[data-target="${id}"]`);
        if (collapsible) {
          target.classList.toggle('collapsed');
          collapsible.classList.toggle('hidden');
        }
      }
    }
  });

  return container;
}

export function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isUrl(str: string): boolean {
  return /^https?:\/\/[^\s]+$/i.test(str);
}

let idCounter = 0;
function generateUniqueId(): string {
  return `json_${Date.now()}_${++idCounter}`;
}
