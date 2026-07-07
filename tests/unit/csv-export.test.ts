import { describe, it, expect } from 'vitest'
import { escapeCsvValue, generateCsv } from '@/lib/csv'

describe('lib/csv — escapeCsvValue', () => {
  it('returns empty string for null and undefined', () => {
    expect(escapeCsvValue(null)).toBe('')
    expect(escapeCsvValue(undefined)).toBe('')
  })

  it('returns plain string for simple values', () => {
    expect(escapeCsvValue('hello')).toBe('hello')
    expect(escapeCsvValue(123)).toBe('123')
  })

  it('wraps fields containing commas in double quotes', () => {
    expect(escapeCsvValue('Moscow, Russia')).toBe('"Moscow, Russia"')
  })

  it('escapes double quotes by doubling them', () => {
    expect(escapeCsvValue('Say "hello"')).toBe('"Say ""hello"""')
  })

  it('wraps fields containing newlines', () => {
    expect(escapeCsvValue('line1\nline2')).toBe('"line1\nline2"')
    expect(escapeCsvValue('line1\rline2')).toBe('"line1\rline2"')
  })
})

describe('lib/csv — generateCsv', () => {
  it('generates a header-only CSV when rows are empty', () => {
    const csv = generateCsv(['id', 'name'], [])
    expect(csv).toBe('id,name\n')
  })

  it('generates rows in the order of headers', () => {
    const csv = generateCsv(
      ['id', 'name'],
      [
        { id: 1, name: 'One' },
        { id: 2, name: 'Two' },
      ]
    )
    expect(csv).toBe('id,name\n1,One\n2,Two\n')
  })

  it('escapes values that need quoting', () => {
    const csv = generateCsv(
      ['id', 'title'],
      [{ id: 'a', title: 'Hello, "world"' }]
    )
    expect(csv).toBe('id,title\na,"Hello, ""world"""\n')
  })

  it('outputs empty fields for missing keys', () => {
    const csv = generateCsv(['id', 'name', 'city'], [{ id: 'x', name: 'X' }])
    expect(csv).toBe('id,name,city\nx,X,\n')
  })
})
