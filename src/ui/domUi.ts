export type DomChild = Node | string | null | undefined | false;

export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger';

export type StatSpec = {
  key: string;
  label: string;
  value: string;
  accent?: 'gold' | 'success' | 'danger';
};

export const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
};

export const appendChildren = (parent: Element, ...children: DomChild[]): void => {
  children.forEach((child) => {
    if (child === null || child === undefined || child === false) {
      return;
    }

    parent.append(child instanceof Node ? child : document.createTextNode(child));
  });
};

export const createPanel = (
  options: {
    className?: string;
    eyebrow?: string;
    title?: string;
    description?: string;
    tone?: 'default' | 'success' | 'danger' | 'warning';
  } = {},
  ...children: DomChild[]
): HTMLElement => {
  const panel = el(
    'section',
    `ui-panel${options.className ? ` ${options.className}` : ''}${
      options.tone && options.tone !== 'default' ? ` ui-panel--${options.tone}` : ''
    }`
  );

  if (options.eyebrow) {
    panel.append(el('div', 'ui-panel__eyebrow', options.eyebrow));
  }

  if (options.title) {
    panel.append(el('h2', 'ui-panel__title', options.title));
  }

  if (options.description) {
    panel.append(el('p', 'ui-panel__description', options.description));
  }

  appendChildren(panel, ...children);
  return panel;
};

export const createButton = (options: {
  label: string;
  tone?: ButtonTone;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}): HTMLButtonElement => {
  const button = el(
    'button',
    `ui-button ui-button--${options.tone ?? 'primary'}${options.className ? ` ${options.className}` : ''}`,
    options.label
  );

  button.type = 'button';
  button.disabled = options.disabled ?? false;
  button.addEventListener('click', () => {
    if (!button.disabled) {
      options.onClick();
    }
  });

  return button;
};

export const createButtonRow = (...buttons: HTMLButtonElement[]): HTMLDivElement => {
  const row = el('div', 'ui-button-row');
  appendChildren(row, ...buttons);
  return row;
};

export const createStatStrip = (
  stats: StatSpec[]
): { root: HTMLDivElement; values: Record<string, HTMLDivElement> } => {
  const root = el('div', 'ui-stat-strip');
  const values: Record<string, HTMLDivElement> = {};

  stats.forEach((stat) => {
    const card = el(
      'div',
      `ui-stat${stat.accent ? ` ui-stat--${stat.accent}` : ''}`
    );
    const label = el('div', 'ui-stat__label', stat.label);
    const value = el('div', 'ui-stat__value', stat.value);

    values[stat.key] = value;
    card.append(label, value);
    root.append(card);
  });

  return { root, values };
};

export const createTutorialBox = (title: string, body: string): HTMLElement => {
  return createPanel(
    { className: 'ui-panel--tutorial', title },
    el('p', 'ui-panel__description', body)
  );
};

export const createBulletList = (items: string[], className = 'ui-bullet-list'): HTMLUListElement => {
  const list = el('ul', className);

  items.forEach((item) => {
    list.append(el('li', 'ui-bullet-list__item', item));
  });

  return list;
};
