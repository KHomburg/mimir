import { invoke } from '@tauri-apps/api/core'
import { isTauriRuntime } from './runtime'

export interface RustHealth {
  status: 'ok' | 'browser'
  message: string
}

export async function getRustHealth(): Promise<RustHealth> {
  if (!isTauriRuntime()) {
    return {
      status: 'browser',
      message: 'Browser preview mode: the Rust bridge activates when the app runs inside Tauri.',
    }
  }
  return invoke<RustHealth>('health_check')
}

export async function storeOAuthCallback(url: string): Promise<string> {
  if (!url.startsWith('mimir://')) {
    throw new Error('OAuth callbacks must use the mimir:// scheme.')
  }
  if (!isTauriRuntime()) return url
  return invoke<string>('store_oauth_callback', { url })
}
