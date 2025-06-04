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

  function handlePluralization(value: string, count: number) {
    const parts = value.split('|');
    if (parts.length === 2) {
      return [0, 1].includes(Math.abs(count)) ? parts[0] : parts[1];
    } else if (parts.length === 3) {
      return count === 0 ? parts[0] : Math.abs(count) === 1 ? parts[1] : parts[2];
    }
    return parts[0];
  }
  
  function $t(key: string, params?: Record<string, any>) {
    let value = getValueByPath(key);

    // Handle pluralization if the value contains pipe separators and count parameter exists
    if (Object.keys(params || {}).includes('count') && value.includes('|')) {
      value = handlePluralization(value, params?.count);
    }

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
