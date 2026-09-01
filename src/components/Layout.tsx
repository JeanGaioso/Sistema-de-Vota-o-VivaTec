import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LoginModal } from './LoginModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Trophy,
  ClipboardCheck,
  LayoutDashboard,
  LogIn,
  LogOut,
  Shield,
  Wifi,
  Sparkles,
  Layers,
  Menu,
  X,
} from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'

export default function Layout() {
  const { user, isAuthenticated, isAdmin, isEvaluator, logout } = useAuth()
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const [isConnected, setIsConnected] = useState(true)

  // Escutar realtime na coleção 'settings'
  useRealtime('settings', () => {
    setIsConnected(true)
  })

  // Fechar menu mobile ao navegar
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA] text-slate-900 selection:bg-[#FFD600] selection:text-[#1A237E]">
      {/* Header Institucional Sesc / HeroScore */}
      <header className="sticky top-0 z-40 bg-[#1A237E] text-white border-b-2 border-[#FFD600] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Nome do Evento */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#FFD600] text-[#1A237E] flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-[#1A237E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1">
                  HERO<span className="text-[#FFD600]">SCORE</span>
                </span>
                <span className="hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFD600]/20 text-[#FFD600] border border-[#FFD600]/40 uppercase tracking-widest">
                  SESC v1.0
                </span>
              </div>
              <p className="text-[10px] text-blue-200 hidden sm:block font-medium truncate max-w-[320px]">
                Escola Educar Sesc Monsenhor Jonas Abib
              </p>
            </div>
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link to="/">
              <Button
                variant={location.pathname === '/' ? 'secondary' : 'ghost'}
                size="sm"
                className={`font-semibold rounded-xl text-xs h-9 ${
                  location.pathname === '/'
                    ? 'bg-[#FFD600] text-[#1A237E] hover:bg-[#ffe033]'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 mr-1.5" />
                Vitrine Pública
              </Button>
            </Link>

            {/* Link para Avaliador */}
            {(isEvaluator || isAdmin) && (
              <Link to="/avaliar">
                <Button
                  variant={location.pathname.startsWith('/avaliar') ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`font-semibold rounded-xl text-xs h-9 ${
                    location.pathname.startsWith('/avaliar')
                      ? 'bg-[#FFD600] text-[#1A237E] hover:bg-[#ffe033]'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />
                  Banca Avaliadora
                </Button>
              </Link>
            )}

            {/* Link para Admin */}
            {isAdmin && (
              <Link to="/admin">
                <Button
                  variant={location.pathname.startsWith('/admin') ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`font-semibold rounded-xl text-xs h-9 ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-[#FFD600] text-[#1A237E] hover:bg-[#ffe033]'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                  Painel da Comissão
                </Button>
              </Link>
            )}
          </nav>

          {/* Indicador de Conectividade e Auth */}
          <div className="flex items-center gap-3">
            {/* Status Realtime */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/20 border border-white/10 text-[11px] font-medium"
              title={
                isConnected ? 'Sincronização em tempo real ativa' : 'Conectando ao servidor...'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden lg:inline text-slate-200">
                {isConnected ? 'Tempo Real' : 'Conectando'}
              </span>
              <Wifi className="w-3 h-3 text-slate-300" />
            </div>

            {/* Usuário / Login */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-tight">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-[#FFD600] font-medium">
                    {user.role === 'admin' ? 'Comissão' : 'Banca'}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#FFD600] text-[#1A237E] flex items-center justify-center font-bold text-xs shadow-inner">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="w-8 h-8 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
                  title="Sair do sistema"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setLoginModalOpen(true)}
                size="sm"
                className="bg-[#FFD600] hover:bg-[#ffdf33] text-[#1A237E] font-bold text-xs h-9 px-3.5 rounded-xl shadow-md flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Acesso Banca / Admin</span>
              </Button>
            )}

            {/* Botão Menu Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#151c68] border-t border-white/10 px-4 py-3 space-y-2 animate-in slide-in-from-top-2">
            <Link
              to="/"
              className={`flex items-center gap-2 p-2.5 rounded-xl text-sm font-semibold ${
                location.pathname === '/' ? 'bg-[#FFD600] text-[#1A237E]' : 'text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Vitrine Pública de Vencedores
            </Link>

            {(isEvaluator || isAdmin) && (
              <Link
                to="/avaliar"
                className={`flex items-center gap-2 p-2.5 rounded-xl text-sm font-semibold ${
                  location.pathname.startsWith('/avaliar')
                    ? 'bg-[#FFD600] text-[#1A237E]'
                    : 'text-white'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                Banca Avaliadora (Mobile)
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 p-2.5 rounded-xl text-sm font-semibold ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-[#FFD600] text-[#1A237E]'
                    : 'text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Painel da Comissão (Admin)
              </Link>
            )}

            {!isAuthenticated && (
              <Button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setLoginModalOpen(true)
                }}
                className="w-full bg-[#FFD600] text-[#1A237E] font-bold mt-2"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Entrar com Código ou Senha
              </Button>
            )}
          </div>
        )}
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Barra de Navegação Inferior para Mobile (quando autenticado) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-2xl">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1 px-3 rounded-lg ${
            location.pathname === '/' ? 'text-[#1A237E]' : 'text-slate-500'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span>Vitrine</span>
        </Link>

        {(isEvaluator || isAdmin) && (
          <Link
            to="/avaliar"
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1 px-3 rounded-lg ${
              location.pathname.startsWith('/avaliar') ? 'text-[#1A237E]' : 'text-slate-500'
            }`}
          >
            <ClipboardCheck className="w-5 h-5" />
            <span>Avaliar</span>
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/admin"
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1 px-3 rounded-lg ${
              location.pathname.startsWith('/admin') ? 'text-[#1A237E]' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Admin</span>
          </Link>
        )}

        {!isAuthenticated && (
          <button
            onClick={() => setLoginModalOpen(true)}
            className="flex flex-col items-center gap-1 text-[11px] font-semibold py-1 px-3 rounded-lg text-slate-500 hover:text-[#1A237E]"
          >
            <LogIn className="w-5 h-5" />
            <span>Entrar</span>
          </button>
        )}
      </div>

      {/* Footer Institucional */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 pb-20 md:pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1A237E] flex items-center justify-center text-[#FFD600] font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">Escola Educar Sesc Monsenhor Jonas Abib</p>
              <p className="text-[11px] text-slate-400">
                Festival de Apresentação Artística de Heróis Fictícios • HeroScore System
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right text-[11px] text-slate-500">
            <p>
              Critérios oficiais: ESG • Criatividade • Engajamento • Figurino • Narrativa • Briefing
              • Tempo
            </p>
            <p className="mt-1 font-mono text-slate-600">
              Ambiente Seguro & Tabulação Criptografada
            </p>
          </div>
        </div>
      </footer>

      {/* Modal de Autenticação */}
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  )
}
