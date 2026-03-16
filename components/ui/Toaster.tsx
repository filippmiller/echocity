'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      offset={72}
      toastOptions={{
        className: 'text-sm font-medium',
        duration: 3500,
        style: {
          borderRadius: '12px',
        },
      }}
    />
  )
}
