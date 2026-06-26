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
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.get('/dashboard/indicadores')
      .then(({ data }) => setDados(data))
      .catch(console.error)
      .finally(() => setCarregando(false))
  }, [])

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
          <p className={styles.saudacao}>{saudacao()}, {usuario?.nome?.split(' ')[0]}! 👋</p>
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

      {dados && (dados.estoque_baixo > 0 || dados.estoque_zerado > 0) && (
        <div className={styles.secao}>
          <h2 className={styles.secaoTitulo}>
            <TrendingDown size={16} color="#dc2626" />
            Alertas de estoque
          </h2>
          <div className={styles.alertas}>
            {dados.alertas_estoque.map(produto => (
              <div
                key={produto.codigo_interno}
                className={`${styles.alertaItem} ${produto.quantidade_atual === 0 ? styles.alertaZerado : styles.alertaBaixo}`}
                onClick={() => navigate('/estoque')}
              >
                <AlertTriangle size={15} color={produto.quantidade_atual === 0 ? '#dc2626' : '#d97706'} />
                <div className={styles.alertaInfo}>
                  <strong>{produto.nome}</strong>
                  <span>{produto.codigo_interno}</span>
                </div>
                <span className={styles.alertaQtd} style={{ color: produto.quantidade_atual === 0 ? '#dc2626' : '#d97706' }}>
                  {produto.quantidade_atual === 0 ? 'Zerado' : `${produto.quantidade_atual} / ${produto.quantidade_minima} ${produto.unidade_medida}`}
                </span>
              </div>
            ))}
            <button className={styles.btnVerEstoque} onClick={() => navigate('/estoque')}>
              Ver estoque completo →
            </button>
          </div>
        </div>
      )}

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