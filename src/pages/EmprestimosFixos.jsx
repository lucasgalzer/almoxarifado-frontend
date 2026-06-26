import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useToast } from '../components/Toast'
import ModalConfirmacao from '../components/ModalConfirmacao'
import styles from './EmprestimosFixos.module.css'

function EmprestimosFixos() {
  const { addToast } = useToast()
  const [emprestimos, setEmprestimos] = useState([])
  const [pessoas, setPessoas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtroBusca, setFiltroBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('ativo')
  const [modalAberto, setModalAberto] = useState(false)
  const [encerrando, setEncerrando] = useState(null)
  const [form, setForm] = useState({ pessoa_id: '', pessoaBusca: '', produto_codigo: '', sala: '', observacoes: '' })
  const [pessoasFiltradas, setPessoasFiltradas] = useState([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [pessoaSelecionada, setPessoaSelecionada] = useState(null)
  const [produtoEncontrado, setProdutoEncontrado] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const pessoaInputRef = useRef(null)

  useEffect(() => {
    api.get('/pessoas', { params: { ativo: true } })
      .then(({ data }) => setPessoas(data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    carregarEmprestimos()
  }, [filtroStatus])

  async function carregarEmprestimos() {
    try {
      setCarregando(true)
      const params = {}
      if (filtroStatus) params.status = filtroStatus
      const { data } = await api.get('/emprestimos-fixos', { params })
      setEmprestimos(data)
    } catch (error) {
      console.error(error)
    } finally {
      setCarregando(false)
    }
  }

  function handlePessoaBusca(e) {
    const valor = e.target.value
    setForm(prev => ({ ...prev, pessoaBusca: valor, pessoa_id: '' }))
    setPessoaSelecionada(null)
    if (valor.length >= 2) {
      const filtradas = pessoas.filter(p =>
        p.nome_completo.toLowerCase().includes(valor.toLowerCase())
      )
      setPessoasFiltradas(filtradas)
      setMostrarSugestoes(true)
    } else {
      setMostrarSugestoes(false)
    }
  }

  function selecionarPessoa(pessoa) {
    setForm(prev => ({ ...prev, pessoa_id: pessoa.id, pessoaBusca: pessoa.nome_completo }))
    setPessoaSelecionada(pessoa)
    setMostrarSugestoes(false)
  }

  async function buscarProduto() {
    if (!form.produto_codigo.trim()) return
    setBuscando(true)
    setProdutoEncontrado(null)
    setErro('')
    try {
      const { data } = await api.get('/produtos', { params: { por_pagina: 'todos' } })
      const produto = data.dados.find(p =>
        p.codigo_interno.toLowerCase() === form.produto_codigo.trim().toLowerCase()
      )
      if (!produto) {
        setErro(`Produto "${form.produto_codigo}" não encontrado`)
      } else if (produto.tipo !== 'reutilizavel') {
        setErro(`"${produto.nome}" é consumível`)
      } else if (produto.status !== 'disponivel') {
        setErro(`"${produto.nome}" está ${produto.status}`)
      } else {
        setProdutoEncontrado(produto)
      }
    } catch {
      setErro('Erro ao buscar produto')
    } finally {
      setBuscando(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (!form.pessoa_id) return setErro('Selecione uma pessoa')
    if (!produtoEncontrado) return setErro('Busque um produto válido')
    if (!form.sala.trim()) return setErro('Informe a sala onde o item ficará')

    setSalvando(true)
    try {
      await api.post('/emprestimos-fixos', {
        pessoa_id: form.pessoa_id,
        produto_id: produtoEncontrado.id,
        sala: form.sala,
        observacoes: form.observacoes,
      })
      addToast('Empréstimo fixo registrado!', 'sucesso')
      setModalAberto(false)
      setForm({ pessoa_id: '', pessoaBusca: '', produto_codigo: '', sala: '', observacoes: '' })
      setProdutoEncontrado(null)
      setPessoaSelecionada(null)
      carregarEmprestimos()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao registrar')
    } finally {
      setSalvando(false)
    }
  }

  async function encerrarEmprestimo() {
    try {
      await api.patch(`/emprestimos-fixos/${encerrando.id}/encerrar`)
      addToast('Empréstimo fixo encerrado!', 'sucesso')
      setEncerrando(null)
      carregarEmprestimos()
    } catch (error) {
      addToast(error.response?.data?.erro || 'Erro ao encerrar', 'erro')
      setEncerrando(null)
    }
  }

  function formatarData(data) {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  // Filtra por busca de nome
  const emprestimosFiltrados = filtroBusca
    ? emprestimos.filter(e =>
        e.pessoa_nome.toLowerCase().includes(filtroBusca.toLowerCase())
      )
    : emprestimos

  const pessoasComEmprestimo = [...new Map(
    emprestimosFiltrados.map(e => [e.pessoa_id, { id: e.pessoa_id, nome: e.pessoa_nome, setor: e.pessoa_setor }])
  ).values()]

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Empréstimos Fixos</h1>
          <p className={styles.subtitulo}>{emprestimosFiltrados.length} registro(s)</p>
        </div>
        <button className={styles.btnNovo} onClick={() => {
          setModalAberto(true)
          setErro('')
          setProdutoEncontrado(null)
          setPessoaSelecionada(null)
          setForm({ pessoa_id: '', pessoaBusca: '', produto_codigo: '', sala: '', observacoes: '' })
        }}>
          + Novo Empréstimo Fixo
        </button>
      </div>

      <div className={styles.filtros}>
        <input
          type="text"
          placeholder="Buscar por nome da pessoa..."
          value={filtroBusca}
          onChange={e => setFiltroBusca(e.target.value)}
          className={styles.inputBusca}
        />
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className={styles.select}>
          <option value="ativo">Ativos</option>
          <option value="encerrado">Encerrados</option>
          <option value="">Todos</option>
        </select>
      </div>

      {carregando ? (
        <div className={styles.vazio}>Carregando...</div>
      ) : emprestimosFiltrados.length === 0 ? (
        <div className={styles.vazio}>Nenhum empréstimo fixo encontrado.</div>
      ) : (
        <div className={styles.grupos}>
          {pessoasComEmprestimo.map(pessoa => {
            const itens = emprestimosFiltrados.filter(e => e.pessoa_id === pessoa.id)
            return (
              <div key={pessoa.id} className={styles.grupo}>
                <div className={styles.grupoHeader}>
                  <div>
                    <strong className={styles.grupoPessoa}>{pessoa.nome}</strong>
                    {pessoa.setor && <span className={styles.grupoSetor}>{pessoa.setor}</span>}
                  </div>
                  <span className={styles.grupoCount}>{itens.length} item(s)</span>
                </div>
                <div className={styles.tabela}>
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Produto</th>
                        <th>Sala</th>
                        <th>Data início</th>
                        <th>Status</th>
                        <th>Operador</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map(emp => (
                        <tr key={emp.id}>
                          <td>{emp.codigo_interno}</td>
                          <td><strong>{emp.produto_nome}</strong></td>
                          <td>{emp.sala || emp.localizacao_fisica || '—'}</td>
                          <td>{formatarData(emp.data_inicio)}</td>
                          <td>
                            <span className={`${styles.badge} ${emp.status === 'ativo' ? styles.badgeAtivo : styles.badgeEncerrado}`}>
                              {emp.status === 'ativo' ? 'Ativo' : 'Encerrado'}
                            </span>
                          </td>
                          <td>{emp.usuario_nome || '—'}</td>
                          <td>
                            {emp.status === 'ativo' && (
                              <button className={styles.btnEncerrar} onClick={() => setEncerrando(emp)}>
                                Encerrar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalAberto && (
        <div className={styles.overlay} onClick={() => setModalAberto(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Novo Empréstimo Fixo</h2>
              <button className={styles.btnFechar} onClick={() => setModalAberto(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              {erro && <div className={styles.erro}>{erro}</div>}

              <div className={styles.campo} style={{ position: 'relative' }}>
                <label>Pessoa *</label>
                <input
                  ref={pessoaInputRef}
                  value={form.pessoaBusca}
                  onChange={handlePessoaBusca}
                  onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
                  placeholder="Digite o nome da pessoa..."
                  style={{ borderColor: pessoaSelecionada ? 'var(--color-primary)' : undefined }}
                />
                {mostrarSugestoes && pessoasFiltradas.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
                    zIndex: 100, maxHeight: '200px', overflowY: 'auto'
                  }}>
                    {pessoasFiltradas.map(p => (
                      <div
                        key={p.id}
                        onClick={() => selecionarPessoa(p)}
                        style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid var(--color-border)' }}
                        onMouseEnter={e => e.target.style.background = 'var(--color-surface-alt)'}
                        onMouseLeave={e => e.target.style.background = ''}
                      >
                        <strong>{p.nome_completo}</strong>
                        {p.setor && <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px', fontSize: '12px' }}>{p.setor}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {pessoaSelecionada && (
                  <p style={{ fontSize: '12px', color: 'var(--color-primary)', margin: '4px 0 0' }}>
                    ✓ {pessoaSelecionada.nome_completo} {pessoaSelecionada.setor ? `— ${pessoaSelecionada.setor}` : ''}
                  </p>
                )}
              </div>

              <div className={styles.campo}>
                <label>Código do produto *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={form.produto_codigo}
                    onChange={e => { setForm(prev => ({ ...prev, produto_codigo: e.target.value })); setProdutoEncontrado(null) }}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), buscarProduto())}
                    placeholder="Digite ou escaneie o código"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={buscarProduto}
                    disabled={buscando || !form.produto_codigo.trim()}
                    style={{ padding: '9px 16px', background: 'var(--color-secondary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {buscando ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </div>

              {produtoEncontrado && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: '13px', color: '#15803d' }}>
                  <strong>{produtoEncontrado.nome}</strong> — {produtoEncontrado.codigo_interno}
                  {produtoEncontrado.localizacao_fisica && <span style={{ fontSize: '12px' }}> · {produtoEncontrado.localizacao_fisica}</span>}
                </div>
              )}

              <div className={styles.campo}>
                <label>Sala *</label>
                <input
                  value={form.sala}
                  onChange={e => setForm(prev => ({ ...prev, sala: e.target.value }))}
                  placeholder="Ex: Sala 12, Laboratório de Informática"
                />
              </div>

              <div className={styles.campo}>
                <label>Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={2}
                  placeholder="Ex: Notebook para uso em sala de aula"
                />
              </div>

              <div className={styles.modalAcoes}>
                <button type="button" onClick={() => setModalAberto(false)} className={styles.btnCancelar}>Cancelar</button>
                <button type="submit" disabled={salvando || !produtoEncontrado || !form.pessoa_id} className={styles.btnSalvar}>
                  {salvando ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {encerrando && (
        <ModalConfirmacao
          titulo="Encerrar empréstimo fixo"
          mensagem={`Tem certeza que deseja encerrar o empréstimo de "${encerrando.produto_nome}" para ${encerrando.pessoa_nome}? O produto voltará a ficar disponível.`}
          onConfirmar={encerrarEmprestimo}
          onCancelar={() => setEncerrando(null)}
        />
      )}
    </div>
  )
}

export default EmprestimosFixos