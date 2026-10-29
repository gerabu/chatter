// @vitest-environment jsdom

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DummyButton } from '@/components/DummyButton'

describe('DummyButton', () => {
  it('renders a button with text Click Me', () => {
    render(<DummyButton />)
    // Initially expects a button which doesn't exist
    expect(screen.getByRole('button', { name: /Click Me/i })).toBeDefined()
  })
})
