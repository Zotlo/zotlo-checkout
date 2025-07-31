export function template(templateString: string, data: Record<string, any>) {
  let newString = templateString;
  const parameters = [...new Set(templateString.match(/\{\{(\w+)\}\}/gm) || [])];
  
  // Process nested conditional templates from innermost to outermost
  newString = processNestedConditions(newString, data);

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

function processNestedConditions(templateString: string, data: Record<string, any>): string {
  let newString = templateString;
  let hasChanges = true;
  
  // Keep processing until no more conditional blocks are found
  while (hasChanges) {
    hasChanges = false;
    const conditionBlocks = findConditionalBlocks(newString);
    
    // Process from innermost (longest depth) to outermost
    conditionBlocks
      .sort((a, b) => b.depth - a.depth)
      .forEach(block => {
        const cleanContent = evaluateCondition(block.condition, block.content, data);
        newString = newString.replace(block.fullMatch, cleanContent);
        hasChanges = true;
      });
  }
  
  return newString;
}

function findConditionalBlocks(text: string) {
  const blocks: Array<{
    fullMatch: string;
    condition: string;
    content: string;
    depth: number;
    start: number;
    end: number;
  }> = [];
  
  let pos = 0;
  
  while (pos < text.length) {
    const ifMatch = text.substring(pos).match(/<% IF\(([^)]+)\) %>/);
    if (!ifMatch) break;
    
    const ifStart = pos + ifMatch.index!;
    const ifEnd = ifStart + ifMatch[0].length;
    const condition = ifMatch[1];
    
    // Find matching ENDIF by counting nested IF/ENDIF pairs
    let depth = 1;
    let searchPos = ifEnd;
    const contentStart = ifEnd;
    let contentEnd = -1;
    
    while (searchPos < text.length && depth > 0) {
      const nextIf = text.substring(searchPos).search(/<% IF\(/);
      const nextEndif = text.substring(searchPos).search(/<% ENDIF %>/);
      
      if (nextEndif === -1) break; // No more ENDIF found
      
      if (nextIf !== -1 && nextIf < nextEndif) {
        // Found nested IF before ENDIF
        depth++;
        searchPos += nextIf + 5; // Move past "IF("
      } else {
        // Found ENDIF
        depth--;
        if (depth === 0) {
          contentEnd = searchPos + nextEndif;
          searchPos = contentEnd + 11; // Move past "<% ENDIF %>"
        } else {
          searchPos += nextEndif + 11; // Move past "<% ENDIF %>"
        }
      }
    }
    
    if (contentEnd !== -1) {
      const content = text.substring(contentStart, contentEnd);
      const fullMatch = text.substring(ifStart, searchPos);
      const blockDepth = (content.match(/<% IF\(/g) || []).length;
      
      blocks.push({
        fullMatch,
        condition,
        content,
        depth: blockDepth,
        start: ifStart,
        end: searchPos
      });
    }
    
    pos = ifEnd;
  }
  
  return blocks;
}

function evaluateCondition(condition: string, content: string, data: Record<string, any>): string {
  const [key, value] = condition.split('===').map(item => item.trim());
  const dataValue = data[key];
  const parsedValue = toPrimitive(value);
  const hasKey = Object.prototype.hasOwnProperty.call(data, key);
  const hasCondition = (
    Array.isArray(parsedValue)
      ? parsedValue.includes(dataValue)
      : value === undefined
        ? !!dataValue
        : dataValue === parsedValue
  );

  // If the condition is true, we get the content, otherwise empty string
  return (hasKey && hasCondition) ? content : '';
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
  return val?.replace(/^('|")/g, '')?.replace(/('|")$/g, '');
}

function isJSON(val: string) {
  try { JSON.parse(val); } catch { return false }
  return true;
} 
