// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createElement } from 'react'
import * as Sentry from '@sentry/nextjs'
import GlobalError from '@/app/global-error'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

vi.mock('next/error', () => ({
  __esModule: true,
  default: function NextError({ statusCode }: { statusCode: number }) {
    return createElement('div', { 'data-testid': 'next-error' }, statusCode)
  },
}))

describe('GlobalError', () => {
  it('renders error message and reset button', () => {
    render(<GlobalError error={new Error('boom')} reset={() => {}} />)
    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Попробовать снова' })).toBeInTheDocument()
  })

  it('reports the error to Sentry', () => {
    const error = new Error('captured')
    render(<GlobalError error={error} reset={() => {}} />)
    expect(Sentry.captureException).toHaveBeenCalledWith(error)
  })
})
