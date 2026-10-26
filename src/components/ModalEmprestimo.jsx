import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useToast } from './Toast'
import styles from './ModalProduto.module.css'
import Select from 'react-select'
import { tocarSom } from '../utils/sons'

function ModalEmprestimo({ onFechar, onSalvar }) {
  const { addToast } = useToast()

  const [pessoas, setPessoas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [periodos, setPeriodos] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [buscandoProduto, setBuscandoProduto] = useState(false)
  const [verificandoDisponibilidade, setVerificandoDisponibilidade] = useState(false)
  const [disponibilidade, setDisponibilidade] = useState(null)

  const [produtosSelecionados, setProdutosSelecionados] = useState([])

  const [form, setForm] = useState({
    codigo_interno: '',
    pessoa_id: '',
    data_retirada: '',
    periodo_retirada_id: '',
    data_devolucao_prevista: '',
    periodo_devolucao_prevista_id: '',
    observacoes: '',
  })

  const codigoRef = useRef(null)

  const opcoesPessoas = pessoas.map(p => ({
    value: String(p.id),
    label: `${p.nome_completo}${p.setor ? ` — ${p.setor}` : ''}`,
  }))
  const produtosFiltrados = produtos.filter(produto => {
    const termo = form.codigo_interno.trim().toLocaleLowerCase('pt-BR')
    return termo && (
      String(produto.codigo_interno || '').toLocaleLowerCase('pt-BR').includes(termo) ||
      String(produto.nome || '').toLocaleLowerCase('pt-BR').includes(termo)
    )
  }).slice(0, 8)

  useEffect(() => {
    api.get('/pessoas', { params: { ativo: true } })
      .then(({ data }) => setPessoas(data))
      .catch(console.error)

    api.get('/produtos', { params: { por_pagina: 'todos' } })
      .then(({ data }) => setProdutos(Array.isArray(data) ? data : data.dados || []))
      .catch(console.error)

    api.get('/emprestimos/periodos')
      .then(({ data }) => {
        const lista = Array.isArray(data) ? data : data.dados || []
        setPeriodos(lista)
        const hoje = new Date()
        const amanha = new Date(hoje)
        amanha.setDate(hoje.getDate() + 1)
        const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        setForm(prev => ({
          ...prev,
          data_retirada: iso(hoje),
          periodo_retirada_id: String(lista[0]?.id || ''),
          data_devolucao_prevista: iso(amanha),
          periodo_devolucao_prevista_id: String(lista[1]?.id || lista[0]?.id || ''),
        }))
      })
      .catch(error => {
        console.error(error)
        setErro('Não foi possível carregar os períodos de aula')
      })

    setTimeout(() => codigoRef.current?.focus(), 100)
  }, [])

  function handleChange(e) {
    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value,
    }))

    if (name === 'codigo_interno') {
      setErro('')
    }
  }

  // Consulta a disponibilidade assim que os equipamentos e o período
  // estiverem preenchidos. O backend também valida novamente ao registrar.
  useEffect(() => {
    const datasPreenchidas =
      form.data_retirada &&
      form.periodo_retirada_id &&
      form.data_devolucao_prevista &&
      form.periodo_devolucao_prevista_id

    if (!produtosSelecionados.length || !datasPreenchidas) {
      setDisponibilidade(null)
      setVerificandoDisponibilidade(false)
      return
    }

    let ativo = true
    const timer = setTimeout(async () => {
      setVerificandoDisponibilidade(true)
      setDisponibilidade(null)

      try {
        const { data } = await api.post('/emprestimos/disponibilidade', {
          itens: produtosSelecionados.map(produto => ({
            produto_id: produto.id,
            quantidade: 1
          })),
          data_retirada: form.data_retirada,
          periodo_retirada_id: form.periodo_retirada_id,
          data_devolucao_prevista: form.data_devolucao_prevista,
          periodo_devolucao_prevista_id: form.periodo_devolucao_prevista_id
        })

        if (ativo) setDisponibilidade(data)
      } catch (error) {
        if (ativo) {
          setDisponibilidade({
            disponivel: false,
            erro: error.response?.data?.erro || 'Não foi possível verificar a disponibilidade.'
          })
        }
      } finally {
        if (ativo) setVerificandoDisponibilidade(false)
      }
    }, 350)

    return () => {
      ativo = false
      clearTimeout(timer)
    }
  }, [
    produtosSelecionados,
    form.data_retirada,
    form.periodo_retirada_id,
    form.data_devolucao_prevista,
    form.periodo_devolucao_prevista_id
  ])


  async function handleBuscarProduto() {
    const codigo = form.codigo_interno.trim()

    if (!codigo || buscandoProduto) return

    setBuscandoProduto(true)
    setErro('')

    try {
      const { data } = await api.get('/produtos', {
        params: { por_pagina: 'todos' }
      })

      const listaProdutos = Array.isArray(data) ? data : data.dados || []
      const produto = listaProdutos.find(p => p.codigo_interno?.toLowerCase() === codigo.toLowerCase()) || listaProdutos.find(p => p.nome?.toLocaleLowerCase('pt-BR').includes(codigo.toLocaleLowerCase('pt-BR')))
      

      if (!produto) {
        setErro(`Produto "${codigo}" não encontrado`)
        return
      }

      if (produto.status !== 'disponivel') {
        setErro(`"${produto.nome}" está ${produto.status}`)
        return
      }
if (produto.quantidade_atual <= 0) {
  setErro(`"${produto.nome}" não tem estoque disponível`)
  tocarSom('erro')
  return
}

if (
  produto.tipo_controle === 'individual' &&
  produto.status !== 'disponivel'
) {
  setErro(`"${produto.nome}" está ${produto.status}`)
  tocarSom('erro')
  return
}

      const jaAdicionado = produtosSelecionados.some(
        p => p.id === produto.id
      )

      if (jaAdicionado) {
        setErro(`"${produto.nome}" (${produto.codigo_interno}) já foi adicionado`)
        tocarSom('erro')
        return
      }

      setProdutosSelecionados(prev => [
        ...prev,
        produto
      ])

      // Somente toca quando o equipamento foi realmente adicionado
      tocarSom('emprestimo')

      // Limpa o campo para o próximo código
      setForm(prev => ({
        ...prev,
        codigo_interno: ''
      }))

      // Mantém o leitor/campo pronto para o próximo equipamento
      setTimeout(() => {
        codigoRef.current?.focus()
      }, 50)

    } catch (error) {
      console.error(error)
      setErro('Erro ao buscar produto')
    } finally {
      setBuscandoProduto(false)
    }
  }

  function handleSelecionarProduto(produto) {
    if (!produto || buscandoProduto) return
    if (produto.status !== 'disponivel') {
      setErro(`"${produto.nome}" está ${produto.status}`)
      tocarSom('erro')
      return
    }
    if (Number(produto.quantidade_atual || 0) <= 0) {
      setErro(`"${produto.nome}" não tem estoque disponível`)
      tocarSom('erro')
      return
    }
    if (produtosSelecionados.some(p => String(p.id) === String(produto.id))) {
      setErro(`"${produto.nome}" já foi adicionado`)
      tocarSom('erro')
      return
    }
    setProdutosSelecionados(prev => [...prev, produto])
    setErro('')
    setForm(prev => ({ ...prev, codigo_interno: '' }))
    tocarSom('emprestimo')
    setTimeout(() => codigoRef.current?.focus(), 50)
  }

  function removerProduto(id) {
    setProdutosSelecionados(prev =>
      prev.filter(produto => produto.id !== id)
    )

    setTimeout(() => {
      codigoRef.current?.focus()
    }, 50)
  }

  function limparProdutos() {
    setProdutosSelecionados([])
    setErro('')

    setTimeout(() => {
      codigoRef.current?.focus()
    }, 50)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setErro('')

    if (produtosSelecionados.length === 0) {
      return setErro('Adicione pelo menos um equipamento')
    }

    if (!form.pessoa_id) {
      return setErro('Selecione uma pessoa')
    }

    if (disponibilidade && disponibilidade.disponivel === false) {
      return setErro(disponibilidade.erro || 'Um ou mais equipamentos não estão disponíveis em todo o período selecionado. Ajuste as datas ou os equipamentos.')
    }

    if (
      form.data_devolucao_prevista === form.data_retirada &&
      Number(periodos.find(p => String(p.id) === String(form.periodo_devolucao_prevista_id))?.ordem) <=
        Number(periodos.find(p => String(p.id) === String(form.periodo_retirada_id))?.ordem)
    ) {
      return setErro('O período de devolução deve ser posterior ao período de retirada')
    }

    setCarregando(true)

    try {
      await api.post('/emprestimos', {
        pessoa_id: form.pessoa_id,
        data_retirada: form.data_retirada,
        periodo_retirada_id: form.periodo_retirada_id,
        data_devolucao_prevista: form.data_devolucao_prevista,
        periodo_devolucao_prevista_id: form.periodo_devolucao_prevista_id,
        observacoes: form.observacoes,
        origem: 'direto',
        itens: produtosSelecionados.map(produto => ({
          produto_id: produto.id,
          quantidade: 1,
        })),
      })

      addToast(
        `${produtosSelecionados.length} equipamento(s) adicionado(s) ao empréstimo!`,
        'sucesso'
      )

      onSalvar()

    } catch (error) {
      const msg =
        error.response?.data?.erro ||
        'Erro ao registrar empréstimo'

      setErro(msg)
      addToast(msg, 'erro')

    } finally {
      setCarregando(false)
    }
  }

  return (
    <div
      className={styles.overlay}
      data-modal-open="true"
      onClick={onFechar}
    >
      <div
  className={styles.modal}
  onClick={e => e.stopPropagation()}
  style={{
    width: '1000px',
    maxWidth: '95vw',
  }}
>

        {/* CABEÇALHO */}
        <div className={styles.header}>
          <div>
            <h2>Novo Empréstimo</h2>

          </div>

          <button
            className={styles.btnFechar}
            onClick={onFechar}
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {erro && (
            <div className={styles.erro}>
              {erro}
            </div>
          )}

          {/* SOLICITANTE */}
          <div className={styles.campo}>
            <label>Solicitante *</label>

            <Select
              className={styles.reactSelect}
              classNamePrefix="react-select"
              placeholder="Selecione uma pessoa"
              options={opcoesPessoas}
              value={
                opcoesPessoas.find(
                  op => op.value === form.pessoa_id
                ) || null
              }
              onChange={opcao =>
                setForm(prev => ({
                  ...prev,
                  pessoa_id: String(opcao?.value || ''),
                }))
              }
              isClearable
            />
          </div>

          {/* LEITOR */}
          <div className={styles.campo}>

            <label>Adicionar equipamento</label>

            <div
              style={{
                display: 'flex',
                gap: '8px',
              }}
            >
              <input
                ref={codigoRef}
                name="codigo_interno"
                value={form.codigo_interno}
                onChange={handleChange}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleBuscarProduto()
                  }
                }}
                placeholder="Digite ou escaneie o código..."
                disabled={buscandoProduto}
                autoComplete="off"
                style={{
                  flex: 1,
                  fontSize: '14px',
                }}
              />


            </div>

            {produtosFiltrados.length > 0 && (
              <div style={{ marginTop: 6, border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden' }}>
                {produtosFiltrados.map(produto => (
                  <button
                    key={produto.id}
                    type="button"
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => handleSelecionarProduto(produto)}
                    style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '8px 10px', textAlign: 'left', border: 0, borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer' }}
                  >
                    <strong>{produto.nome}</strong>
                    <small>{produto.codigo_interno} — Estoque: {produto.quantidade_atual ?? 0}</small>
                  </button>
                ))}
              </div>
            )}

            <span
              style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                marginTop: '5px',
              }}
            >
              Escaneie o código de barras ou digite o código/nome e pressione Enter.
            </span>

          </div>

          {/* EQUIPAMENTOS */}
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: 'var(--color-surface)',
            }}
          >

            {/* CABEÇALHO DA LISTA */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface-alt)',
              }}
            >

              <div>
                <strong
                  style={{
                    fontSize: '13px',
                  }}
                >
                  Equipamentos
                </strong>

                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    marginTop: '2px',
                  }}
                >
                  {produtosSelecionados.length === 0
                    ? 'Nenhum equipamento adicionado'
                    : `${produtosSelecionados.length} selecionado(s)`
                  }
                </div>
              </div>

              {produtosSelecionados.length > 0 && (
                <button
                  type="button"
                  onClick={limparProdutos}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#dc2626',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Limpar todos
                </button>
              )}

            </div>

            {/* LISTA COMPACTA */}
            {produtosSelecionados.length > 0 && (

              <div
                style={{
                  padding: '10px',
                  maxHeight: '230px',
                  overflowY: 'auto',
                }}
              >

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '6px',
                  }}
                >

                  {produtosSelecionados.map(produto => (

                    <div
                      key={produto.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '8px 10px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        background: 'var(--color-surface)',
                      }}
                    >

                      <div
                        style={{
                          minWidth: 0,
                        }}
                      >

                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={produto.nome}
                        >
                          {produto.nome}
                        </div>

                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--color-text-muted)',
                            marginTop: '2px',
                          }}
                        >
                          {produto.codigo_interno}
                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removerProduto(produto.id)
                        }
                        title="Remover equipamento"
                        style={{
                          flexShrink: 0,
                          width: '24px',
                          height: '24px',
                          border: 'none',
                          borderRadius: '50%',
                          background: '#fef2f2',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontWeight: '700',
                        }}
                      >
                        ×
                      </button>

                    </div>

                  ))}

                </div>

              </div>

            )}

            {/* ESTADO VAZIO */}
            {produtosSelecionados.length === 0 && (

              <div
                style={{
                  padding: '28px 15px',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: '12px',
                }}
              >
                Escaneie o primeiro equipamento para começar
              </div>

            )}

          </div>

          {/* Datas e períodos removidos da interface; metadados mantidos temporariamente para compatibilidade com a API. */}
          {/* OBSERVAÇÕES */}
          <div className={styles.campo}>

            <label>Observações</label>

            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={handleChange}
              rows={2}
              placeholder="Ex: Retirado para aula de artes — turma 6A"
            />

          </div>

          {/* AÇÕES */}
          <div className={styles.acoes}>

            <button
              type="button"
              onClick={onFechar}
              className={styles.btnCancelar}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                carregando ||
                produtosSelecionados.length === 0 ||
                !form.pessoa_id
              }
              className={styles.btnSalvar}
            >
              {carregando
                ? 'Registrando...'
                : produtosSelecionados.length > 0
                  ? `Registrar ${produtosSelecionados.length} equipamento(s)`
                  : 'Registrar Empréstimo'
              }
            </button>

          </div>

        </form>

      </div>
    </div>
  )
}

export default ModalEmprestimo