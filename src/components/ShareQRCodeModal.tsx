import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QrCode, Copy, Check, ExternalLink, Smartphone } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ShareQRCodeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ShareQRCodeModal({ isOpen, onClose }: ShareQRCodeModalProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const currentUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://vivatec.sesc.edu.br'

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl)
    setCopied(true)
    toast({
      title: 'Link Copiado!',
      description: 'O link da Vitrine Pública foi copiado para sua área de transferência.',
    })
    setTimeout(() => setCopied(false), 3000)
  }

  // QR Code URL com API segura e estilizada no tom magenta Viva Tec (#e11d74)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    currentUrl,
  )}&color=e11d74&bgcolor=ffffff&qzone=2`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-6 bg-white rounded-3xl border-2 border-pink-200 shadow-2xl text-center">
        <DialogHeader className="space-y-1">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-pink-100 text-[#E11D74] flex items-center justify-center mb-1">
            <QrCode className="w-6 h-6 text-[#E11D74]" />
          </div>
          <DialogTitle className="text-xl font-black text-[#1A1A1A]">
            Acesso da Comunidade Escolar
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Escaneie o QR Code ou compartilhe o link oficial para conferir a Vitrine de Vencedores
            Viva Tec
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col items-center justify-center">
          <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-md inline-block relative group">
            <img
              src={qrCodeUrl}
              alt="QR Code Viva Tec"
              className="w-52 h-52 object-contain rounded-xl"
            />{' '}
            <div className="mt-2 text-[11px] font-bold text-[#E11D74] flex items-center justify-center gap-1">
              <Smartphone className="w-3.5 h-3.5" /> Aponte a câmera do celular
            </div>
          </div>

          <div className="w-full mt-4 flex items-center gap-2 p-2 bg-pink-50/60 rounded-xl border border-pink-200">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="bg-transparent text-xs font-mono text-[#1A1A1A] flex-1 outline-none px-2 select-all"
            />
            <Button
              size="sm"
              onClick={handleCopy}
              className="h-8 px-3.5 bg-[#E11D74] hover:bg-[#BE185D] text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Link'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
