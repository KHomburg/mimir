type OAuthCallbackPredicate = (url: string) => boolean

interface CallbackWaiter {
  predicate: OAuthCallbackPredicate
  resolve: (url: string) => void
  reject: (error: Error) => void
  timeoutId: number
}

const queuedCallbacks: string[] = []
const waiters = new Set<CallbackWaiter>()

export function publishOAuthCallback(url: string): void {
  const waiter = [...waiters].find((candidate) => candidate.predicate(url))

  if (waiter) {
    cleanupWaiter(waiter)
    waiter.resolve(url)
    return
  }

  queuedCallbacks.push(url)
}

export function waitForOAuthCallback(
  predicate: OAuthCallbackPredicate,
  timeoutMs = 120_000,
): Promise<string> {
  const queuedIndex = queuedCallbacks.findIndex(predicate)
  if (queuedIndex >= 0) {
    const [match] = queuedCallbacks.splice(queuedIndex, 1)
    if (match) {
      return Promise.resolve(match)
    }
  }

  return new Promise((resolve, reject) => {
    const waiter: CallbackWaiter = {
      predicate,
      resolve,
      reject,
      timeoutId: window.setTimeout(() => {
        cleanupWaiter(waiter)
        reject(new Error('Timed out waiting for the OAuth callback.'))
      }, timeoutMs),
    }

    waiters.add(waiter)
  })
}

function cleanupWaiter(waiter: CallbackWaiter) {
  waiters.delete(waiter)
  window.clearTimeout(waiter.timeoutId)
}
