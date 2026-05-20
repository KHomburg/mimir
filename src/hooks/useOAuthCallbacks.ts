import { useEffect, useState } from 'react'
import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { storeOAuthCallback } from '../lib/bridge'
import { isTauriRuntime } from '../lib/runtime'

export function useOAuthCallbacks() {
  const [lastCallback, setLastCallback] = useState<string>()
  const [callbackError, setCallbackError] = useState<string>()

  useEffect(() => {
    if (!isTauriRuntime()) return

    let cancelled = false
    let detach: (() => void) | undefined

    const handleUrls = async (urls: string[]) => {
      for (const url of urls) {
        try {
          const stored = await storeOAuthCallback(url)
          if (!cancelled) {
            setLastCallback(stored)
            setCallbackError(undefined)
          }
        } catch (error) {
          if (!cancelled) {
            setCallbackError(error instanceof Error ? error.message : 'Failed to store OAuth callback.')
          }
        }
      }
    }

    void getCurrent().then((urls) => {
      if (urls?.length) {
        void handleUrls(urls)
      }
    })

    void onOpenUrl((urls) => {
      void handleUrls(urls)
    }).then((unlisten) => {
      detach = unlisten
    })

    return () => {
      cancelled = true
      detach?.()
    }
  }, [])

  return {
    lastCallback,
    callbackError,
  }
}
