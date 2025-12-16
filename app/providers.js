'use client'

import { AuthProvider } from '@/src/contexts/AuthContext'

export function Providers({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

