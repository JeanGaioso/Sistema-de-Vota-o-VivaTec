import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { AuthModel } from 'pocketbase'

export type UserRole = 'admin' | 'organizer' | 'evaluator'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  is_active?: boolean
  is_evaluator?: boolean
  quick_token?: string
}

interface AuthContextType {
  user: UserProfile | null
  rawModel: AuthModel | null
  isAuthenticated: boolean
  isAdmin: boolean // admin geral ou organizador da comissão (ambos têm acesso administrativo)
  isMasterAdmin: boolean // admin super/root (role === 'admin')
  isOrganizer: boolean // organizador (role === 'organizer')
  isEvaluator: boolean // condição de avaliador ativa (pode avaliar e aparecer na banca)
  canEvaluate: boolean // sinônimo explícito para isEvaluator
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
      const isSuperAdmin = model.role === 'admin' || email.toLowerCase() === 'jeangaioso@gmail.com'

      const isOrg = model.role === 'organizer'
      const role: UserRole = isSuperAdmin ? 'admin' : isOrg ? 'organizer' : 'evaluator'

      // Condição de avaliador:
      // Se for evaluator -> true (a menos que explicitamente falso)
      // Se for admin/organizer -> checar model.is_evaluator === true (ou admin default true)
      const canEval =
        model.role === 'evaluator'
          ? model.is_evaluator !== false
          : model.is_evaluator === true || isSuperAdmin

      let defaultName = 'Avaliador da Banca'
      if (isSuperAdmin) defaultName = 'Comissão Organizadora (Admin Geral)'
      else if (isOrg) defaultName = 'Comissão Organizadora'

      setUser({
        id: model.id,
        email: email,
        name: model.name || defaultName,
        role,
        avatar: model.avatar,
        is_active: model.is_active !== false,
        is_evaluator: canEval,
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

    // 1. Tentar login direto via endpoint seguro do backend (/backend/v1/quick-login)
    try {
      const res = await pb.send<{ token: string; record: Record<string, any> }>(
        '/backend/v1/quick-login',
        {
          method: 'POST',
          body: { token: clean },
        },
      )

      if (res && res.token && res.record) {
        pb.authStore.save(res.token, res.record as unknown as AuthModel)
        updateUserFromStore()
        return true
      }
    } catch (backendErr) {
      console.warn(
        'Endpoint /backend/v1/quick-login falhou ou indisponível, tentando SDK:',
        backendErr,
      )
    }

    // 2. Tentar buscar usuário no PocketBase por quick_token exato ou minúsculo
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

    // 3. Se for token predefinido de jurado, organizador ou admin (fallback de contingência)
    const tokenMap: Record<string, string> = {
      admin: 'jeangaioso@gmail.com',
      'sesc-admin': 'jeangaioso@gmail.com',
      evaluator1: 'evaluator1@sesc.com',
      eval1: 'evaluator1@sesc.com',
      banca1: 'evaluator1@sesc.com',
      evaluator2: 'evaluator2@sesc.com',
      eval2: 'evaluator2@sesc.com',
      banca2: 'evaluator2@sesc.com',
      tec3: 'profmauro@vivatec.com.br',
      org1: 'organizador@sesc.com',
    }

    const mappedEmail = tokenMap[clean.toLowerCase()]
    if (mappedEmail) {
      const ok = await login(mappedEmail, 'Vivatec@2026')
      if (ok) return true
      return await login(mappedEmail, 'Skip@Pass')
    }

    // 4. Último recurso: tentar login direto com o input como e-mail
    const ok = await login(clean, 'Vivatec@2026')
    if (ok) return true
    return await login(clean, 'Skip@Pass')
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setRawModel(null)
  }

  const isMasterAdmin = user?.role === 'admin'
  const isOrganizer = user?.role === 'organizer'
  // Qualquer membro da Comissão Organizadora (admin ou organizer) possui acesso administrativo ao painel
  const isAdmin = isMasterAdmin || isOrganizer
  // Condição de avaliador ativa
  const canEvaluate = !!user?.is_evaluator && user?.is_active !== false
  const isEvaluator = canEvaluate

  return (
    <AuthContext.Provider
      value={{
        user,
        rawModel,
        isAuthenticated: !!user,
        isAdmin,
        isMasterAdmin,
        isOrganizer,
        isEvaluator,
        canEvaluate,
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
