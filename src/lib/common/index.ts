import { DesignTheme, type FormConfig } from "../types";

export function getFormValues(form: HTMLFormElement, config: FormConfig) {
  const payload: Partial<Record<string, any>> = {};
  const activeForm = config.design.theme === DesignTheme.HORIZONTAL
    ? form.querySelector('[data-tab-active="true"]')?.querySelectorAll('input, select') as NodeListOf<HTMLInputElement>
    : form.elements;

  if (!activeForm) return payload;

  for (const item of activeForm as NodeListOf<HTMLInputElement>) {
    const name = item?.name;
    if (name) {
      payload[name] = item?.type === 'checkbox' ? !!item?.checked : item?.value || '';
    }
  }

  return payload;
}

export function loadSelectbox(item: HTMLElement, options: {
  onSelect: (value: string) => void;
}) {
  if (item.getAttribute('disabled') === 'true') {
    return {};
  }

  const toggle = item.querySelector('[data-select-toggle]') as HTMLElement;
  const items = item.querySelectorAll('[data-select-list] [data-select-item]') as NodeListOf<HTMLElement>;
  const selectbox = item.querySelector('select') as HTMLSelectElement;

  function closeSelectbox() {
    item.setAttribute('data-toggle', 'closed');
  }

  function clickOutside(e: MouseEvent) {
    const closest = (e.target as HTMLElement).parentElement?.closest('[data-select]')
    if (!closest) {
      closeSelectbox();
      document.removeEventListener('click', clickOutside);
    }
  }

  function toggleSelectbox() {
    const dataToggle = item.getAttribute('data-toggle') === 'open' ? 'closed' : 'open';
    item.setAttribute('data-toggle', dataToggle);

    if (dataToggle === 'open') {
      document.addEventListener('click', clickOutside);
      item.querySelector('[data-select-list] [data-selected="true"]')?.scrollIntoView({ block: 'center' });
      (item.querySelector('[data-select-list] [data-selected="true"]') as HTMLElement)?.focus();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSelectbox();
    }
  }

  function handleItemKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const activeItem = item.querySelector('[data-select-list] [data-selected]:focus');
      if (activeItem) selectItem.bind(activeItem as HTMLElement)();
    }
  }

  function selectItem(this: HTMLElement) {
    const target = this as HTMLElement;
    const value = target?.getAttribute('data-value');

    for (const item of items) {
      item.setAttribute('data-selected', 'false');
    }

    target.setAttribute('data-selected', 'true');
    const textElement = target.querySelector('[data-select-text]') as HTMLElement;
    toggle.innerHTML = target.outerHTML.replace(new RegExp(textElement.innerText, 'gm'), value || '');
    selectbox.value = value || '';
    options.onSelect(value || '');

    closeSelectbox();
  }

  function init() {
    toggle?.addEventListener('click', toggleSelectbox);
    toggle?.addEventListener('keydown', handleKeydown);

    for (const item of items) {
      item.addEventListener('click', selectItem);
      item.addEventListener('keydown', handleItemKeydown);
    }
  }

  function destroy() {
    toggle?.removeEventListener('click', toggleSelectbox);
    toggle?.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('click', clickOutside);

    for (const item of items) {
      item.removeEventListener('click', selectItem);
    }
  }

  init();

  return {
    init,
    destroy
  }
}
