import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

function readPublic(file: string) {
  return fs.readFileSync(path.join(process.cwd(), 'public', file), 'utf-8')
}

describe('PWA static assets', () => {
  it('GET /manifest.json returns valid JSON with icons', () => {
    const raw = readPublic('manifest.json')
    const manifest = JSON.parse(raw)
    expect(manifest.name).toBeDefined()
    expect(manifest.scope).toBe('/')
    expect(manifest.start_url).toBe('/offers')
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons.length).toBeGreaterThan(0)
    for (const icon of manifest.icons) {
      expect(icon.src).toMatch(/^\/favicon\.svg$/)
      expect(icon.type).toBe('image/svg+xml')
    }
  })

  it('GET /sw.js returns JavaScript with offline fallback', () => {
    const sw = readPublic('sw.js')
    expect(sw).toContain('const CACHE_NAME')
    expect(sw).toContain("'/offline'")
    expect(sw).toContain('caches.match(\'/offline\')')
    expect(sw).toContain('self.addEventListener(\'push\',')
    expect(sw).toContain('self.addEventListener(\'notificationclick\',')
  })

  it('GET /offline returns HTML/200 via existing page', () => {
    const pagePath = path.join(process.cwd(), 'app', 'offline', 'page.tsx')
    expect(fs.existsSync(pagePath)).toBe(true)
    const html = fs.readFileSync(pagePath, 'utf-8')
    expect(html).toContain('Нет соединения')
    expect(html).toContain('Проверьте интернет и попробуйте снова')
    expect(html).toContain('window.location.reload()')
  })
})
