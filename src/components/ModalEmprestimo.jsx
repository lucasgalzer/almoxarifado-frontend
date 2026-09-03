import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useToast } from './Toast'
import styles from './ModalProduto.module.css'
import Select from 'react-select'
import reactSelectStyles from '../utils/reactSelectStyles'
import { tocarSom } from '../utils/sons'

function ModalEmprestimo({ onFechar, onSalvar }) {
  const { addToast } = useToast()

  const [pessoas, setPessoas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [buscandoProduto, setBuscandoProduto] = useState(false)

  const [produtosSelecionados, setProdutosSelecionados] = useState([])

  const [form, setForm] = useState({
    codigo_interno: '',
    pessoa_id: '',
    observacoes: '',
  })

  const codigoRef = useRef(null)

  const opcoesPessoas = pessoas.map(p => ({
    value: p.id,
    label: `${p.nome_completo}${p.setor ? ` — ${p.setor}` : ''}`,
  }))

  useEffect(() => {
    api.get('/pessoas', { params: { ativo: true } })
      .then(({ data }) => setPessoas(data))
      .catch(console.error)

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

  async function handleBuscarProduto() {
    const codigo = form.codigo_interno.trim()

    if (!codigo || buscandoProduto) return

    setBuscandoProduto(true)
    setErro('')

    try {
      const { data } = await api.get('/produtos', {
        params: { por_pagina: 'todos' }
      })

      const produto = data.dados.find(p =>
        p.codigo_interno?.toLowerCase() === codigo.toLowerCase()
      )
      

      if (!produto) {
        setErro(`Produto "${codigo}" não encontrado`)
        return
      }

      if (produto.tipo !== 'reutilizavel') {
        setErro(`"${produto.nome}" é consumível e não pode ser emprestado`)
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

      // Verifica se este equipamento já está emprestado
const { data: emprestimosAtivos } = await api.get('/emprestimos', {
  params: {
    status: 'emprestado',
    produto_id: produto.id
  }
})

if (emprestimosAtivos.length > 0) {
  const emprestimo = emprestimosAtivos[0]

  setErro(
    `"${produto.nome}" (${produto.codigo_interno}) já está emprestado para ${emprestimo.pessoa_nome}`
  )

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

    setCarregando(true)

    try {
      await api.post('/emprestimos', {
        produtos_ids: produtosSelecionados.map(produto => produto.id),
        pessoa_id: form.pessoa_id,
        observacoes: form.observacoes,
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
              styles={reactSelectStyles}
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
                  pessoa_id: opcao?.value || '',
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

              <button
                type="button"
                onClick={handleBuscarProduto}
                disabled={
                  buscandoProduto ||
                  !form.codigo_interno.trim()
                }
                style={{
                  padding: '9px 18px',
                  background: 'var(--color-secondary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: buscandoProduto ? 0.7 : 1,
                }}
              >
                {buscandoProduto ? 'Buscando...' : 'Adicionar'}
              </button>
            </div>

            <span
              style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                marginTop: '5px',
              }}
            >
              Escaneie o código de barras ou digite o código e pressione Enter.
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