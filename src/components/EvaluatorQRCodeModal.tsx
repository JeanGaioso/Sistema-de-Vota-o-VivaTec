import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QrCode, Copy, Check, Smartphone, KeyRound, ExternalLink, ShieldCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { EvaluatorUser } from '@/types'

interface EvaluatorQRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  evaluator: EvaluatorUser | null
}

export function EvaluatorQRCodeModal({ isOpen, onClose, evaluator }: EvaluatorQRCodeModalProps) {
  const { toast } = useToast()
  const [copiedToken, setCopiedToken] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  if (!evaluator) return null

  const baseUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://vivatec.sesc.edu.br'
  const token = evaluator.quick_token || evaluator.email.split('@')[0]
  // Link de acesso direto para o avaliador
  const directAccessUrl = `${baseUrl}/avaliar?token=${encodeURIComponent(token)}`

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token)
    setCopiedToken(true)
    toast({
      title: 'Código Copiado!',
      description: `Código "${token}" copiado para a área de transferência.`,
    })
    setTimeout(() => setCopiedToken(false), 2500)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directAccessUrl)
    setCopiedLink(true)
    toast({
      title: 'Link de Acesso Copiado!',
      description: 'O link de acesso do jurado foi copiado.',
    })
    setTimeout(() => setCopiedLink(false), 2500)
  }

  // QR Code formatado com visual Viva Tec
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    directAccessUrl,
  )}&color=e11d74&bgcolor=ffffff&qzone=2`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-6 bg-white rounded-3xl border-2 border-pink-200 shadow-2xl text-center">
        <DialogHeader className="space-y-1">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-pink-100 text-[#E11D74] flex items-center justify-center mb-1">
            <QrCode className="w-6 h-6 text-[#E11D74]" />
          </div>
          <DialogTitle className="text-xl font-black text-[#1A1A1A]">
            Acesso Rápido da Banca
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Credencial e QR Code exclusivo para{' '}
            <strong className="text-[#E11D74]">{evaluator.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 flex flex-col items-center justify-center">
          <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-md inline-block relative">
            <img
              src={qrCodeUrl}
              alt={`QR Code ${evaluator.name}`}
              className="w-48 h-48 object-contain rounded-xl"
            />
            <div className="mt-2 text-[11px] font-bold text-[#E11D74] flex items-center justify-center gap-1">
              <Smartphone className="w-3.5 h-3.5" /> Aponte a câmera do tablet ou smartphone
            </div>
          </div>

          {/* Cartão de Token de Acesso */}
          <div className="w-full mt-4 space-y-2 text-left">
            <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Código de Acesso Rápido (Token)
                </span>
                <span className="text-base font-black text-[#E11D74] font-mono tracking-wider">
                  {token}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyToken}
                className="h-8 px-3 rounded-lg text-xs font-bold border-pink-300 hover:bg-pink-100 text-[#E11D74]"
              >
                {copiedToken ? (
                  <Check className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1" />
                )}
                {copiedToken ? 'Copiado' : 'Copiar'}
              </Button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="overflow-hidden mr-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  E-mail do Avaliador
                </span>
                <span className="text-xs font-semibold text-slate-800 truncate block">
                  {evaluator.email}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
                className="h-8 px-3 rounded-lg text-xs font-bold shrink-0"
              >
                {copiedLink ? (
                  <Check className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                )}
                {copiedLink ? 'Link Copiado' : 'Copiar Link'}
              </Button>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                Permite login instantâneo na cabine da banca examinadora sem necessidade de digitar
                senhas complexas.
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
