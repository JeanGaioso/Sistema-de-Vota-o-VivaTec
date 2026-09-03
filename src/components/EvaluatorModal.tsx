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
import { useToast } from '@/hooks/use-toast'
import { evaluatorsService, auditLogsService } from '@/services/api'
import { EvaluatorUser } from '@/types'
import { UserPlus, Edit3, KeyRound, ShieldAlert } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface EvaluatorModalProps {
  isOpen: boolean
  onClose: () => void
  evaluator: EvaluatorUser | null
  onSuccess: () => void
}

export function EvaluatorModal({ isOpen, onClose, evaluator, onSuccess }: EvaluatorModalProps) {
  const { toast } = useToast()
  const isEditing = !!evaluator

  const [name, setName] = useState(evaluator?.name || '')
  const [email, setEmail] = useState(evaluator?.email || '')
  const [quickToken, setQuickToken] = useState(evaluator?.quick_token || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Atualizar form quando evaluator mudar ou modal abrir
  React.useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    if (evaluator) {
      setName(evaluator.name || '')
      setEmail(evaluator.email || '')
      setQuickToken(evaluator.quick_token || '')
      setPassword('')

      // Se por ventura o email vier vazio da listagem (ex.: visibilidade restrita), busca o registro completo por ID
      if (!evaluator.email && evaluator.id) {
        evaluatorsService
          .getById(evaluator.id)
          .then((fresh) => {
            if (isMounted && fresh) {
              if (fresh.email) setEmail(fresh.email)
              if (fresh.name) setName(fresh.name)
              if (fresh.quick_token) setQuickToken(fresh.quick_token)
            }
          })
          .catch((err) => {
            console.warn('Não foi possível carregar dados detalhados do jurado:', err)
          })
      }
    } else {
      setName('')
      setEmail('')
      setQuickToken('')
      setPassword('Vivatec@2026')
    }

    return () => {
      isMounted = false
    }
  }, [evaluator, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Preencha o nome e e-mail do avaliador.',
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
      if (isEditing && evaluator) {
        await evaluatorsService.update(evaluator.id, {
          name: name.trim(),
          email: email.trim(),
          quick_token: quickToken.trim(),
          password: password.trim() ? password.trim() : undefined,
        })
        await auditLogsService.log(
          'JURADO_EDITADO',
          `Dados do avaliador ${name.trim()} (${email.trim()}) atualizados pela comissão.`,
        )
        toast({
          title: 'Jurado Atualizado!',
          description: 'Os dados foram salvos com sucesso.',
        })
      } else {
        await evaluatorsService.create({
          name: name.trim(),
          email: email.trim(),
          password: password.trim() || 'Vivatec@2026',
          quick_token: quickToken.trim(),
        })
        await auditLogsService.log(
          'JURADO_CADASTRADO',
          `Novo avaliador da banca cadastrado: ${name.trim()} (${email.trim()}) com permissão de avaliação.`,
        )
        toast({
          title: 'Jurado Cadastrado!',
          description: `Avaliador ${name.trim()} pronto para acessar a banca.`,
        })
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro ao salvar jurado:', err)
      const errorDetail = getErrorMessage(err)
      toast({
        title: isEditing ? 'Erro ao Atualizar Avaliador' : 'Erro ao Cadastrar Avaliador',
        description: errorDetail || 'Verifique se o e-mail já está cadastrado.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-6 bg-white rounded-3xl border-2 border-pink-100 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="w-10 h-10 rounded-xl bg-pink-100 text-[#E11D74] flex items-center justify-center mb-1">
            {isEditing ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </div>
          <DialogTitle className="text-xl font-black text-[#1A1A1A]">
            {isEditing ? 'Editar Avaliador da Banca' : 'Cadastrar Novo Jurado'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {isEditing
              ? 'Altere o nome, e-mail, identificador ou redefina a senha de acesso.'
              : 'O jurado receberá acesso à cabine de votação com as regras e critérios do Viva Tec.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1A1A1A]">Nome Completo do Jurado *</Label>
            <Input
              placeholder="Ex: Dra. Juliana Silveira (Banca Design)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 rounded-xl border-slate-300"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1A1A1A]">E-mail *</Label>
            <Input
              type="email"
              placeholder="Ex: juliana.silveira@sesc.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 rounded-xl border-slate-300"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#E11D74]">
              Código de Acesso Rápido / Token
            </Label>
            <Input
              placeholder="Ex: juliana, banca3, eval3"
              value={quickToken}
              onChange={(e) => setQuickToken(e.target.value)}
              className="h-10 rounded-xl border-pink-200 focus:border-[#E11D74]"
            />
            <span className="text-[10px] text-slate-400 block">
              Usado para login instantâneo na cabine da banca via QR Code ou digitação curta.
            </span>
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
              Mínimo de 8 caracteres. Senha padrão do evento: <code>Vivatec@2026</code>
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
              {loading ? 'Salvando...' : isEditing ? 'Atualizar Dados' : 'Cadastrar Jurado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
