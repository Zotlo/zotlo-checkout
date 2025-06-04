export function prepareFontUrl(fonts: string[], url?: string) {
  url = url || `https://fonts.googleapis.com/css2?display=swap`
  const unique = [...new Set(fonts.filter(Boolean).map((item) => item.split(',').map((val) => val.trim().replace(/("|')/g, ''))).flat())]
    .filter((font) => !/^sans(-serif)?$/g.test(font))
  const qString = unique?.map((font) => `family=${font.replace(/\s/g, '+')}:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900`).join('&');
  return {
    url,
    query: qString,
    full: url + (qString ? `&${qString}` : '')
  }
}

export function useFontFamily() {
  const systemFonts = [
    'system-ui', 'Impact', 'Arial', 'Verdana', '"Times New Roman"',
    'Garamond', 'Georgia', '"Courier New"', 'cursive'
  ];

  function isCustomFont(fontValue: string) {
    return !systemFonts.find((font) => font === fontValue);
  }

  return {
    systemFonts,
    isCustomFont
  };
}

export function loadFontsOnPage(fonts: string[]) {
  const { isCustomFont } = useFontFamily();
  const isAlreadyAdded = document.getElementById('zotloCheckoutFonts') as HTMLLinkElement;
  const { url } = prepareFontUrl([], isAlreadyAdded?.href);

  const unique = [
    ...new Set(
      fonts
        .filter(Boolean)
        .map((item) =>
          (Array.isArray(item) ? item.filter(Boolean).join('') : item)
            .split(',')
            .map((val) => val.trim().replace(/["']/g, ''))
        )
        .flat()
    )
  ].filter((font) => isCustomFont(font) && !new RegExp(`(${font.replace(/\s/g, '\\+')})`, 'g').test(url));
  const { query, full } = prepareFontUrl(unique, url);

  if (!query) return false;

  if (isAlreadyAdded) {
    isAlreadyAdded.href = full;
  } else {
    const gfonts = document.createElement('link');
    gfonts.id = 'zotloCheckoutFonts';
    gfonts.href = full;
    gfonts.rel = 'stylesheet';
    document.head.appendChild(gfonts);
  }
}
