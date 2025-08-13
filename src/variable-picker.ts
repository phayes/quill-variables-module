// variable-picker.ts (Quill v2)
// prettier toolbar menu + TS fixes

import "./variables.css";

import Quill from 'quill';

export type VariableTree = Record<string, VarNode>;

export interface VarNode {
  title: string;
  description?: string;
  children?: VariableTree;
}

export interface VariablePickerOptions {
  variables: VariableTree;
  includeParentNodes?: boolean; // if true, parents with children are also insertable
  placeholder?: string;         // button label
  token?: { open?: string; close?: string } | ((path: string) => string);
}

type EditorRange = { index: number; length: number };

type LeafItem = {
  path: string;                           // e.g. "user.first_name"
  title: string;                          // e.g. "First Name"
  description?: string;
  group?: { key: string; title: string }; // immediate parent, if any
};

interface ToolbarLike {
  container: HTMLElement;
}

const DEFAULTS: Required<Omit<VariablePickerOptions, 'variables'>> = {
  includeParentNodes: false,
  placeholder: 'Variables',
  token: { open: '{{', close: '}}' },
};

class VariablePicker {
  private quill: Quill;
  private options: Required<VariablePickerOptions>;

  // DOM
  private toolbarEl!: HTMLElement;
  private rootEl!: HTMLSpanElement;   // <span class="ql-formats ql-variable-picker">
  private buttonEl!: HTMLSpanElement;
  private menuEl!: HTMLDivElement;
  private itemsEls: HTMLSpanElement[] = [];

  // handlers
  private boundDocClick = (e: MouseEvent) => this.onDocumentClick(e);
  private boundButtonClick = () => this.toggleMenu();
  private boundButtonKey = (e: KeyboardEvent) => this.onButtonKeydown(e);
  private boundMenuKey = (e: KeyboardEvent) => this.onMenuKeydown(e);
  private boundMenuClick = (e: MouseEvent) => this.onMenuClick(e);

  constructor(quill: Quill, opts: VariablePickerOptions) {
    this.quill = quill;
    this.options = {
      ...DEFAULTS,
      ...opts,
      token: opts.token ?? DEFAULTS.token,
      variables: opts.variables,
    } as Required<VariablePickerOptions>;

    // ---- TS fix for toolbar.container ----
    const toolbar = quill.getModule('toolbar') as unknown as ToolbarLike | undefined;
    if (!toolbar || !toolbar.container) {
      throw new Error('VariablePicker requires the toolbar module.');
    }
    this.toolbarEl = toolbar.container;

    this.buildUi();
  }

  // Public API
  insert(path: string) {
    const range = this.quill.getSelection(true) as EditorRange | null;
    if (!range) {
      this.quill.focus();
      const r2 = this.quill.getSelection(true) as EditorRange | null;
      if (!r2) return;
      this._insertAt(r2, path);
      return;
    }
    this._insertAt(range, path);
  }

  getAvailableVariables(): string[] {
    return this.collectLeaves(this.options.variables).map((i) => i.path);
  }

  updateVariables(variables: VariableTree) {
    this.options.variables = variables;
    this.renderMenu(); // rebuild menu DOM with new data
  }

  destroy() {
    document.removeEventListener('click', this.boundDocClick, true);
    this.buttonEl.removeEventListener('click', this.boundButtonClick);
    this.buttonEl.removeEventListener('keydown', this.boundButtonKey);
    this.menuEl.removeEventListener('keydown', this.boundMenuKey);
    this.menuEl.removeEventListener('click', this.boundMenuClick);
    this.rootEl.remove();
  }

  // ---- Internals ----

  private _insertAt(range: EditorRange, path: string) {
    const tokenText = this.formatToken(path);
    // Replace selected text
    this.quill.deleteText(range.index, range.length, 'user');

    // Optional smart spacing
    const before = range.index > 0 ? this.quill.getText(range.index - 1, 1) : '';
    const after = this.quill.getText(range.index, 1);
    const needsLeadingSpace = /\w|\}/.test(before);
    const needsTrailingSpace = /\w|\{/.test(after);

    let text = tokenText;
    if (needsLeadingSpace) text = ' ' + text;
    if (needsTrailingSpace) text = text + ' ';

    this.quill.insertText(range.index, text, 'user');
    this.quill.setSelection(range.index + text.length, 0, 'user');
  }

  private formatToken(path: string): string {
    const t = this.options.token;
    if (typeof t === 'function') return t(path);
    const open = t.open ?? '{{';
    const close = t.close ?? '}}';
    return `${open}${path}${close}`;
  }

  private buildUi() {
    // container group in toolbar
    this.rootEl = document.createElement('span');
    this.rootEl.className = 'ql-formats ql-variable-picker';

    // button
    this.buttonEl = document.createElement('span');
    this.buttonEl.className = 'ql-variable-button';
    this.buttonEl.setAttribute('aria-haspopup', 'true');
    this.buttonEl.setAttribute('aria-expanded', 'false');
    this.buttonEl.setAttribute('title', this.options.placeholder);
    // Simple icon-ish label: {{ }}
    this.buttonEl.innerHTML = `<span class="ql-variable-icon">{{ }}</span><span class="ql-variable-label">${this.options.placeholder}</span>`;

    // menu
    this.menuEl = document.createElement('div');
    this.menuEl.className = 'ql-variable-menu';
    this.menuEl.setAttribute('role', 'menu');
    this.menuEl.hidden = true;

    this.rootEl.appendChild(this.buttonEl);
    this.rootEl.appendChild(this.menuEl);
    this.toolbarEl.appendChild(this.rootEl);

    // events
    this.buttonEl.addEventListener('click', this.boundButtonClick);
    this.buttonEl.addEventListener('keydown', this.boundButtonKey);
    this.menuEl.addEventListener('keydown', this.boundMenuKey);
    this.menuEl.addEventListener('click', this.boundMenuClick);
    document.addEventListener('click', this.boundDocClick, true);

    this.renderMenu();
  }

