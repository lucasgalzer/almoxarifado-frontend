import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Users, Archive,
  ArrowLeftRight, ClipboardList, Wrench,BookMarked, 
  BarChart2, Settings, LogOut, Menu, X, Box, UserCog
} from 'lucide-react'
import useAuth from '../hooks/useAuth'
import api from '../services/api'
import styles from './Layout.module.css'

const menuItems = [
  { path: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, perfis: ['admin', 'operador'] },
  { path: '/produtos',      label: 'Produtos',       icon: Package,         perfis: ['admin', 'operador'] },
  { path: '/pessoas',       label: 'Pessoas',        icon: Users,           perfis: ['admin', 'operador'] },
  { path: '/estoque',       label: 'Estoque',        icon: Archive,         perfis: ['admin', 'operador'] },
  { path: '/emprestimos',   label: 'Empréstimos',    icon: ArrowLeftRight,  perfis: ['admin', 'operador'] },
  { path: '/emprestimos-fixos', label: 'Empréstimos Fixos', icon: BookMarked, perfis: ['admin', 'operador'] },
  { path: '/solicitacoes',  label: 'Solicitações',   icon: ClipboardList,   perfis: ['admin', 'operador'] },
  { path: '/manutencao',    label: 'Manutenção',     icon: Wrench,          perfis: ['admin', 'operador'] },
  { path: '/relatorios',    label: 'Relatórios',     icon: BarChart2,       perfis: ['admin', 'operador'] },
  { path: '/configuracoes', label: 'Configurações',  icon: Settings,        perfis: ['admin'] },
  { path: '/usuarios',      label: 'Usuários',       icon: UserCog,         perfis: ['admin'] },
]

function ajustarCor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent))
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function Layout() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const [nomeExibicao, setNomeExibicao] = useState('Escolar')
  const [logoBase64, setLogoBase64] = useState('')
  const acessandoComo = !!localStorage.getItem('token_super_admin')

  useEffect(() => {
    api.get('/instituicao').then(({ data }) => {
      if (data.cor_primaria) {
        document.documentElement.style.setProperty('--color-primary', data.cor_primaria)
        document.documentElement.style.setProperty('--color-primary-dark', ajustarCor(data.cor_primaria, -20))
        document.documentElement.style.setProperty('--color-primary-light', ajustarCor(data.cor_primaria, 20))
      }
      if (data.cor_secundaria) {
        document.documentElement.style.setProperty('--color-secondary', data.cor_secundaria)
      }
      if (data.nome_exibicao) setNomeExibicao(data.nome_exibicao)
      if (data.logo_base64) setLogoBase64(data.logo_base64)
    }).catch(console.error)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

function voltarSuperAdmin() {
  localStorage.setItem('token', localStorage.getItem('token_super_admin'))
  localStorage.removeItem('token_super_admin')
  localStorage.removeItem('usuario')
  localStorage.removeItem('usuario_super_admin')
  window.location.href = '/super-admin'
}
  const itensFiltrados = menuItems.filter(item =>
    item.perfis.includes(usuario?.perfil)
  )

  return (
    <div className={styles.container}>
      {acessandoComo && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          background: '#6366f1',
          color: 'white',
          padding: '8px 20px',
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <span>Você está acessando como administrador desta escola.</span>
          <button
            onClick={voltarSuperAdmin}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '4px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            ← Voltar ao Super Admin
          </button>
        </div>
      )}

      <button
        className={styles.menuToggle}
        style={acessandoComo ? { top: '48px' } : {}}
        onClick={() => setMenuAberto(!menuAberto)}
      >
        {menuAberto ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={menuAberto ? styles.overlayAberto : styles.overlay} onClick={() => setMenuAberto(false)} />

      <aside
        className={`${styles.sidebar} ${menuAberto ? styles.sidebarAberto : ''}`}
        style={acessandoComo ? { paddingTop: '36px' } : {}}
      >
        <div className={styles.logo}>
          {logoBase64 ? (
            <img
              src={logoBase64}
              alt="Logo"
              style={{ height: '60px', objectFit: 'contain', maxWidth: '60px' }}
            />
          ) : (
            <div className={styles.logoIcon}>
              <Box size={20} color="currentColor" />
            </div>
          )}
          <div>
            <span className={styles.logoTitle}>Almoxarifado</span>
            <span className={styles.logoSub}>{nomeExibicao}</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {itensFiltrados.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMenuAberto(false)}
                className={({ isActive }) =>
                  isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
                }
              >
                <Icon size={18} className={styles.navIcon} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className={styles.footer}>
          <div className={styles.usuarioInfo}>
            <div className={styles.avatar}>
              {usuario?.nome?.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className={styles.usuarioNome}>{usuario?.nome}</span>
              <span className={styles.usuarioPerfil}>{usuario?.perfil}</span>
            </div>
          </div>
          <button className={styles.logout} onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className={styles.main} style={acessandoComo ? { paddingTop: '64px' } : {}}>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout