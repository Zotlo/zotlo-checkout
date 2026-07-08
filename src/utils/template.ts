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
  // If the expression is true, we get the content, otherwise empty string
  return evaluateExpression(condition.trim(), data) ? content : '';
}

// Evaluate a (possibly chained) boolean expression. Supports the basic JS
// logical operators with standard precedence: || (lowest) over && over atoms.
// Grouping with parentheses is not supported (the block parser captures the
// condition up to the first ')').
function evaluateExpression(expr: string, data: Record<string, any>): boolean {
  const orParts = splitTopLevel(expr, '||');
  if (orParts.length > 1) {
    return orParts.some(part => evaluateExpression(part, data));
  }

  const andParts = splitTopLevel(expr, '&&');
  if (andParts.length > 1) {
    return andParts.every(part => evaluateExpression(part, data));
  }

  return evaluateAtom(expr.trim(), data);
}

// Evaluate a single comparison/truthiness atom against the data.
function evaluateAtom(expr: string, data: Record<string, any>): boolean {
  // Not-equal: KEY != value or KEY !== value (checked before equality so the
  // shared '=' isn't mis-parsed as an equality comparison)
  const notEqualMatch = expr.match(/^(.+?)\s*!==?\s*(.+)$/);
  if (notEqualMatch) {
    const dataValue = data[notEqualMatch[1].trim()];
    const parsedValue = resolveValue(notEqualMatch[2].trim(), data);
    return Array.isArray(parsedValue)
      ? !parsedValue.includes(dataValue)
      : dataValue !== parsedValue;
  }

  // Equal: KEY == value or KEY === value
  const equalMatch = expr.match(/^(.+?)\s*===?\s*(.+)$/);
  if (equalMatch) {
    const dataValue = data[equalMatch[1].trim()];
    const parsedValue = resolveValue(equalMatch[2].trim(), data);
    return Array.isArray(parsedValue)
      ? parsedValue.includes(dataValue)
      : dataValue === parsedValue;
  }

  // Negated truthy check: !KEY
  const notMatch = expr.match(/^!\s*(\w+)$/);
  if (notMatch) {
    return !data[notMatch[1]];
  }

  // Bare truthy check: KEY
  return !!data[expr];
}

// Split an expression on a top-level logical operator. (No grouping support, so
// this is a plain split; quoted operator literals are not expected in templates.)
function splitTopLevel(expr: string, operator: '||' | '&&'): string[] {
  return expr.split(operator).map(part => part.trim());
}

// Resolve a condition's right-hand side: if it's a bare identifier present in
// data, compare against that variable's value; otherwise treat it as a literal.
function resolveValue(value: string, data: Record<string, any>) {
  if (/^\w+$/.test(value) && Object.prototype.hasOwnProperty.call(data, value)) {
    return data[value];
  }
  return toPrimitive(value);
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
