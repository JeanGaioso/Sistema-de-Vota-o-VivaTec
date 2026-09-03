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
  FileText,
} from 'lucide-react'
import { VivaTecLogo } from './VivaTecLogo'
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
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#1A1A1A] selection:bg-[#E11D74] selection:text-white">
      {/* Header Institucional Viva Tec */}
      <header className="sticky top-0 z-40 bg-white text-[#1A1A1A] border-b-2 border-pink-100 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo / Nome do Evento */}
          <Link to="/" className="flex items-center gap-3 group">
            <VivaTecLogo iconSize="md" showTagline={true} inverted={false} />
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <Link to="/">
              <Button
                variant={location.pathname === '/' ? 'default' : 'ghost'}
                size="sm"
                className={`font-bold rounded-xl text-xs h-9.5 transition-all ${
                  location.pathname === '/'
                    ? 'bg-[#E11D74] text-white hover:bg-[#BE185D] shadow-sm'
                    : 'text-[#1A1A1A] hover:bg-pink-50 hover:text-[#E11D74]'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 mr-1.5" />
                Vitrine de Vencedores
              </Button>
            </Link>

            {/* Link para Avaliador - apenas se tiver condição de avaliador ativa */}
            {isEvaluator && (
              <Link to="/avaliar">
                <Button
                  variant={location.pathname.startsWith('/avaliar') ? 'default' : 'ghost'}
                  size="sm"
                  className={`font-bold rounded-xl text-xs h-9.5 transition-all ${
                    location.pathname.startsWith('/avaliar')
                      ? 'bg-[#E11D74] text-white hover:bg-[#BE185D] shadow-sm'
                      : 'text-[#1A1A1A] hover:bg-pink-50 hover:text-[#E11D74]'
                  }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />
                  Banca Avaliadora
                </Button>
              </Link>
            )}

            {/* Link para Admin */}
            {isAdmin && (
              <>
                <Link to="/admin">
                  <Button
                    variant={location.pathname === '/admin' ? 'default' : 'ghost'}
                    size="sm"
                    className={`font-bold rounded-xl text-xs h-9.5 transition-all ${
                      location.pathname === '/admin'
                        ? 'bg-[#E11D74] text-white hover:bg-[#BE185D] shadow-sm'
                        : 'text-[#1A1A1A] hover:bg-pink-50 hover:text-[#E11D74]'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                    Comissão (Admin)
                  </Button>
                </Link>

                <Link to="/relatorio">
                  <Button
                    variant={location.pathname.startsWith('/relatorio') ? 'default' : 'ghost'}
                    size="sm"
                    className={`font-bold rounded-xl text-xs h-9.5 transition-all ${
                      location.pathname.startsWith('/relatorio')
                        ? 'bg-[#E11D74] text-white hover:bg-[#BE185D] shadow-sm'
                        : 'text-[#1A1A1A] hover:bg-pink-50 hover:text-[#E11D74]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    Relatório Pós-Evento
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Indicador de Conectividade e Auth */}
          <div className="flex items-center gap-3">
            {/* Status Realtime */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 border border-pink-200 text-[11px] font-medium text-slate-700"
              title={
                isConnected ? 'Sincronização em tempo real ativa' : 'Conectando ao servidor...'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden lg:inline text-slate-700 font-semibold">
                {isConnected ? 'Tempo Real' : 'Conectando'}
              </span>
              <Wifi className="w-3 h-3 text-[#E11D74]" />
            </div>

            {/* Usuário / Login */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-[#1A1A1A] leading-tight">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-[#E11D74] font-bold">
                    {user.role === 'admin'
                      ? 'Admin Geral'
                      : user.role === 'organizer'
                        ? user.is_evaluator
                          ? 'Comissão & Banca'
                          : 'Comissão Organizadora'
                        : 'Banca Avaliadora'}
                  </span>
                </div>

                <div className="w-8.5 h-8.5 rounded-full bg-[#E11D74] text-white flex items-center justify-center font-black text-xs shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="w-8.5 h-8.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Sair do sistema"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setLoginModalOpen(true)}
                size="sm"
                className="bg-[#E11D74] hover:bg-[#BE185D] text-white font-bold text-xs h-9.5 px-4 rounded-xl shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Acesso Banca / Admin</span>
              </Button>
            )}

            {/* Botão Menu Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-800 hover:bg-slate-100 rounded-lg"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[#E11D74]" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Menu Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-2 animate-in slide-in-from-top-2 shadow-xl">
            <Link
              to="/"
              className={`flex items-center gap-2 p-2.5 rounded-xl text-sm font-bold ${
                location.pathname === '/'
                  ? 'bg-[#E11D74] text-white'
                  : 'text-[#1A1A1A] hover:bg-pink-50'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Vitrine de Vencedores
            </Link>

            {isEvaluator && (
              <Link
                to="/avaliar"
                className={`flex items-center gap-2 p-2.5 rounded-xl text-sm font-bold ${
                  location.pathname.startsWith('/avaliar')
                    ? 'bg-[#E11D74] text-white'
                    : 'text-[#1A1A1A] hover:bg-pink-50'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                Banca Avaliadora (Mobile)
              </Link>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-sm font-bold ${
                    location.pathname === '/admin'
                      ? 'bg-[#E11D74] text-white'
                      : 'text-[#1A1A1A] hover:bg-pink-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Painel da Comissão (Admin)
                </Link>

                <Link
                  to="/relatorio"
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-sm font-bold ${
                    location.pathname.startsWith('/relatorio')
                      ? 'bg-[#E11D74] text-white'
                      : 'text-[#1A1A1A] hover:bg-pink-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Relatório Pós-Evento (PDF)
                </Link>
              </>
            )}

            {!isAuthenticated && (
              <Button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setLoginModalOpen(true)
                }}
                className="w-full bg-[#E11D74] hover:bg-[#BE185D] text-white font-bold mt-2 rounded-xl"
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
          className={`flex flex-col items-center gap-1 text-[11px] font-bold py-1 px-3 rounded-lg ${
            location.pathname === '/' ? 'text-[#E11D74]' : 'text-slate-500'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span>Vitrine</span>
        </Link>

        {isEvaluator && (
          <Link
            to="/avaliar"
            className={`flex flex-col items-center gap-1 text-[11px] font-bold py-1 px-3 rounded-lg ${
              location.pathname.startsWith('/avaliar') ? 'text-[#E11D74]' : 'text-slate-500'
            }`}
          >
            <ClipboardCheck className="w-5 h-5" />
            <span>Avaliar</span>
          </Link>
        )}

        {isAdmin && (
          <>
            <Link
              to="/admin"
              className={`flex flex-col items-center gap-1 text-[11px] font-bold py-1 px-3 rounded-lg ${
                location.pathname === '/admin' ? 'text-[#E11D74]' : 'text-slate-500'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Admin</span>
            </Link>

            <Link
              to="/relatorio"
              className={`flex flex-col items-center gap-1 text-[11px] font-bold py-1 px-3 rounded-lg ${
                location.pathname.startsWith('/relatorio') ? 'text-[#E11D74]' : 'text-slate-500'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Relatório</span>
            </Link>
          </>
        )}

        {!isAuthenticated && (
          <button
            onClick={() => setLoginModalOpen(true)}
            className="flex flex-col items-center gap-1 text-[11px] font-bold py-1 px-3 rounded-lg text-slate-500 hover:text-[#E11D74]"
          >
            <LogIn className="w-5 h-5" />
            <span>Entrar</span>
          </button>
        )}
      </div>

      {/* Footer Institucional Viva Tec */}
      <footer className="bg-white text-[#1A1A1A] text-xs py-8 border-t border-slate-200 pb-20 md:pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <VivaTecLogo iconSize="sm" showTagline={false} />
            <div className="border-l border-slate-200 pl-3">
              <p className="font-bold text-[#1A1A1A]">
                Parceria Senac & Sesc — Escola Educar Sesc Monsenhor Jonas Abib
              </p>
              <p className="text-[11px] text-slate-500">
                Festival de Apresentação Artística de Heróis Fictícios • Viva Tec V2
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right text-[11px] text-slate-500">
            <p className="font-semibold text-[#E11D74]">Próxima parada: Ensino Médio</p>
            <p className="mt-0.5 font-medium text-slate-600">
              Critérios: ESG • Criatividade • Engajamento • Figurino • Narrativa • Briefing • Gestão
              de Tempo
            </p>
          </div>
        </div>
      </footer>

      {/* Modal de Autenticação */}
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  )
}
