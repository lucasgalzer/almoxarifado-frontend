import { useEffect, useState } from 'react'
import api from '../services/api'
import ModalSolicitacao from '../components/ModalSolicitacao'
import ModalDetalhesSolicitacao from '../components/ModalDetalhesSolicitacao'
import ModalConfirmacao from '../components/ModalConfirmacao'
import { useToast } from '../components/Toast'
import styles from './Solicitacoes.module.css'
import Select from 'react-select'
import reactSelectStyles from '../utils/reactSelectStyles'

const STATUS = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'aprovada', label: 'Aprovadas' },
  { value: 'recusada', label: 'Recusadas' },
  { value: 'cancelada', label: 'Canceladas' },
  { value: 'concluida', label: 'Concluídas' },
]
const STATUS_LABEL = { pendente: 'Pendente', aprovada: 'Aprovada', recusada: 'Recusada', cancelada: 'Cancelada', concluida: 'Concluída' }

function Solicitacoes() {
  const { addToast } = useToast()
  const [solicitacoes, setSolicitacoes] = useState([])
  const [setores, setSetores] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroSetor, setFiltroSetor] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null)
  const [solicitacaoCancelando, setSolicitacaoCancelando] = useState(null)

  useEffect(() => {
    api.get('/setores').then(({ data }) => setSetores((data || []).filter(item => item.ativo))).catch(() => {})
  }, [])
  useEffect(() => { carregarSolicitacoes() }, [filtroStatus, filtroSetor])

  async function carregarSolicitacoes() {
    try {
      setCarregando(true)
      const params = {}
      if (filtroStatus) params.status = filtroStatus
      if (filtroSetor) params.setor_id = filtroSetor
      const { data } = await api.get('/solicitacoes', { params })
      setSolicitacoes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      addToast(error.response?.data?.erro || 'Erro ao carregar solicitações', 'erro')
    } finally { setCarregando(false) }
  }

  async function handleCancelar() {
    if (!solicitacaoCancelando) return
    try {
      await api.patch(`/solicitacoes/${solicitacaoCancelando.id}/status`, { status: 'cancelada' })
      addToast('Solicitação cancelada.', 'aviso')
      setSolicitacaoCancelando(null)
      carregarSolicitacoes()
    } catch (error) {
      addToast(error.response?.data?.erro || 'Erro ao cancelar solicitação', 'erro')
      setSolicitacaoCancelando(null)
    }
  }

  const formatarData = data => data ? new Date(data).toLocaleDateString('pt-BR') : '—'
  const pendentes = solicitacoes.filter(item => item.status === 'pendente').length
  const opcoesSetor = [{ value: '', label: 'Todos os setores' }, ...setores.map(item => ({ value: item.id, label: item.nome }))]
  const badgeStatus = status => ({ pendente: styles.badgePendente, aprovada: styles.badgeAprovada, recusada: styles.badgeRecusada, cancelada: styles.badgeCancelada, concluida: styles.badgeEntregue }[status] || '')

  return (
    <div>
      <div className={styles.header}>
        <div><h1 className={styles.titulo}>Central de Solicitações</h1><p className={styles.subtitulo}>{solicitacoes.length} solicitação(ões) encontradas</p></div>
        <button type="button" className={styles.btnNovo} onClick={() => setModalAberto(true)}>+ Nova solicitação</button>
      </div>
      <div style={{ marginBottom: 22, padding: 16, border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-surface)' }}>
        <strong style={{ display: 'block', marginBottom: 5 }}>Como funciona</strong>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Escolha o setor de destino, selecione um serviço e preencha o formulário configurado. A solicitação fica pendente para o setor responsável.</span>
      </div>
      {pendentes > 0 && <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#d97706', fontWeight: 600 }}>{pendentes} solicitação(ões) pendente(s)</div>}
      <div className={styles.filtros} style={{ flexWrap: 'wrap' }}>
        <Select className={styles.reactSelect} classNamePrefix="react-select" styles={reactSelectStyles} isSearchable={false} options={opcoesSetor} value={opcoesSetor.find(op => op.value === filtroSetor) || opcoesSetor[0]} onChange={op => setFiltroSetor(op?.value || '')} placeholder="Setor de destino" />
        <Select className={styles.reactSelect} classNamePrefix="react-select" styles={reactSelectStyles} isSearchable={false} options={STATUS} value={STATUS.find(op => op.value === filtroStatus) || STATUS[0]} onChange={op => setFiltroStatus(op?.value || '')} placeholder="Status" />
      </div>
      <div className={styles.lista}>
        {carregando ? <div className={styles.vazio}>Carregando solicitações...</div> : solicitacoes.length === 0 ? <div className={styles.vazio}>Nenhuma solicitação encontrada para estes filtros.</div> : solicitacoes.map(sol => (
          <article key={sol.id} className={styles.card}>
            <div className={styles.cardTopo}>
              <div className={styles.cardInfo}>
                <span className={`${styles.badge} ${badgeStatus(sol.status)}`}>{STATUS_LABEL[sol.status] || sol.status}</span>
                <strong>{sol.servico_nome || 'Solicitação'}</strong>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Destino: {sol.setor_nome || '—'}</span>
                <span className={styles.cardData}>Enviada em {formatarData(sol.created_at)}</span>
              </div>
              <div className={styles.cardAcoes}>
                <button className={styles.btnDetalhes} onClick={() => setSolicitacaoSelecionada(sol)}>Ver detalhes</button>
                {sol.status === 'pendente' && <button className={styles.btnCancelar} onClick={() => setSolicitacaoCancelando(sol)}>Cancelar</button>}
              </div>
            </div>
            {sol.solicitante_nome && <p className={styles.cardFinalidade}>Solicitante: {sol.solicitante_nome}</p>}
            {Array.isArray(sol.respostas) && sol.respostas.length > 0 && <div className={styles.cardItens}>{sol.respostas.slice(0, 3).map(res => <span key={res.id} className={styles.itemTag}>{res.campo_label || res.campo_nome}: {res.valor || '—'}</span>)}</div>}
            {Array.isArray(sol.itens) && sol.itens.length > 0 && <div className={styles.cardItens}>{sol.itens.map(item => <span key={item.id} className={styles.itemTag}>{item.nome_exibicao || item.categoria_nome || item.produto_nome || 'Recurso'} × {item.quantidade}</span>)}</div>}
            {sol.observacoes && <p className={styles.cardObs}>{sol.observacoes}</p>}
          </article>
        ))}
      </div>
      {modalAberto && <ModalSolicitacao onFechar={() => setModalAberto(false)} onSalvar={() => { setModalAberto(false); addToast('Solicitação enviada com sucesso!', 'sucesso'); carregarSolicitacoes() }} />}
      {solicitacaoSelecionada && <ModalDetalhesSolicitacao solicitacao={solicitacaoSelecionada} onFechar={() => setSolicitacaoSelecionada(null)} onAtualizar={() => { setSolicitacaoSelecionada(null); addToast('Solicitação atualizada!', 'sucesso'); carregarSolicitacoes() }} />}
      {solicitacaoCancelando && <ModalConfirmacao titulo="Cancelar solicitação" mensagem="Tem certeza que deseja cancelar esta solicitação? Esta ação não pode ser desfeita." onConfirmar={handleCancelar} onCancelar={() => setSolicitacaoCancelando(null)} tipo="aviso" />}
    </div>
  )
}
export default Solicitacoes
