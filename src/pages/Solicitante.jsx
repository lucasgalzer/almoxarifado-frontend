import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuth from '../hooks/useAuth'
import ModalSolicitacao from '../components/ModalSolicitacao'
import { useToast } from '../components/Toast'
import styles from './Solicitante.module.css'

function Solicitante() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [solicitacoes, setSolicitacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [instituicao, setInstituicao] = useState(null)

  useEffect(() => {
    carregarSolicitacoes()
    api.get('/instituicao').then(({ data }) => {
      setInstituicao(data)
      if (data.cor_primaria) {
        document.documentElement.style.setProperty('--color-primary', data.cor_primaria)
      }
      if (data.cor_secundaria) {
        document.documentElement.style.setProperty('--color-secondary', data.cor_secundaria)
      }
    }).catch(console.error)
  }, [])

  async function carregarSolicitacoes() {
    try {
      setCarregando(true)
      const { data } = await api.get('/solicitacoes')
      setSolicitacoes(data)
    } catch (error) {
      console.error(error)
    } finally {
      setCarregando(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function formatarData(data) {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  function labelStatus(status) {
    const mapa = {
      pendente: 'Pendente',
      aprovada: 'Aprovada',
      pronta: 'Pronta p/ retirada',
      entregue: 'Entregue',
      recusada: 'Recusada',
      cancelada: 'Cancelada',
    }
    return mapa[status] || status
  }

  function corStatus(status) {
    const mapa = {
      pendente: { bg: '#fffbeb', color: '#d97706' },
      aprovada: { bg: '#f0fdf4', color: '#16a34a' },
      pronta: { bg: '#eff6ff', color: '#2563eb' },
      entregue: { bg: '#f0fdf4', color: '#15803d' },
      recusada: { bg: '#fef2f2', color: '#dc2626' },
      cancelada: { bg: '#f3f4f6', color: '#6b7280' },
    }
    return mapa[status] || { bg: '#f3f4f6', color: '#6b7280' }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLogo}>
          {instituicao?.logo_base64 ? (
            <img src={instituicao.logo_base64} alt="Logo" style={{ height: '36px', objectFit: 'contain' }} />
          ) : (
            <div className={styles.logoIcon}>A</div>
          )}
          <div>
            <span className={styles.logoTitle}>Almoxarifado</span>
            <span className={styles.logoSub}>{instituicao?.nome_exibicao || instituicao?.nome || 'Escolar'}</span>
          </div>
        </div>

        <div className={styles.headerUser}>
          <span className={styles.userName}>{usuario?.nome}</span>
          <button className={styles.btnLogout} onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.titulo}>Minhas Solicitações</h1>
            <p className={styles.subtitulo}>{solicitacoes.length} solicitação(ões)</p>
          </div>
          <button className={styles.btnNova} onClick={() => setModalAberto(true)}>
            + Nova Solicitação
          </button>
        </div>

        {carregando ? (
          <div className={styles.vazio}>Carregando...</div>
        ) : solicitacoes.length === 0 ? (
          <div className={styles.vazioCard}>
            <p>Você ainda não fez nenhuma solicitação.</p>
            <button className={styles.btnNova} onClick={() => setModalAberto(true)}>
              Fazer primeira solicitação
            </button>
          </div>
        ) : (
          <div className={styles.lista}>
            {solicitacoes.map(sol => {
              const cor = corStatus(sol.status)
              return (
                <div key={sol.id} className={styles.card}>
                  <div className={styles.cardTopo}>
                    <span className={styles.badge} style={{ background: cor.bg, color: cor.color }}>
                      {labelStatus(sol.status)}
                    </span>
                    <span className={styles.cardData}>
                      {formatarData(sol.created_at)}
                      {sol.data_desejada && ` · Desejado para ${formatarData(sol.data_desejada)}`}
                    </span>
                  </div>

                  {sol.finalidade && (
                    <p className={styles.cardFinalidade}>{sol.finalidade}</p>
                  )}

                  <div className={styles.cardItens}>
                    {sol.itens.map(item => (
                      <span key={item.id} className={styles.itemTag}>
                        {item.produto_nome} × {item.quantidade_solicitada} {item.unidade_medida}
                      </span>
                    ))}
                  </div>

                  {sol.observacoes && (
                    <p className={styles.cardObs}>{sol.observacoes}</p>
                  )}

                  {sol.status === 'pronta' && (
                    <div className={styles.cardAlerta}>
                      Seu material está pronto para retirada no almoxarifado!
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {modalAberto && (
        <ModalSolicitacao
          onFechar={() => setModalAberto(false)}
          onSalvar={() => {
            setModalAberto(false)
            addToast('Solicitação enviada com sucesso!', 'sucesso')
            carregarSolicitacoes()
          }}
        />
      )}
    </div>
  )
}

export default Solicitante