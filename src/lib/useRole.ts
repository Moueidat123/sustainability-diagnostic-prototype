import { useEffect, useState } from 'react'
import type { Role } from './roles'

const KEY = 'sdp.activeRole'

export function useRole() {
  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem(KEY) as Role) || 'partner'
  })
  useEffect(() => {
    localStorage.setItem(KEY, role)
  }, [role])
  return { role, setRole }
}
