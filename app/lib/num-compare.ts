export function compareNumber(actual: number, expr: string) {
  const m = expr.match(/^(>=|<=|>|<|=)?\s*([\d.]+)$/);
  if (!m) return false;
  const [, op = "=", numStr] = m;
  const val = parseFloat(numStr);
  switch (op) {
    case ">": return actual > val;
    case "<": return actual < val;
    case ">=": return actual >= val;
    case "<=": return actual <= val;
    default: return actual === val;
  }
}