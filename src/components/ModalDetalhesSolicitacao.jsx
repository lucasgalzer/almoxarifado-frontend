import { useState } from 'react'
import api from '../services/api'
import styles from './ModalDevolucao.module.css'
import estilos from './ModalDetalhesSolicitacao.module.css'

const ACOES = [
  { status: 'aprovada', label: '✅ Aprovar', classe: 'btnAprovar' },
  { status: 'pronta', label: '📦 Marcar como pronta', classe: 'btnPronta' },
  { status: 'entregue', label: '🎉 Confirmar entrega', classe: 'btnEntregue' },
  { status: 'recusada', label: '❌ Recusar', classe: 'btnRecusar' },
]

function ModalDetalhesSolicitacao({ solicitacao, onFechar, onAtualizar }) {
  const [observacoes, setObservacoes] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleAcao(status) {
    setErro('')
    setCarregando(true)
    try {
      await api.patch(`/solicitacoes/${solicitacao.id}/status`, { status, observacoes })
      onAtualizar()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao atualizar')
    } finally {
      setCarregando(false)
    }
  }

  function formatarData(data) {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const acoesDisponiveis = {
    pendente: ['aprovada', 'recusada'],
    aprovada: ['pronta', 'recusada'],
    pronta: ['entregue'],
    entregue: [],
    recusada: [],
    cancelada: [],
  }[solicitacao.status] || []

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={estilos.modal} onClick={e => e.stopPropagation()}>
        <div className={estilos.header}>
          <h2>Detalhes da Solicitação</h2>
          <button className={estilos.btnFechar} onClick={onFechar}>✕</button>
        </div>

        <div className={estilos.corpo}>
          <div className={estilos.infoBox}>
            <div className={estilos.infoLinha}>
              <span>Solicitante</span>
              <strong>{solicitacao.solicitante_nome}</strong>
            </div>
            <div className={estilos.infoLinha}>
              <span>Status</span>
              <strong>{solicitacao.status}</strong>
            </div>
            {solicitacao.finalidade && (
              <div className={estilos.infoLinha}>
                <span>Finalidade</span>
                <strong>{solicitacao.finalidade}</strong>
              </div>
            )}
            {solicitacao.data_desejada && (
              <div className={estilos.infoLinha}>
                <span>Data desejada</span>
                <strong>{formatarData(solicitacao.data_desejada)}</strong>
              </div>
            )}
            {solicitacao.observacoes && (
              <div className={estilos.infoLinha}>
                <span>Observações</span>
                <strong>{solicitacao.observacoes}</strong>
              </div>
            )}
          </div>

          <div className={estilos.secao}>
            <h3>Itens solicitados</h3>
            <div className={estilos.itensList}>
              {solicitacao.itens.map(item => (
                <div key={item.id} className={estilos.itemRow}>
                  <span>{item.produto_nome}</span>
                  <span className={estilos.itemQtd}>
                    {item.quantidade_solicitada} {item.unidade_medida}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {acoesDisponiveis.length > 0 && (
            <div className={estilos.secao}>
              <h3>Atualizar status</h3>
              <textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Observações (opcional)"
                className={estilos.textarea}
                rows={2}
              />
              {erro && <div className={estilos.erro}>{erro}</div>}
              <div className={estilos.acoes}>
                {ACOES.filter(a => acoesDisponiveis.includes(a.status)).map(acao => (
                  <button
                    key={acao.status}
                    onClick={() => handleAcao(acao.status)}
                    disabled={carregando}
                    className={`${estilos.btnAcao} ${estilos[acao.classe]}`}
                  >
                    {acao.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModalDetalhesSolicitacao