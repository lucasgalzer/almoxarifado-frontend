import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import styles from './ModalProduto.module.css'

function ModalSolicitacao({ onFechar, onSalvar }) {
  const [catalogo, setCatalogo] = useState({ setores: [], servicos: [], periodos: [] })
  const [setorId, setSetorId] = useState('')
  const [servicoId, setServicoId] = useState('')
  const [respostas, setRespostas] = useState({})
  const [itens, setItens] = useState([{ servico_recurso_id: '', quantidade: 1, observacoes: '' }])
  const [periodos, setPeriodos] = useState([{ data: '', periodo_id: '' }])
  const [observacoes, setObservacoes] = useState('')
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    api.get('/solicitacao-configuracao/catalogo')
      .then(({ data }) => {
        if (ativo) setCatalogo({ setores: data.setores || [], servicos: data.servicos || [], periodos: data.periodos || [] })
      })
      .catch(error => { if (ativo) setErro(error.response?.data?.erro || 'Não foi possível carregar setores e serviços.') })
      .finally(() => { if (ativo) setCarregandoCatalogo(false) })
    return () => { ativo = false }
  }, [])

  const servicosDoSetor = useMemo(
    () => catalogo.servicos.filter(item => String(item.setor_id) === String(setorId)),
    [catalogo.servicos, setorId]
  )
  const servico = servicosDoSetor.find(item => String(item.id) === String(servicoId))

  function resetarFormulario() {
    setRespostas({})
    setItens([{ servico_recurso_id: '', quantidade: 1, observacoes: '' }])
    setPeriodos([{ data: '', periodo_id: '' }])
    setErro('')
  }
  function mudarSetor(value) {
    setSetorId(value)
    setServicoId('')
    resetarFormulario()
  }
  function mudarServico(value) {
    setServicoId(value)
    resetarFormulario()
  }
  function mudarItem(index, campo, value) {
    setItens(prev => prev.map((item, i) => i === index ? { ...item, [campo]: value } : item))
  }
  function mudarPeriodo(index, campo, value) {
    setPeriodos(prev => prev.map((item, i) => i === index ? { ...item, [campo]: value } : item))
  }

  function renderCampo(campo) {
    const value = respostas[campo.id] ?? ''
    const common = {
      id: campo.id,
      name: campo.nome,
      required: Boolean(campo.obrigatorio),
      value,
      onChange: e => setRespostas(prev => ({ ...prev, [campo.id]: e.target.value })),
    }
    if (campo.tipo === 'texto_longo') return <textarea {...common} rows={3} />
    if (campo.tipo === 'select') return (
      <select {...common}>
        <option value="">Selecione...</option>
        {(campo.opcoes || []).map(opcao => (
          <option key={opcao.id} value={opcao.valor}>{opcao.valor}</option>
        ))}
      </select>
    )
    if (campo.tipo === 'checkbox') return (
      <select {...common}><option value="">Selecione...</option><option value="true">Sim</option><option value="false">Não</option></select>
    )
    if (campo.tipo === 'arquivo') return <input {...common} type="text" placeholder="Cole o link do arquivo" />
    const tipos = { numero: 'number', data: 'date', hora: 'time' }
    return <input {...common} type={tipos[campo.tipo] || 'text'} />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')
    if (!setorId) return setErro('Selecione o setor de destino.')
    if (!servico) return setErro('Selecione o serviço que deseja solicitar.')

    const respostasPayload = (servico.campos || []).map(campo => ({ campo_id: campo.id, valor: respostas[campo.id] ?? '' }))
    if (servico.usa_recurso && (!itens.length || itens.some(item => !item.servico_recurso_id || !Number.isFinite(Number(item.quantidade)) || Number(item.quantidade) <= 0))) {
      return setErro('Selecione os recursos e informe uma quantidade válida para todos os itens.')
    }
    let periodosPayload = []
    if (servico.usa_periodos) {
      if (!periodos.length || periodos.some(item => !item.data || !item.periodo_id)) return setErro('Preencha a data e o período para cada horário solicitado.')
      const chaves = periodos.map(item => `${item.data}|${item.periodo_id}`)
      if (new Set(chaves).size !== chaves.length) return setErro('Remova datas e períodos duplicados.')
      periodosPayload = periodos
    }

    setEnviando(true)
    try {
      await api.post('/solicitacoes', {
        setor_id: setorId,
        servico_id: servico.id,
        observacoes,
        respostas: respostasPayload,
        itens: servico.usa_recurso ? itens.map(item => ({
          servico_recurso_id: item.servico_recurso_id,
          quantidade: Number(item.quantidade),
          observacoes: item.observacoes || null,
        })) : [],
        periodos: periodosPayload,
      })
      onSalvar()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao enviar a solicitação.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={styles.overlay} data-modal-open="true" onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ width: 760, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className={styles.header}>
          <div>
            <h2>Nova solicitação</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>Escolha o setor responsável e preencha o formulário correspondente.</p>
          </div>
          <button className={styles.btnFechar} onClick={onFechar} type="button">✕</button>
        </div>
        {erro && <div className={styles.erro}>{erro}</div>}
        {carregandoCatalogo ? <div style={{ padding: 24 }}>Carregando setores e serviços...</div> : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.campo}>
              <label htmlFor="setor-destino">Setor de destino *</label>
              <select id="setor-destino" value={setorId} onChange={e => mudarSetor(e.target.value)} required>
                <option value="">Selecione o setor responsável</option>
                {catalogo.setores.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
              </select>
            </div>
            <div className={styles.campo}>
              <label htmlFor="servico-destino">Tipo de solicitação *</label>
              <select id="servico-destino" value={servicoId} onChange={e => mudarServico(e.target.value)} disabled={!setorId} required>
                <option value="">{setorId ? 'Selecione o serviço' : 'Primeiro selecione um setor'}</option>
                {servicosDoSetor.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
              {servico?.descricao && <small style={{ color: 'var(--color-text-muted)' }}>{servico.descricao}</small>}
              {setorId && !servicosDoSetor.length && <small style={{ color: 'var(--color-danger)' }}>Este setor ainda não possui serviços ativos configurados.</small>}
            </div>
            {servico && (servico.campos || []).map(campo => (
              <div className={styles.campo} key={campo.id}>
                <label htmlFor={campo.id}>{campo.label}{campo.obrigatorio ? ' *' : ''}</label>
                {renderCampo(campo)}
              </div>
            ))}
            {servico?.usa_recurso && <section style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 14 }}>
              <h3 style={{ marginTop: 0 }}>Recursos solicitados *</h3>
              {itens.map((item, index) => <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 2fr) minmax(80px, .6fr) 36px', gap: 8, marginBottom: 10, alignItems: 'end' }}>
                <div className={styles.campo}><label>Recurso</label><select value={item.servico_recurso_id} onChange={e => mudarItem(index, 'servico_recurso_id', e.target.value)} required>
                  <option value="">Selecione...</option>
                  {(servico.recursos || []).map(recurso => <option key={recurso.id} value={recurso.id}>{recurso.nome_exibicao || recurso.categoria_nome || recurso.produto_nome || 'Recurso'}{recurso.produto_codigo ? ` (${recurso.produto_codigo})` : ''}</option>)}
                </select></div>
                <div className={styles.campo}><label>Quantidade</label><input type="number" min="1" step="1" value={item.quantidade} onChange={e => mudarItem(index, 'quantidade', e.target.value)} required /></div>
                <button type="button" className={styles.btnFechar} title="Remover item" onClick={() => setItens(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== index))} disabled={itens.length === 1}>×</button>
              </div>)}
              <button type="button" className={styles.btnCancelar} onClick={() => setItens(prev => [...prev, { servico_recurso_id: '', quantidade: 1, observacoes: '' }])}>+ Adicionar recurso</button>
              {!(servico.recursos || []).length && <p style={{ color: 'var(--color-text-muted)' }}>Nenhum recurso foi vinculado a este serviço.</p>}
            </section>}
            {servico?.usa_periodos && <section style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 14 }}>
              <h3 style={{ marginTop: 0 }}>Datas e períodos *</h3>
              {periodos.map((periodo, index) => <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: 8, marginBottom: 10, alignItems: 'end' }}>
                <div className={styles.campo}><label>Data</label><input type="date" value={periodo.data} onChange={e => mudarPeriodo(index, 'data', e.target.value)} required /></div>
                <div className={styles.campo}><label>Período</label><select value={periodo.periodo_id} onChange={e => mudarPeriodo(index, 'periodo_id', e.target.value)} required>
                  <option value="">Selecione...</option>
                  {catalogo.periodos.map(item => <option key={item.id} value={item.id}>{item.nome}{item.horario ? ` — ${item.horario}` : ''}</option>)}
                </select></div>
                <button type="button" className={styles.btnFechar} title="Remover período" onClick={() => setPeriodos(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== index))} disabled={periodos.length === 1}>×</button>
              </div>)}
              <button type="button" className={styles.btnCancelar} onClick={() => setPeriodos(prev => [...prev, { data: '', periodo_id: '' }])}>+ Adicionar data/período</button>
              {!catalogo.periodos.length && <p style={{ color: 'var(--color-danger)' }}>Não há períodos de aula ativos cadastrados.</p>}
            </section>}
            <div className={styles.campo}><label htmlFor="observacoes-solicitacao">Observações adicionais</label><textarea id="observacoes-solicitacao" value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3} placeholder="Detalhes adicionais para o setor responsável" /></div>
            <div className={styles.acoes}>
              <button type="button" onClick={onFechar} className={styles.btnCancelar}>Cancelar</button>
              <button type="submit" disabled={enviando || carregandoCatalogo || !servico} className={styles.btnSalvar}>{enviando ? 'Enviando...' : 'Enviar solicitação'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
export default ModalSolicitacao
