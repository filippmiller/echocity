'use client'

import { useState, useCallback } from 'react'

interface AuthPromptState {
  isOpen: boolean
  reason: string
  redirectTo?: string
}

export function useAuthPrompt() {
  const [state, setState] = useState<AuthPromptState>({
    isOpen: false,
    reason: '',
  })

  const showAuthPrompt = useCallback((reason: string, redirectTo?: string) => {
    setState({ isOpen: true, reason, redirectTo })
  }, [])

  const hideAuthPrompt = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }))
  }, [])

  return {
    authPromptProps: {
      isOpen: state.isOpen,
      onClose: hideAuthPrompt,
      reason: state.reason,
      redirectTo: state.redirectTo,
    },
    showAuthPrompt,
    hideAuthPrompt,
  }
}
