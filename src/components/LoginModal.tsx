import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, KeyRound, Sparkles, UserCheck, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'quick' | 'password'
}

export function LoginModal({ isOpen, onClose, defaultTab = 'quick' }: LoginModalProps) {
  const { login, loginWithTokenOrQuickAccess } = useAuth()
  const { toast } = useToast()

  const [quickToken, setQuickToken] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleQuickLogin = async (tokenValue: string) => {
    setLoading(true)
    setErrorMessage('')
    const success = await loginWithTokenOrQuickAccess(tokenValue)
    setLoading(false)
    if (success) {
      toast({
        title: 'Acesso Liberado!',
        description: 'Bem-vindo(a) à plataforma HeroScore Sesc.',
      })
      onClose()
    } else {
      setErrorMessage('Código de acesso ou identificador inválido.')
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    const success = await login(email, password)
    setLoading(false)
    if (success) {
      toast({
        title: 'Autenticado com Sucesso!',
        description: 'Painel carregado com suas permissões.',
      })
      onClose()
    } else {
      setErrorMessage('E-mail ou senha incorretos. Verifique suas credenciais.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-6 bg-white rounded-2xl shadow-2xl border-2 border-[#1A237E]/20">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#1A237E] flex items-center justify-center text-[#FFD600] shadow-md">
            <Shield className="w-8 h-8" />
          </div>
          <DialogTitle className="text-2xl font-bold text-[#1A237E]">
            Acesso ao HeroScore
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Escola Educar Sesc Monsenhor Jonas Abib • Festival de Heróis Fictícios
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Tabs defaultValue={defaultTab} className="w-full mt-4">
          <TabsList className="grid grid-cols-2 w-full bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="quick" className="rounded-lg text-xs font-semibold py-2">
              <KeyRound className="w-4 h-4 mr-1.5 inline" /> Acesso Rápido / Banca
            </TabsTrigger>
            <TabsTrigger value="password" className="rounded-lg text-xs font-semibold py-2">
              <UserCheck className="w-4 h-4 mr-1.5 inline" /> E-mail & Senha
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1A237E] uppercase tracking-wider">
                Código do Avaliador / Token Único
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: eval1, banca2, admin..."
                  value={quickToken}
                  onChange={(e) => setQuickToken(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && quickToken.trim()) {
                      handleQuickLogin(quickToken)
                    }
                  }}
                  className="h-12 text-base font-medium rounded-xl border-slate-300 focus:border-[#1A237E]"
                />
                <Button
                  onClick={() => handleQuickLogin(quickToken)}
                  disabled={loading || !quickToken.trim()}
                  className="h-12 px-5 bg-[#1A237E] hover:bg-[#283593] text-white font-bold rounded-xl shadow-md"
                >
                  Entrar
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Acesse em menos de 60 segundos com o token distribuído pela comissão.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <p className="text-xs font-bold text-slate-500 mb-2">
                Atalhos de demonstração (Clique para entrar):
              </p>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickLogin('evaluator1@sesc.com')}
                  disabled={loading}
                  className="justify-between text-left h-auto py-2.5 px-3 border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-slate-800 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div>
                      <strong className="block font-semibold">
                        Avaliadora Dra. Clara (Banca Sesc)
                      </strong>
                      <span className="text-[11px] text-slate-500">evaluator1@sesc.com</span>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickLogin('evaluator2@sesc.com')}
                  disabled={loading}
                  className="justify-between text-left h-auto py-2.5 px-3 border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-slate-800 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <div>
                      <strong className="block font-semibold">
                        Avaliador Me. Lucas (Banca Artes)
                      </strong>
                      <span className="text-[11px] text-slate-500">evaluator2@sesc.com</span>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickLogin('jeangaioso@gmail.com')}
                  disabled={loading}
                  className="justify-between text-left h-auto py-2.5 px-3 border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-slate-800 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1A237E]" />
                    <div>
                      <strong className="block font-semibold text-[#1A237E]">
                        Comissão Sesc (Admin Geral)
                      </strong>
                      <span className="text-[11px] text-slate-500">jeangaioso@gmail.com</span>
                    </div>
                  </div>
                  <Shield className="w-4 h-4 text-[#1A237E]" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="password" className="pt-3">
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  E-mail institucional
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@sesc.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl border-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl border-slate-300"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#1A237E] hover:bg-[#283593] text-white font-bold rounded-xl shadow-md"
              >
                {loading ? 'Entrando...' : 'Entrar com Senha'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
