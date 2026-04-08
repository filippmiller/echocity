'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CollapsibleSectionProps {
  id: string // unique key for localStorage
  children: ReactNode
  defaultOpen?: boolean
}

/**
 * Wraps a feed section with collapse/expand. Remembers state in localStorage.
 * First-time visitors see all sections open. Returning visitors see remembered state.
 * Hides the toggle when children render as empty (no visible content).
 */
export function CollapsibleSection({ id, children, defaultOpen = true }: CollapsibleSectionProps) {
  const storageKey = `echocity_section_${id}`
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [initialized, setInitialized] = useState(false)
  const [hasContent, setHasContent] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) {
        setIsOpen(stored === '1')
      }
    } catch {
      // localStorage unavailable
    }
    setInitialized(true)
  }, [storageKey])

  // Detect whether children actually rendered visible content
  useEffect(() => {
    if (!contentRef.current || !isOpen) return
    const observer = new MutationObserver(() => {
      if (contentRef.current) {
        const text = contentRef.current.textContent?.trim() || ''
        const childElements = contentRef.current.querySelectorAll('a, button, img, [role]')
        setHasContent(text.length > 0 || childElements.length > 0)
      }
    })
    // Check immediately
    const text = contentRef.current.textContent?.trim() || ''
    const childElements = contentRef.current.querySelectorAll('a, button, img, [role]')
    setHasContent(text.length > 0 || childElements.length > 0)
    // Watch for async content loading
    observer.observe(contentRef.current, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [isOpen, children])

  const toggle = () => {
    setIsOpen((prev) => {
      const next = !prev
      try { localStorage.setItem(storageKey, next ? '1' : '0') } catch {}
      return next
    })
  }

  // Don't render collapse button until initialized (prevents flash)
  if (!initialized) return <>{children}</>

  return (
    <div>
      {isOpen ? (
        <div ref={contentRef}>{children}</div>
      ) : hasContent ? (
        <button
          onClick={toggle}
          className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Показать раздел
        </button>
      ) : null}
      {isOpen && hasContent && (
        <button
          onClick={toggle}
          className="w-full flex items-center justify-center gap-1 py-1 text-[10px] text-gray-300 hover:text-gray-500 transition-colors"
        >
          <ChevronUp className="w-3 h-3" />
          Свернуть
        </button>
      )}
    </div>
  )
}
