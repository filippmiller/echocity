'use client'

import { useEffect, useState } from 'react'

interface HeatmapCell {
  day: number   // 0=Пн … 6=Вс
  hour: number  // 0–23
  count: number
}

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function cellColor(count: number, max: number): string {
  if (count === 0 || max === 0) return '#f3f4f6' // gray-100
  const intensity = count / max
  if (intensity < 0.2) return '#dcfce7'  // green-100
  if (intensity < 0.4) return '#86efac'  // green-300
  if (intensity < 0.6) return '#4ade80'  // green-400
  if (intensity < 0.8) return '#22c55e'  // green-500
  return '#16a34a'                        // green-600
}

export default function RedemptionHeatmap() {
  const [cells, setCells] = useState<HeatmapCell[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/business/analytics/heatmap')
      .then((r) => r.json())
      .then((data) => {
        setCells(data.cells || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Build a 7x24 matrix for easy rendering
  const matrix: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))
  for (const cell of cells) {
    matrix[cell.day][cell.hour] = cell.count
  }
  const maxCount = Math.max(...cells.map((c) => c.count), 1)

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Тепловая карта использований (30 дней)</h2>
        <div className="h-40 flex items-center justify-center text-sm text-gray-400">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">
        Тепловая карта использований{' '}
        <span className="font-normal text-gray-400">(последние 30 дней)</span>
      </h2>

      {cells.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">Нет данных за последние 30 дней</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            {/* Hour labels row */}
            <div className="flex mb-1">
              {/* Spacer for day labels */}
              <div className="w-7 flex-shrink-0" />
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className="flex-1 text-center"
                  style={{ minWidth: '20px' }}
                >
                  {h % 4 === 0 ? (
                    <span className="text-[9px] text-gray-400">{h}</span>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Day rows */}
            {DAY_LABELS.map((dayLabel, dayIdx) => (
              <div key={dayIdx} className="flex items-center mb-[3px]">
                <div className="w-7 flex-shrink-0 text-[10px] text-gray-500 font-medium pr-1 text-right">
                  {dayLabel}
                </div>
                {matrix[dayIdx].map((count, hourIdx) => (
                  <div
                    key={hourIdx}
                    className="flex-1 rounded-[2px] mx-[1px]"
                    style={{
                      minWidth: '18px',
                      height: '18px',
                      backgroundColor: cellColor(count, maxCount),
                    }}
                    title={count > 0 ? `${dayLabel} ${hourIdx}:00 — ${count} использов.` : undefined}
                  />
                ))}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] text-gray-400">Мало</span>
              {['#dcfce7', '#86efac', '#4ade80', '#22c55e', '#16a34a'].map((color) => (
                <div
                  key={color}
                  className="w-4 h-4 rounded-[2px]"
                  style={{ backgroundColor: color }}
                />
              ))}
              <span className="text-[10px] text-gray-400">Много</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