  private toggleMenu(force?: boolean) {
    const open = force ?? this.menuEl.hidden;
    if (open) {
      this.openMenu();
    } else {
      this.closeMenu();
    }
  }

  private openMenu() {
    this.menuEl.hidden = false;
    this.buttonEl.setAttribute('aria-expanded', 'true');
    // Focus first item for keyboard users
    const first = this.menuEl.querySelector<HTMLButtonElement>('[role="menuitem"]');
    first?.focus();
  }

  private closeMenu() {
    if (this.menuEl.hidden) return;
    this.menuEl.hidden = true;
    this.buttonEl.setAttribute('aria-expanded', 'false');
    this.buttonEl.focus();
  }

  private onDocumentClick(e: MouseEvent) {
    if (this.menuEl.hidden) return;
    const target = e.target as Node;
    if (!this.rootEl.contains(target)) {
      this.closeMenu();
    }
  }

  private onButtonKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.openMenu();
    }
  }

  private onMenuKeydown(e: KeyboardEvent) {
    const items = this.itemsEls;
    const current = document.activeElement as HTMLButtonElement | null;
    const i = items.indexOf(current || (null as unknown as HTMLButtonElement));

    if (e.key === 'Escape') {
      e.preventDefault();
      this.closeMenu();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = items[(i + 1 + items.length) % items.length];
      next?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = items[(i - 1 + items.length) % items.length];
      prev?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  }

  private onMenuClick(e: MouseEvent) {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-path]');
    if (!btn) return;
    const path = btn.getAttribute('data-path')!;
    this.insert(path);
    this.closeMenu();
  }

  private renderMenu() {
    // Clear
    this.menuEl.innerHTML = '';
    this.itemsEls = [];

    const items = this.collectLeaves(this.options.variables);
    const ungrouped = items.filter((i) => !i.group);
    const groups = new Map<string, { title: string; items: LeafItem[] }>();
    for (const item of items) {
      if (!item.group) continue;
      const key = item.group.key;
      if (!groups.has(key)) groups.set(key, { title: item.group.title, items: [] });
      groups.get(key)!.items.push(item);
    }

    const frag = document.createDocumentFragment();

    // Ungrouped section (only if any)
    if (ungrouped.length) {
      frag.appendChild(this.sectionTitle('General'));
      for (const item of ungrouped) {
        frag.appendChild(this.createItemButton(item));
      }
      frag.appendChild(this.sectionDivider());
    }

    // Grouped sections
    for (const [, group] of groups) {
      frag.appendChild(this.sectionTitle(group.title));
      for (const item of group.items) {
        frag.appendChild(this.createItemButton(item));
      }
      frag.appendChild(this.sectionDivider());
    }

    // remove trailing divider
    const last = frag.lastChild as HTMLElement;
    if (last?.classList?.contains('ql-variable-divider')) {
      frag.removeChild(last);
    }

    this.menuEl.appendChild(frag);
  }

  private sectionTitle(text: string) {
    const el = document.createElement('div');
    el.className = 'ql-variable-group-title';
    el.textContent = text;
    return el;
  }

  private sectionDivider() {
    const el = document.createElement('div');
    el.className = 'ql-variable-divider';
    return el;
  }

  private createItemButton(item: LeafItem) {
    const btn = document.createElement('span');
    btn.className = 'ql-variable-item';
    btn.setAttribute('role', 'menuitem');
    btn.setAttribute('data-path', item.path);
    btn.title = item.description || item.title;

    // layout:
    // [title + description]  [{{token}}]
    const left = document.createElement('div');
    left.className = 'ql-variable-item-text';

    const t = document.createElement('div');
    t.className = 'ql-variable-item-title';
    t.textContent = item.title;
    left.appendChild(t);

    if (item.description) {
      const d = document.createElement('div');
      d.className = 'ql-variable-item-description';
      d.textContent = item.description;
      left.appendChild(d);
    }

    const right = document.createElement('div');
    right.className = 'code';
    right.textContent = this.formatToken(item.path);

    btn.appendChild(left);
    btn.appendChild(right);

    this.itemsEls.push(btn);
    return btn;
  }

  private collectLeaves(
    tree: VariableTree,
    prefix: string[] = [],
    parent: { key: string; title: string } | null = null
  ): LeafItem[] {
    const out: LeafItem[] = [];
    for (const [key, node] of Object.entries(tree)) {
      const pathParts = [...prefix, key];
      const path = pathParts.join('.');
      const hasChildren = node.children && Object.keys(node.children).length > 0;

      if (hasChildren) {
        if (this.options.includeParentNodes) {
          out.push({
            path,
            title: node.title || key,
            description: node.description,
            group: parent || undefined,
          });
        }
        out.push(
          ...this.collectLeaves(node.children!, pathParts, {
            key: path,
            title: node.title || key,
          })
        );
      } else {
        out.push({
          path,
          title: node.title || key,
          description: node.description,
          group: parent || undefined,
        });
      }
    }
    return out;
  }
}

// Register as a Quill module (v2)
Quill.register('modules/variablePicker', VariablePicker);

export default VariablePicker;
