import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { AuthModel } from 'pocketbase'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: 'admin' | 'evaluator'
  avatar?: string
}

interface AuthContextType {
  user: UserProfile | null
  rawModel: AuthModel | null
  isAuthenticated: boolean
  isAdmin: boolean
  isEvaluator: boolean
  isLoading: boolean
  login: (email: string, password?: string) => Promise<boolean>
  loginWithTokenOrQuickAccess: (emailOrToken: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [rawModel, setRawModel] = useState<AuthModel | null>(pb.authStore.model)
  const [isLoading, setIsLoading] = useState(true)

  const updateUserFromStore = () => {
    const model = pb.authStore.model
    setRawModel(model)
    if (pb.authStore.isValid && model) {
      const email = model.email || ''
      const isAdminUser =
        email.toLowerCase().includes('admin') || email.toLowerCase() === 'jeangaioso@gmail.com'
      setUser({
        id: model.id,
        email: email,
        name: model.name || (isAdminUser ? 'Comissão Organizadora (Admin)' : 'Avaliador da Banca'),
        role: isAdminUser ? 'admin' : 'evaluator',
        avatar: model.avatar,
      })
    } else {
      setUser(null)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    updateUserFromStore()
    const unsubscribe = pb.authStore.onChange(() => {
      updateUserFromStore()
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password = 'Skip@Pass'): Promise<boolean> => {
    try {
      setIsLoading(true)
      await pb.collection('users').authWithPassword(email.trim(), password)
      updateUserFromStore()
      return true
    } catch (error) {
      console.error('Falha ao autenticar:', error)
      setIsLoading(false)
      return false
    }
  }

  // Suporte a login rápido / Token / QR code (sem digitação de senha complexa para tablets/smartphones da banca)
  const loginWithTokenOrQuickAccess = async (input: string): Promise<boolean> => {
    const clean = input.trim()
    if (!clean) return false

    // Se for email direto
    if (clean.includes('@')) {
      return await login(clean, 'Skip@Pass')
    }

    // Se for token predefinido ou identificador curto de jurado
    const tokenMap: Record<string, string> = {
      admin: 'jeangaioso@gmail.com',
      'sesc-admin': 'jeangaioso@gmail.com',
      evaluator1: 'evaluator1@sesc.com',
      eval1: 'evaluator1@sesc.com',
      banca1: 'evaluator1@sesc.com',
      evaluator2: 'evaluator2@sesc.com',
      eval2: 'evaluator2@sesc.com',
      banca2: 'evaluator2@sesc.com',
    }

    const mappedEmail = tokenMap[clean.toLowerCase()]
    if (mappedEmail) {
      return await login(mappedEmail, 'Skip@Pass')
    }

    // Tentar autenticar com senha padrão
    return await login(clean, 'Skip@Pass')
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setRawModel(null)
  }

  const isAdmin = user?.role === 'admin'
  const isEvaluator = user?.role === 'evaluator'

  return (
    <AuthContext.Provider
      value={{
        user,
        rawModel,
        isAuthenticated: !!user,
        isAdmin,
        isEvaluator,
        isLoading,
        login,
        loginWithTokenOrQuickAccess,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
