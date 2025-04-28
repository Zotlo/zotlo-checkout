import Countries from '../countries.json';

type Country = typeof Countries[0];

export function getCountryCodeByNumber(phoneNumber: string | number, matchLength = true): string {
  const clearPattern = /[\s-()+]/g
  const cleanPhoneNumber = `${phoneNumber}`.replace(clearPattern, '');
  const country = Countries.find((item) => {
    const code = item.code.replace(/\D/g, '');
    const mask = (Array.isArray(item.mask) ? item.mask[0] : item.mask).replace(clearPattern, '');
    const fullMask = `${code}${mask}`;
    const isMatchingLength = matchLength ? fullMask.length === cleanPhoneNumber.length : true;
    const codeByItem = cleanPhoneNumber.substring(0, code.length);
    return isMatchingLength && code === codeByItem;
  });

  return country?.iso ?? '';
}

export function getCountryByCode(code: string): (Country & { maskLength: number }) | undefined {
  const item = Countries.find((country: any) => country.iso === code);
  if (!item) return;
  const mask = (item.code + (Array.isArray(item.mask) ? item.mask[0] : item.mask)).replace(/[\s-()+]/g, '');

  return {
    ...item,
    maskLength: mask.length
  };
}

export function getMaskByCode(country: any) {
  let mask = country.code + ' ';
  if (Array.isArray(country.mask)) {
    mask += country.mask[0];
  } else {
    mask += country.mask;
  }
  return mask;
}

function isJSON(val: string) {
  try { JSON.parse(val); } catch { return false }
  return true;
} 

function toPrimitive(val: string) {
  if (val === 'true' || val === 'false') return !!+new Boolean(val);
  if (val === 'undefined') return undefined;
  if (val === 'null') return null;
  if (!isNaN(Number(val))) return Number(val);
  if (isJSON(val)) {
    const obj = JSON.parse(val);
    if (Array.isArray(obj)) return obj;
  }
  return val.replace(/^('|")/g, '').replace(/('|")$/g, '');
}

export function template(templateString: string, data: Record<string, any>) {
  let newString = templateString;
  const parameters = [...new Set(templateString.match(/\{\{(\w+)\}\}/gm) || [])];
  const conditionsRegex = /<% IF\((?<condition>(.*?))\) %>(?<content>(.*?))<% ENDIF %>/gms;

  let matched;
  while ((matched = conditionsRegex.exec(templateString)) !== null) {
    let cleanContent = '';
    const [key, value] = matched?.groups?.condition.split('===').map(item => item.trim()) || [];
    const dataValue = data[key];
    const templateContent = matched[0];
    const parsedValue = toPrimitive(value);
    const hasKey = Object.prototype.hasOwnProperty.call(data, key);
    const hasCondition = (
      Array.isArray(parsedValue)
        ? parsedValue.includes(dataValue)
        : dataValue === parsedValue
    );

    // If the condition is true, we get the content
    if (hasKey && hasCondition) {
      cleanContent = matched?.groups?.content || '';
    }

    // Clear string
    newString = newString.replace(templateContent, cleanContent);

    // This is necessary to avoid infinite loops with zero-width matches
    if (matched.index === conditionsRegex.lastIndex) {
      conditionsRegex.lastIndex++;
    }
  }

  // Apply parameters
  for (const item of parameters) {
    const key = item.replace(/\{|\}/gm, '');
    newString = newString.replace(new RegExp(item, 'gm'), () => {
      const value = data[key];
      return value !== undefined ? value : item;
    });
  }

  return newString
}

export function generateAttributes(attrs: Record<string, string | number | boolean>) {
  if (!attrs) return '';
  return Object.entries(attrs).map(([key, value]) => value !== undefined && value !== null ? `${key}="${value}"` : '').join(' ')
}
