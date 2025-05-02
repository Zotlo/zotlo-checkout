export function useI18n(localization: Record<string, any>) {
  function getValueByPath(path: string) {
    const list = path.split('.');
    if (list.length === 0) return path;

    let value = list.length === 1 ? localization[path] as string : '';

    for (const key of list) {
      value = typeof value === 'object' ? value?.[key] : localization?.[key];
      if (typeof value === 'string') break;
      if (value === undefined) value = path;
    }

    return value;
  }
  
  function $t(key: string, params?: Record<string, any>) {
    let value = getValueByPath(key);
    // Apply parameters
    if (params) {
      for (const [key, val] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${key}\\}`, 'gm'), val);
      }
    }

    return value;
  }

  return { $t }
}
