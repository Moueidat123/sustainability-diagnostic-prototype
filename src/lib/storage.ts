import { useEffect, useState } from 'react'

/**
 * Reactive localStorage value. All components using the same key
 * stay in sync via the 'storage' event + a same-tab CustomEvent.
 */
export function useLocalState<T>(key: string, initial: T) {
  const read = (): T => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  }

  const [value, setValue] = useState<T>(read)

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent('sdp:storage', { detail: { key } }))
  }, [key, value])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(read())
    }
    const onCustom = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>
      if (ce.detail?.key === key) setValue(read())
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('sdp:storage', onCustom as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('sdp:storage', onCustom as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, setValue] as const
}

export function uid() {
  return Math.random().toString(36).slice(2, 10)
}
