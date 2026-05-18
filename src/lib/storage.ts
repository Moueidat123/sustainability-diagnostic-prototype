import { useEffect, useRef, useState } from 'react'

/**
 * Reactive localStorage value. All components using the same key
 * stay in sync via the 'storage' event + a same-tab CustomEvent.
 *
 * Important: we compare serialized values to avoid infinite re-render
 * loops caused by JSON.parse always returning a new object reference.
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
  const lastWritten = useRef<string>(JSON.stringify(value))

  // Write on change + notify other components (skip if nothing actually changed)
  useEffect(() => {
    const serialized = JSON.stringify(value)
    if (serialized === lastWritten.current && localStorage.getItem(key) === serialized) {
      return
    }
    lastWritten.current = serialized
    localStorage.setItem(key, serialized)
    window.dispatchEvent(new CustomEvent('sdp:storage', { detail: { key } }))
  }, [key, value])

  // Listen for changes coming from OTHER instances / tabs
  useEffect(() => {
    const apply = () => {
      const raw = localStorage.getItem(key)
      const serialized = raw ?? JSON.stringify(initial)
      if (serialized === lastWritten.current) return
      lastWritten.current = serialized
      try {
        setValue(raw ? (JSON.parse(raw) as T) : initial)
      } catch {
        setValue(initial)
      }
    }
    const onStorage = (e: StorageEvent) => { if (e.key === key) apply() }
    const onCustom  = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>
      if (ce.detail?.key === key) apply()
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
