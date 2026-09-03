import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { evaluatorsService, auditLogsService } from '@/services/api'
import { EvaluatorUser } from '@/types'
import { Users, UserPlus, Edit3, KeyRound, Sparkles, Shield } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface OrganizerModalProps {
  isOpen: boolean
  onClose: () => void
  organizer: EvaluatorUser | null
  onSuccess: () => void
}

export function OrganizerModal({ isOpen, onClose, organizer, onSuccess }: OrganizerModalProps) {
  const { toast } = useToast()
  const isEditing = !!organizer

  const [name, setName] = useState(organizer?.name || '')
  const [email, setEmail] = useState(organizer?.email || '')
  const [quickToken, setQuickToken] = useState(organizer?.quick_token || '')
  const [isEvaluator, setIsEvaluator] = useState<boolean>(organizer?.is_evaluator === true)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    if (organizer) {
      setName(organizer.name || '')
      setEmail(organizer.email || '')
      setQuickToken(organizer.quick_token || '')
      setIsEvaluator(organizer.is_evaluator === true)
      setPassword('')

      if (!organizer.email && organizer.id) {
        evaluatorsService
          .getById(organizer.id)
          .then((fresh) => {
            if (isMounted && fresh) {
              if (fresh.email) setEmail(fresh.email)
              if (fresh.name) setName(fresh.name)
              if (fresh.quick_token) setQuickToken(fresh.quick_token)
              setIsEvaluator(fresh.is_evaluator === true)
            }
          })
          .catch((err) => {
            console.warn('Não foi possível carregar dados detalhados do organizador:', err)
          })
      }
    } else {
      setName('')
      setEmail('')
      setQuickToken('')
      setIsEvaluator(false)
      setPassword('Vivatec@2026')
    }

    return () => {
      isMounted = false
    }
  }, [organizer, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Preencha o nome e e-mail do organizador.',
        variant: 'destructive',
      })
      return
    }

    if (password.trim() && password.trim().length < 8) {
      toast({
        title: 'Senha Muito Curta',
        description: 'A senha deve conter no mínimo 8 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      if (isEditing && organizer) {
        await evaluatorsService.update(organizer.id, {
          name: name.trim(),
          email: email.trim(),
          quick_token: quickToken.trim(),
          is_evaluator: isEvaluator,
          password: password.trim() ? password.trim() : undefined,
        })
        await auditLogsService.log(
          'ORGANIZADOR_EDITADO',
          `Organizador ${name.trim()} (${email.trim()}) atualizado. Condição de avaliador: ${
            isEvaluator ? 'ATIVADA' : 'DESATIVADA'
          }.`,
        )
        toast({
          title: 'Organizador Atualizado!',
          description: 'Os dados foram salvos com sucesso.',
        })
      } else {
        await evaluatorsService.create({
          name: name.trim(),
          email: email.trim(),
          role: 'organizer',
          is_evaluator: isEvaluator,
          password: password.trim() || 'Vivatec@2026',
          quick_token: quickToken.trim(),
        })
        await auditLogsService.log(
          'ORGANIZADOR_CADASTRADO',
          `Novo organizador cadastrado: ${name.trim()} (${email.trim()}). Condição de avaliador: ${
            isEvaluator ? 'ATIVADA' : 'DESATIVADA'
          }.`,
        )
        toast({
          title: 'Organizador Cadastrado!',
          description: `Membro da comissão "${name.trim()}" cadastrado com sucesso.`,
        })
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro ao salvar organizador:', err)
      const errorDetail = getErrorMessage(err)
      toast({
        title: isEditing ? 'Erro ao Atualizar Organizador' : 'Erro ao Cadastrar Organizador',
        description: errorDetail || 'Verifique se o e-mail já está cadastrado no sistema.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-6 bg-white rounded-3xl border-2 border-pink-100 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="w-10 h-10 rounded-xl bg-pink-100 text-[#E11D74] flex items-center justify-center mb-1">
            {isEditing ? <Edit3 className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          </div>
          <DialogTitle className="text-xl font-black text-[#1A1A1A]">
            {isEditing ? 'Editar Membro da Comissão' : 'Cadastrar Membro da Comissão'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {isEditing
              ? 'Gerencie dados do organizador, redefina a senha e alterne a condição de avaliador.'
              : 'Cadastre um novo integrante da Comissão Organizadora do Viva Tec com credencial de acesso.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1A1A1A]">Nome do Organizador *</Label>
            <Input
              placeholder="Ex: Coord. Mariana Dias (Coordenação Viva Tec)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 rounded-xl border-slate-300"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1A1A1A]">E-mail Institucional *</Label>
            <Input
              type="email"
              placeholder="Ex: mariana.dias@sesc.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 rounded-xl border-slate-300"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#E11D74]">
              Código de Acesso Rápido / Token (Opcional)
            </Label>
            <Input
              placeholder="Ex: mariana, org2, comissao2"
              value={quickToken}
              onChange={(e) => setQuickToken(e.target.value)}
              className="h-10 rounded-xl border-pink-200 focus:border-[#E11D74]"
            />
            <span className="text-[10px] text-slate-400 block">
              Permite login rápido com token único ou QR Code no dia do evento.
            </span>
          </div>

          {/* Toggle Condição de Avaliador */}
          <div className="p-3.5 bg-pink-50/60 border border-pink-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E11D74]" />
                <Label className="text-xs font-black text-[#1A1A1A] cursor-pointer">
                  Condição de Avaliador da Banca
                </Label>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Nem todo organizador avalia. Quando ativado, este organizador também pode acessar o
                módulo <code className="text-[#E11D74] font-bold">/avaliar</code> e atribuir notas
                às startups.
              </p>
            </div>
            <Switch
              checked={isEvaluator}
              onCheckedChange={setIsEvaluator}
              className="data-[state=checked]:bg-[#E11D74]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1A1A1A]">
              {isEditing ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha Inicial'}
            </Label>
            <Input
              type="text"
              placeholder={
                isEditing ? 'Manter senha atual' : 'Padrão: Vivatec@2026 (mín. 8 caracteres)'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-xl border-slate-300"
            />
            <span className="text-[10px] text-slate-400 block">
              Mínimo de 8 caracteres. Padrão inicial: <code>Vivatec@2026</code>
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-xl text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 px-5 bg-[#E11D74] hover:bg-[#BE185D] text-white font-bold text-xs rounded-xl shadow-md"
            >
              {loading ? 'Salvando...' : isEditing ? 'Atualizar Dados' : 'Cadastrar Organizador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
