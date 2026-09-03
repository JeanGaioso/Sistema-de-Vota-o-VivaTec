import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { AuthModel } from 'pocketbase'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: 'admin' | 'evaluator'
  avatar?: string
  is_active?: boolean
  quick_token?: string
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
        model.role === 'admin' ||
        email.toLowerCase().includes('admin') ||
        email.toLowerCase() === 'jeangaioso@gmail.com'
      setUser({
        id: model.id,
        email: email,
        name: model.name || (isAdminUser ? 'Comissão Organizadora (Admin)' : 'Avaliador da Banca'),
        role: isAdminUser ? 'admin' : 'evaluator',
        avatar: model.avatar,
        is_active: model.is_active !== false,
        quick_token: model.quick_token || '',
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

  const login = async (email: string, password = 'Vivatec@2026'): Promise<boolean> => {
    try {
      setIsLoading(true)
      const authData = await pb.collection('users').authWithPassword(email.trim(), password)
      // Checar se usuário está desativado
      if (authData.record && authData.record.is_active === false) {
        pb.authStore.clear()
        setUser(null)
        setRawModel(null)
        setIsLoading(false)
        console.warn('Acesso negado: avaliador desativado pela comissão.')
        return false
      }
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
      // Tenta login com a senha padrão nova (Vivatec@2026); se falhar tenta a legada (Skip@Pass)
      const ok = await login(clean, 'Vivatec@2026')
      if (ok) return true
      return await login(clean, 'Skip@Pass')
    }

    // Tentar buscar usuário no PocketBase por quick_token dinâmico
    try {
      const records = await pb.collection('users').getFullList({
        filter: `quick_token = "${clean.toLowerCase()}" || quick_token = "${clean}"`,
      })
      if (records.length > 0 && records[0].email) {
        if (records[0].is_active === false) {
          console.warn('Acesso negado: avaliador desativado pela comissão.')
          return false
        }
        const ok = await login(records[0].email, 'Vivatec@2026')
        if (ok) return true
        return await login(records[0].email, 'Skip@Pass')
      }
    } catch (err) {
      console.warn('Busca por quick_token falhou, usando fallback:', err)
    }

    // Se for token predefinido ou identificador curto de jurado (fallback)
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
      const ok = await login(mappedEmail, 'Vivatec@2026')
      if (ok) return true
      return await login(mappedEmail, 'Skip@Pass')
    }

    // Tentar autenticar com senha padrão
    const ok = await login(clean, 'Vivatec@2026')
    if (ok) return true
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
