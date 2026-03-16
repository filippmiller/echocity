'use client'

import { useEffect, useRef, useState } from 'react'

interface ScanResult {
  success: boolean
  error?: string
  message?: string
  redemption?: {
    id: string
    offerTitle: string
    benefitType: string
    benefitValue: number
  }
}

export function QRScanner() {
  const [mode, setMode] = useState<'camera' | 'code'>('code')
  const [shortCode, setShortCode] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<any>(null)

  const handleValidate = async (token?: string, code?: string) => {
    setScanning(true)
    setResult(null)
    try {
      const res = await fetch('/api/redemptions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: token, shortCode: code }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ success: false, error: 'NETWORK_ERROR', message: 'Ошибка сети' })
    }
    setScanning(false)
  }

  const startCamera = async () => {
    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode')
      if (scannerRef.current) return

      const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false)
      scannerRef.current = scanner

      scanner.render(
        (decodedText: string) => {
          scanner.clear()
          scannerRef.current = null
          handleValidate(decodedText)
        },
        () => {}
      )
    } catch {
      setResult({ success: false, message: 'Не удалось запустить камеру' })
    }
  }

  useEffect(() => {
    if (mode === 'camera') startCamera()
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [mode])

  return (
    <div className="max-w-md mx-auto">
      <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setMode('camera')}
          className={`flex-1 py-2 text-sm rounded-md ${mode === 'camera' ? 'bg-white shadow-sm font-medium' : 'text-gray-600'}`}
        >
          Сканировать QR
        </button>
        <button
          onClick={() => setMode('code')}
          className={`flex-1 py-2 text-sm rounded-md ${mode === 'code' ? 'bg-white shadow-sm font-medium' : 'text-gray-600'}`}
        >
          Ввести код
        </button>
      </div>

      {mode === 'camera' && <div id="qr-reader" className="mb-4" />}

      {mode === 'code' && (
        <div className="space-y-3">
          <input
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value.toUpperCase())}
            placeholder="XXXXXX"
            maxLength={6}
            className="w-full text-center text-2xl font-mono tracking-widest border rounded-lg p-3"
          />
          <button
            onClick={() => handleValidate(undefined, shortCode)}
            disabled={shortCode.length < 6 || scanning}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {scanning ? 'Проверка...' : 'Проверить'}
          </button>
        </div>
      )}

      {result && (
        <div className={`mt-4 p-4 rounded-lg text-center ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.success ? (
            <>
              <div className="text-3xl text-green-600 mb-2">OK</div>
              <p className="font-medium text-green-800">{result.redemption?.offerTitle}</p>
              <p className="text-sm text-green-600">
                {result.redemption?.benefitType === 'PERCENT'
                  ? `-${result.redemption.benefitValue}%`
                  : `${result.redemption?.benefitValue}`}
              </p>
            </>
          ) : (
            <>
              <div className="text-3xl text-red-600 mb-2">X</div>
              <p className="font-medium text-red-800">{result.message || result.error}</p>
            </>
          )}
          <button onClick={() => { setResult(null); setShortCode('') }} className="mt-3 text-sm text-gray-600 hover:underline">
            Сканировать ещё
          </button>
        </div>
      )}
    </div>
  )
}
