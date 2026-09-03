import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ArrowLeftRight, Wrench, ClipboardList, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'
import api from '../services/api'
import useAuth from '../hooks/useAuth'
import styles from './Dashboard.module.css'

function Dashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
  carregarDashboard()

  const intervalo = setInterval(carregarDashboard, 10000)

  return () => clearInterval(intervalo)
}, [])

async function carregarDashboard() {
  try {
    const [{ data: indicadores }, { data: alertasData }] = await Promise.all([
      api.get('/dashboard/indicadores'),
      api.get('/alertas')
    ])
    
    setDados(indicadores)
    setAlertas(alertasData)
  } catch (err) {
    console.error(err)
  } finally {
    setCarregando(false)
  }
}

  const cards = dados ? [
    { label: 'Produtos', valor: dados.total_produtos, icon: Package, cor: '#2563eb', bg: '#eff6ff', rota: '/produtos' },
    { label: 'Empréstimos em aberto', valor: dados.emprestimos_abertos, icon: ArrowLeftRight, cor: '#d97706', bg: '#fffbeb', rota: '/emprestimos' },
    { label: 'Em manutenção', valor: dados.manutencoes_abertas, icon: Wrench, cor: '#dc2626', bg: '#fef2f2', rota: '/manutencao' },
    { label: 'Solicitações pendentes', valor: dados.solicitacoes_pendentes, icon: ClipboardList, cor: '#7eb82c', bg: '#f0fdf4', rota: '/solicitacoes' },
  ] : []

  function saudacao() {
    const hora = new Date().getHours()
    if (hora < 12) return 'Bom dia'
    if (hora < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Dashboard</h1>
        </div>
        <div className={styles.data}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className={styles.cards}>
        {carregando ? (
          [1,2,3,4].map(i => <div key={i} className={styles.cardSkeleton} />)
        ) : cards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className={styles.card} onClick={() => navigate(card.rota)}>
              <div className={styles.cardIconWrapper} style={{ background: card.bg }}>
                <Icon size={20} color={card.cor} />
              </div>
              <span className={styles.cardValor} style={{ color: card.cor }}>{card.valor}</span>
              <p className={styles.cardLabel}>{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className={styles.tudo}>
  {alertas.length === 0 ? (
    <>
      <CheckCircle size={18} color="#7eb82c" />
      <span>Estoque em ordem — nenhum alerta no momento</span>
    </>
  ) : (
    <div style={{ width: '100%' }}>
      {alertas.map(alerta => (
        <div
          key={alerta.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 0',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <AlertTriangle size={18} color="#f59e0b" />

          <div style={{ flex: 1 }}>
            <strong>{alerta.titulo}</strong>
            <div>{alerta.mensagem}</div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

      {dados && dados.estoque_baixo === 0 && dados.estoque_zerado === 0 && (
        <div className={styles.tudo}>
          <CheckCircle size={18} color="#7eb82c" />
          <span>Estoque em ordem — nenhum alerta no momento</span>
        </div>
      )}
    </div>
  )
}

export default Dashboard