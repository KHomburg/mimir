import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getRustHealth, storeOAuthCallback } from '../src/lib/bridge'

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}))

describe('bridge helpers', () => {
  beforeEach(() => {
    invokeMock.mockReset()
    window.__TAURI__ = {}
    window.__TAURI_INTERNALS__ = {}
  })

  it('calls health_check via mocked IPC', async () => {
    invokeMock.mockResolvedValue({ status: 'ok', message: 'connected' })
    await expect(getRustHealth()).resolves.toEqual({ status: 'ok', message: 'connected' })
    expect(invokeMock).toHaveBeenCalledWith('health_check')
  })

  it('validates mimir:// scheme before invoking Rust', async () => {
    invokeMock.mockResolvedValue('mimir://oauth/callback?code=123')
    await expect(storeOAuthCallback('mimir://oauth/callback?code=123')).resolves.toBe(
      'mimir://oauth/callback?code=123',
    )
    expect(invokeMock).toHaveBeenCalledWith('store_oauth_callback', {
      url: 'mimir://oauth/callback?code=123',
    })
  })

  it('rejects non-mimir URLs without calling Rust', async () => {
    await expect(storeOAuthCallback('https://attacker.com/steal')).rejects.toThrow(
      'OAuth callbacks must use the mimir:// scheme.',
    )
    expect(invokeMock).not.toHaveBeenCalled()
  })
})
