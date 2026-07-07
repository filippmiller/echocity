import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

function readPublic(file: string) {
  return fs.readFileSync(path.join(process.cwd(), 'public', file), 'utf-8')
}

function publicPath(file: string) {
  return path.join(process.cwd(), 'public', file)
}

describe('PWA static assets', () => {
  it('GET /manifest.json returns valid JSON with PNG icons', () => {
    const raw = readPublic('manifest.json')
    const manifest = JSON.parse(raw)
    expect(manifest.name).toBeDefined()
    expect(manifest.scope).toBe('/')
    expect(manifest.start_url).toBe('/offers')
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons.length).toBeGreaterThan(0)

    const pngIcons = manifest.icons.filter((icon: { src?: string; type?: string }) =>
      icon.type === 'image/png'
    )
    expect(pngIcons.length).toBeGreaterThanOrEqual(2)

    for (const icon of manifest.icons) {
      expect(icon.src).toMatch(/^\//)
      expect(icon.sizes).toBeDefined()
      expect(icon.type).toMatch(/^image\//)
      expect(['any', 'maskable'].includes(icon.purpose)).toBe(true)
    }
  })

  it('PNG icon files exist and are non-empty', () => {
    const icons = ['icon-192.png', 'icon-512.png', 'icon-192-maskable.png', 'icon-512-maskable.png']
    for (const icon of icons) {
      const filePath = publicPath(icon)
      expect(fs.existsSync(filePath), `expected ${icon} to exist`).toBe(true)
      const stats = fs.statSync(filePath)
      expect(stats.size).toBeGreaterThan(0)
    }
  })

  it('apple-touch-icon and badge files exist', () => {
    expect(fs.existsSync(publicPath('apple-touch-icon.png'))).toBe(true)
    expect(fs.existsSync(publicPath('badge-72.png'))).toBe(true)
  })

  it('GET /sw.js caches PWA icon assets and uses PNG notification icon', () => {
    const sw = readPublic('sw.js')
    expect(sw).toContain('const CACHE_NAME')
    expect(sw).toContain("'/offline'")
    expect(sw).toContain('caches.match(\'/offline\')')
    expect(sw).toContain('self.addEventListener(\'push\',')
    expect(sw).toContain('self.addEventListener(\'notificationclick\',')
    expect(sw).toContain("'/icon-192.png'")
    expect(sw).toContain("'/icon-512.png'")
    expect(sw).toContain("'/badge-72.png'")
    expect(sw).toContain("icon: data.icon || '/icon-192.png'")
  })

  it('GET /offline returns HTML/200 via existing page', () => {
    const pagePath = path.join(process.cwd(), 'app', 'offline', 'page.tsx')
    const retryButtonPath = path.join(process.cwd(), 'app', 'offline', 'RetryButton.tsx')
    expect(fs.existsSync(pagePath)).toBe(true)
    expect(fs.existsSync(retryButtonPath)).toBe(true)
    const page = fs.readFileSync(pagePath, 'utf-8')
    const retryButton = fs.readFileSync(retryButtonPath, 'utf-8')
    expect(page).toContain('Нет соединения')
    expect(page).toContain('Проверьте интернет и попробуйте снова')
    expect(page).toContain('<RetryButton />')
    expect(retryButton).toContain('"use client"')
    expect(retryButton).toContain('window.location.reload()')
  })
})
