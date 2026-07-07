/**
 * CSV generation helpers.
 * Follows RFC 4180-ish quoting: fields containing commas, double quotes,
 * or newlines are wrapped in double quotes, and inner quotes are escaped
 * as two double quotes.
 */

export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

export function generateCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const headerLine = headers.map(escapeCsvValue).join(',')

  if (rows.length === 0) {
    return headerLine + '\n'
  }

  const lines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(','),
  )

  return [headerLine, ...lines].join('\n') + '\n'
}
