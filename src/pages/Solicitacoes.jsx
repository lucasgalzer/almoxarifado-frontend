import { useState, useEffect } from 'react'
import api from '../services/api'
import ModalSolicitacao from '../components/ModalSolicitacao'
import ModalDetalhesSolicitacao from '../components/ModalDetalhesSolicitacao'
import ModalConfirmacao from '../components/ModalConfirmacao'
import { useToast } from '../components/Toast'
import styles from './Solicitacoes.module.css'

function Solicitacoes() {
  const { addToast } = useToast()
  const [solicitacoes, setSolicitacoes] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null)
  const [solicitacaoCancelando, setSolicitacaoCancelando] = useState(null)

  useEffect(() => {
    carregarSolicitacoes()
  }, [filtroStatus])

  async function carregarSolicitacoes() {
    try {
      setCarregando(true)
      const params = {}
      if (filtroStatus) params.status = filtroStatus
      const { data } = await api.get('/solicitacoes', { params })
      setSolicitacoes(data)
    } catch (error) {
      console.error(error)
    } finally {
      setCarregando(false)
    }
  }

  async function handleCancelar() {
    try {
      await api.patch(`/solicitacoes/${solicitacaoCancelando.id}/status`, { status: 'cancelada' })
      addToast('Solicitação cancelada', 'aviso')
      setSolicitacaoCancelando(null)
      carregarSolicitacoes()
    } catch (error) {
      addToast(error.response?.data?.erro || 'Erro ao cancelar', 'erro')
      setSolicitacaoCancelando(null)
    }
  }

  function formatarData(data) {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  function badgeStatus(status) {
    const mapa = {
      pendente: styles.badgePendente,
      aprovada: styles.badgeAprovada,
      pronta: styles.badgePronta,
      entregue: styles.badgeEntregue,
      recusada: styles.badgeRecusada,
      cancelada: styles.badgeCancelada,
    }
    return mapa[status] || ''
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

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Solicitações</h1>
          <p className={styles.subtitulo}>{solicitacoes.length} solicitação(ões) encontrada(s)</p>
        </div>
        <button className={styles.btnNovo} onClick={() => setModalAberto(true)}>
          + Nova Solicitação
        </button>
      </div>

      {solicitacoes.filter(s => s.status === 'pendente').length > 0 && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#d97706',
          fontWeight: '600'
        }}>
          {solicitacoes.filter(s => s.status === 'pendente').length} solicitação(ões) aguardando sua atenção
        </div>
      )}

      <div className={styles.filtros}>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className={styles.select}>
          <option value="">Todas</option>
          <option value="pendente">Pendentes</option>
          <option value="aprovada">Aprovadas</option>
          <option value="pronta">Prontas para retirada</option>
          <option value="entregue">Entregues</option>
          <option value="recusada">Recusadas</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </div>

      <div className={styles.lista}>
        {carregando ? (
          <div className={styles.vazio}>Carregando...</div>
        ) : solicitacoes.length === 0 ? (
          <div className={styles.vazio}>Nenhuma solicitação encontrada.</div>
        ) : (
          solicitacoes.map(sol => (
            <div key={sol.id} className={styles.card}>
              <div className={styles.cardTopo}>
                <div className={styles.cardInfo}>
                  <span className={`${styles.badge} ${badgeStatus(sol.status)}`}>
                    {labelStatus(sol.status)}
                  </span>
                  <span className={styles.cardData}>
                    Solicitado em {formatarData(sol.created_at)}
                    {sol.data_desejada && ` · Desejado para ${formatarData(sol.data_desejada)}`}
                  </span>
                </div>
                <div className={styles.cardAcoes}>
                  <button className={styles.btnDetalhes} onClick={() => setSolicitacaoSelecionada(sol)}>
                    Ver detalhes
                  </button>
                  {sol.status === 'pendente' && (
                    <button className={styles.btnCancelar} onClick={() => setSolicitacaoCancelando(sol)}>
                      Cancelar
                    </button>
                  )}
                </div>
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

              <div className={styles.cardRodape}>
                <span>Solicitante: {sol.solicitante_nome}</span>
                {sol.operador_nome && <span>Operador: {sol.operador_nome}</span>}
              </div>
            </div>
          ))
        )}
      </div>

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

      {solicitacaoSelecionada && (
        <ModalDetalhesSolicitacao
          solicitacao={solicitacaoSelecionada}
          onFechar={() => setSolicitacaoSelecionada(null)}
          onAtualizar={() => {
            setSolicitacaoSelecionada(null)
            addToast('Solicitação atualizada!', 'sucesso')
            carregarSolicitacoes()
          }}
        />
      )}

      {solicitacaoCancelando && (
        <ModalConfirmacao
          titulo="Cancelar solicitação"
          mensagem="Tem certeza que deseja cancelar esta solicitação? Esta ação não pode ser desfeita."
          onConfirmar={handleCancelar}
          onCancelar={() => setSolicitacaoCancelando(null)}
          tipo="aviso"
        />
      )}
    </div>
  )
}

export default Solicitacoes