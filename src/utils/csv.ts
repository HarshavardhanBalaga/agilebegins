/**
 * Minimal RFC-4180-ish CSV generator. Each cell is escaped and formula
 * injection is guarded by csvCell().
 */
export function toCsv(headers: string[], rows: string[][]): string {
  const escapeCell = (value: string): string => {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}