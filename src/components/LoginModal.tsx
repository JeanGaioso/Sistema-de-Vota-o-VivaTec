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
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, KeyRound, Sparkles, UserCheck, AlertCircle, Users } from 'lucide-react'
import { VivaTecLogo } from './VivaTecLogo'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'quick' | 'password'
}

export function LoginModal({ isOpen, onClose, defaultTab = 'quick' }: LoginModalProps) {
  const { login, loginWithTokenOrQuickAccess } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [quickToken, setQuickToken] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handlePostLoginRedirect = () => {
    const model = pb.authStore.model
    if (!model) return
    const isSuperAdmin =
      model.role === 'admin' || model.email?.toLowerCase() === 'jeangaioso@gmail.com'
    const isOrg = model.role === 'organizer'

    if (isSuperAdmin || isOrg) {
      navigate('/admin')
    } else {
      navigate('/avaliar')
    }
  }

  const handleQuickLogin = async (tokenValue: string) => {
    setLoading(true)
    setErrorMessage('')
    const success = await loginWithTokenOrQuickAccess(tokenValue)
    setLoading(false)
    if (success) {
      toast({
        title: 'Acesso Liberado!',
        description: 'Bem-vindo(a) à plataforma Viva Tec.',
      })
      onClose()
      handlePostLoginRedirect()
    } else {
      setErrorMessage('Código de acesso ou identificador inválido ou desativado.')
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
      handlePostLoginRedirect()
    } else {
      setErrorMessage('E-mail ou senha incorretos. Verifique suas credenciais.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-6 bg-white rounded-3xl shadow-2xl border-2 border-pink-100 text-[#1A1A1A]">
        <DialogHeader className="text-center space-y-2 flex flex-col items-center">
          <div className="mx-auto mb-1">
            <VivaTecLogo iconSize="lg" showTagline={true} />
          </div>
          <DialogTitle className="text-2xl font-black text-[#1A1A1A]">
            Acesso ao Viva Tec
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 font-medium">
            Parceria Senac & Sesc • Escola Educar Sesc Monsenhor Jonas Abib
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Tabs defaultValue={defaultTab} className="w-full mt-4">
          <TabsList className="grid grid-cols-2 w-full bg-pink-50/70 p-1 rounded-xl border border-pink-100">
            <TabsTrigger
              value="quick"
              className="rounded-lg text-xs font-bold py-2 data-[state=active]:bg-[#E11D74] data-[state=active]:text-white"
            >
              <KeyRound className="w-4 h-4 mr-1.5 inline" /> Acesso Rápido / Banca
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="rounded-lg text-xs font-bold py-2 data-[state=active]:bg-[#E11D74] data-[state=active]:text-white"
            >
              <UserCheck className="w-4 h-4 mr-1.5 inline" /> E-mail & Senha
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                Código do Avaliador / Token Único
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: eval1, banca1, admin..."
                  value={quickToken}
                  onChange={(e) => setQuickToken(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && quickToken.trim()) {
                      handleQuickLogin(quickToken)
                    }
                  }}
                  className="h-12 text-base font-medium rounded-xl border-slate-300 focus:border-[#E11D74] focus:ring-[#E11D74]"
                />
                <Button
                  onClick={() => handleQuickLogin(quickToken)}
                  disabled={loading || !quickToken.trim()}
                  className="h-12 px-5 bg-[#E11D74] hover:bg-[#BE185D] text-white font-bold rounded-xl shadow-md"
                >
                  Entrar
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Acesso otimizado (&lt;60s) para tablets e smartphones dos jurados.
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
                  className="justify-between text-left h-auto py-2.5 px-3 border-pink-200 bg-pink-50/50 hover:bg-pink-100/60 text-[#1A1A1A] rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E11D74]" />
                    <div>
                      <strong className="block font-bold">
                        Avaliadora Dra. Clara (Banca Senac/Sesc)
                      </strong>
                      <span className="text-[11px] text-slate-500">evaluator1@sesc.com</span>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-[#E11D74]" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickLogin('evaluator2@sesc.com')}
                  disabled={loading}
                  className="justify-between text-left h-auto py-2.5 px-3 border-slate-200 bg-slate-50 hover:bg-slate-100 text-[#1A1A1A] rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    <div>
                      <strong className="block font-bold">Avaliador Me. Lucas (Banca Artes)</strong>
                      <span className="text-[11px] text-slate-500">evaluator2@sesc.com</span>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-slate-700" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickLogin('organizador@sesc.com')}
                  disabled={loading}
                  className="justify-between text-left h-auto py-2.5 px-3 border-pink-200 bg-pink-50/70 hover:bg-pink-100 text-[#1A1A1A] rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E11D74]" />
                    <div>
                      <strong className="block font-bold text-[#1A1A1A]">
                        Coord. Mariana Dias (Comissão Organizadora)
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        organizador@sesc.com (token: org1)
                      </span>
                    </div>
                  </div>
                  <Users className="w-4 h-4 text-[#E11D74]" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickLogin('jeangaioso@gmail.com')}
                  disabled={loading}
                  className="justify-between text-left h-auto py-2.5 px-3 border-pink-300 bg-pink-100/50 hover:bg-pink-100 text-[#1A1A1A] rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E11D74]" />
                    <div>
                      <strong className="block font-bold text-[#1A1A1A]">
                        Prof. Jean Gaioso (Admin Geral)
                      </strong>
                      <span className="text-[11px] text-slate-500">jeangaioso@gmail.com</span>
                    </div>
                  </div>
                  <Shield className="w-4 h-4 text-[#E11D74]" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="password" className="pt-3">
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  E-mail
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
                className="w-full h-11 bg-[#E11D74] hover:bg-[#BE185D] text-white font-bold rounded-xl shadow-md"
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
