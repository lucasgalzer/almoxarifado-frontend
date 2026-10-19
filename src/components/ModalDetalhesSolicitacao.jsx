import { useState } from 'react'
import api from '../services/api'
import styles from './ModalDevolucao.module.css'
import estilos from './ModalDetalhesSolicitacao.module.css'

const ACOES = [
  { status: 'aprovada', label: 'Aprovar', classe: 'btnAprovar' },
  { status: 'recusada', label: 'Recusar', classe: 'btnRecusar' },
  { status: 'concluida', label: 'Marcar como concluída', classe: 'btnEntregue' },
  { status: 'cancelada', label: 'Cancelar solicitação', classe: 'btnRecusar' },
]
function ModalDetalhesSolicitacao({ solicitacao, onFechar, onAtualizar }) {
  const [observacoes, setObservacoes] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  async function handleAcao(status) {
    setErro('')
    setCarregando(true)
    try {
      await api.patch(`/solicitacoes/${solicitacao.id}/status`, { status, motivo_recusa: observacoes || undefined, observacoes: observacoes || undefined })
      onAtualizar()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao atualizar a solicitação.')
    } finally { setCarregando(false) }
  }
  const transicoes = { pendente: ['aprovada', 'recusada', 'cancelada'], aprovada: ['concluida', 'cancelada'], recusada: [], cancelada: [], concluida: [] }
  const acoesDisponiveis = transicoes[solicitacao.status] || []
  const formatarData = data => data ? new Date(`${String(data).slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR') : '—'
  const respostas = solicitacao.respostas || []
  const itens = solicitacao.itens || []
  return (
    <div className={styles.overlay} data-modal-open="true" onClick={onFechar}>
      <div className={estilos.modal} onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className={estilos.header}><h2>Detalhes da solicitação</h2><button className={estilos.btnFechar} onClick={onFechar} type="button">✕</button></div>
        <div className={estilos.corpo}>
          <div className={estilos.infoBox}>
            <div className={estilos.infoLinha}><span>Serviço</span><strong>{solicitacao.servico_nome || 'Solicitação'}</strong></div>
            <div className={estilos.infoLinha}><span>Setor responsável</span><strong>{solicitacao.setor_nome || '—'}</strong></div>
            <div className={estilos.infoLinha}><span>Solicitante</span><strong>{solicitacao.solicitante_nome || '—'}</strong></div>
            <div className={estilos.infoLinha}><span>Status</span><strong>{solicitacao.status}</strong></div>
            <div className={estilos.infoLinha}><span>Enviada em</span><strong>{formatarData(solicitacao.created_at)}</strong></div>
            {solicitacao.observacoes && <div className={estilos.infoLinha}><span>Observações</span><strong>{solicitacao.observacoes}</strong></div>}
          </div>
          {respostas.length > 0 && <div className={estilos.secao}><h3>Respostas do formulário</h3><div className={estilos.itensList}>{respostas.map(res => <div key={res.id} className={estilos.itemRow}><span>{res.campo_label || res.campo_nome}</span><strong>{res.valor || '—'}</strong></div>)}</div></div>}
          {itens.length > 0 && <div className={estilos.secao}><h3>Recursos solicitados</h3><div className={estilos.itensList}>{itens.map(item => <div key={item.id} className={estilos.itemRow} style={{ display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span>{item.nome_exibicao || item.categoria_nome || item.produto_nome || 'Recurso'}</span><strong>{item.quantidade}</strong></div>
            {item.observacoes && <small>{item.observacoes}</small>}
            {item.reserva?.periodos?.map(periodo => <div key={periodo.id} style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatarData(periodo.data)} · {periodo.periodo_nome}{periodo.horario ? ` (${periodo.horario})` : ''}</div>)}
          </div>)}</div></div>}
          {acoesDisponiveis.length > 0 && <div className={estilos.secao}><h3>Atualizar status</h3><textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observação ou motivo (opcional)" className={estilos.textarea} rows={2} />{erro && <div className={estilos.erro}>{erro}</div>}<div className={estilos.acoes}>{ACOES.filter(acao => acoesDisponiveis.includes(acao.status)).map(acao => <button key={acao.status} onClick={() => handleAcao(acao.status)} disabled={carregando} className={`${estilos.btnAcao} ${estilos[acao.classe]}`}>{carregando ? 'Salvando...' : acao.label}</button>)}</div></div>}
        </div>
      </div>
    </div>
  )
}
export default ModalDetalhesSolicitacao
