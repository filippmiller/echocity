'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const MILESTONES = [500, 1000, 2500, 5000, 10000]
const LS_KEY = 'echocity_milestones_shown'

function getShownMilestones(): number[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

function markMilestoneShown(milestone: number) {
  try {
    const shown = getShownMilestones()
    if (!shown.includes(milestone)) {
      shown.push(milestone)
      localStorage.setItem(LS_KEY, JSON.stringify(shown))
    }
  } catch {}
}

function formatRubles(amount: number): string {
  return amount.toLocaleString('ru-RU')
}

// Simple confetti particle data
interface Particle {
  id: number
  x: number
  color: string
  size: number
  delay: number
  duration: number
  rotation: number
}

function generateParticles(count: number): Particle[] {
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#f97316']
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 6,
    delay: Math.random() * 0.6,
    duration: Math.random() * 1.5 + 1.5,
    rotation: Math.random() * 360,
  }))
}

const PARTICLES = generateParticles(40)

export function SavingsMilestoneCelebration() {
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null)

  const checkMilestones = useCallback(async () => {
    try {
      const res = await fetch('/api/savings')
      if (!res.ok) return
      const data: { totalSaved: number } = await res.json()
      const totalSaved = data.totalSaved

      const shown = getShownMilestones()
      // Find the highest milestone that has been crossed but not yet shown
      const pending = MILESTONES.filter((m) => totalSaved >= m && !shown.includes(m))
      if (pending.length > 0) {
        // Show the highest one first
        const highest = pending[pending.length - 1]
        setActiveMilestone(highest)
      }
    } catch {}
  }, [])

  useEffect(() => {
    // Small delay to avoid hydration flash
    const timer = setTimeout(checkMilestones, 1500)
    return () => clearTimeout(timer)
  }, [checkMilestones])

  const handleDismiss = () => {
    if (activeMilestone !== null) {
      markMilestoneShown(activeMilestone)
    }
    setActiveMilestone(null)
  }

  return (
    <AnimatePresence>
      {activeMilestone !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {PARTICLES.map((p) => (
              <motion.div
                key={p.id}
                initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
                animate={{
                  y: '110vh',
                  opacity: [1, 1, 0.8, 0],
                  rotate: p.rotation,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: 'easeIn',
                  repeat: Infinity,
                  repeatDelay: 0.3,
                }}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  top: 0,
                }}
              />
            ))}
          </div>

          {/* Celebration card */}
          <motion.div
            initial={{ scale: 0.5, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Emoji burst */}
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 250 }}
              className="text-6xl mb-4 select-none"
            >
              🎉
            </motion.div>

            {/* Amount */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-5xl font-black text-gray-900 mb-2"
            >
              {formatRubles(activeMilestone)} ₽
            </motion.p>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-lg font-medium text-gray-600 mb-6"
            >
              Вы сэкономили с ГдеСейчас!
            </motion.p>

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              onClick={handleDismiss}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-2xl transition-colors text-sm"
            >
              Продолжить экономить
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
