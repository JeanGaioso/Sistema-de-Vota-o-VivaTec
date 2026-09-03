import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { startupsService, evaluationsService, settingsService } from '@/services/api'
import { Startup, Evaluation, StartupRankResult } from '@/types'
import { calculateRanking } from '@/lib/ranking'
import { PostEventReportView } from '@/components/PostEventReportView'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { ShieldAlert, RefreshCw, ArrowLeft, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LoginModal } from '@/components/LoginModal'

export default function ReportPage() {
  const { user, isAuthenticated, isAdmin } = useAuth()
  const [startups, setStartups] = useState<Startup[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  const fetchData = async () => {
    try {
      const [startupsList, evalsList] = await Promise.all([
        startupsService.getAll(),
        evaluationsService.getAll(),
      ])
      setStartups(startupsList)
      setEvaluations(evalsList)
    } catch (err) {
      console.error('Erro ao buscar dados para o relatório:', err)
    } finally {
      setLoading(false)
    }
  }

  useRealtime('evaluations', () => {
    fetchData()
  })
  useRealtime('startups', () => {
    fetchData()
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[60vh]">
        <div className="w-16 h-16 rounded-3xl bg-pink-100 text-[#E11D74] flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#1A1A1A] mb-2">Relatório Pós-Evento Restrito</h2>
        <p className="text-sm text-slate-600 mb-6">
          O relatório compilado pós-evento e a exportação oficial em PDF são de acesso exclusivo
          para a Comissão Organizadora (Admin).
        </p>
        <Button
          onClick={() => setLoginModalOpen(true)}
          className="bg-[#E11D74] hover:bg-[#BE185D] text-white font-bold h-11 px-6 rounded-xl shadow-md"
        >
          <LogIn className="w-4 h-4 mr-2" /> Entrar como Administrador
        </Button>
        <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      </div>
    )
  }

  const ranking = calculateRanking(startups, evaluations)

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#1A1A1A]">
      <div className="flex items-center justify-between">
        <Link to="/admin">
          <Button variant="outline" size="sm" className="h-9 font-bold text-xs rounded-xl">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Voltar ao Painel Admin
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          className="h-9 px-3 rounded-xl text-xs font-bold text-[#E11D74] hover:bg-pink-50"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Atualizar Dados
        </Button>
      </div>

      <PostEventReportView
        ranking={ranking}
        eventName="Festival de Apresentação Artística de Heróis Fictícios • Viva Tec"
        generatedBy={user?.name || 'Comissão Organizadora Sesc/Senac'}
      />
    </div>
  )
}
