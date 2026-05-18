import { useEffect, useState } from 'react'
import type { Role } from './roles'

const KEY = 'sdp.activeRole'
const EVENT = 'sdp:role'

function readRole(): Role {
  return (localStorage.getItem(KEY) as Role) || 'partner'
}

export function useRole() {
  const [role, setRoleState] = useState<Role>(readRole)

  // Persist + broadcast so EVERY useRole() instance updates in sync
  const setRole = (r: Role) => {
    localStorage.setItem(KEY, r)
    setRoleState(r)
    window.dispatchEvent(new CustomEvent(EVENT, { detail: r }))
  }

  // Listen for changes from other components (same tab) or other tabs
  useEffect(() => {
    const onCustom = (e: Event) => {
      const r = (e as CustomEvent<Role>).detail
      if (r) setRoleState(r)
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) setRoleState(e.newValue as Role)
    }
    window.addEventListener(EVENT, onCustom as EventListener)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(EVENT, onCustom as EventListener)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return { role, setRole }
}
