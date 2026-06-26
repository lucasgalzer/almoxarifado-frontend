import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useToast } from './Toast'
import styles from './ModalProduto.module.css'

function ModalEmprestimo({ onFechar, onSalvar }) {
  const { addToast } = useToast()
  const [pessoas, setPessoas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [produtoEncontrado, setProdutoEncontrado] = useState(null)
  const [buscandoProduto, setBuscandoProduto] = useState(false)
  const codigoRef = useRef(null)

  const [form, setForm] = useState({
    codigo_interno: '',
    pessoa_id: '',
    observacoes: '',
  })

  useEffect(() => {
    api.get('/pessoas', { params: { ativo: true } })
      .then(({ data }) => setPessoas(data))
      .catch(console.error)
    setTimeout(() => codigoRef.current?.focus(), 100)
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'codigo_interno') {
      setProdutoEncontrado(null)
      setErro('')
    }
  }

  async function handleBuscarProduto() {
    if (!form.codigo_interno.trim()) return
    setBuscandoProduto(true)
    setProdutoEncontrado(null)
    setErro('')
    try {
      const { data } = await api.get('/produtos', { params: { por_pagina: 'todos' } })
      const produto = data.dados.find(p =>
        p.codigo_interno.toLowerCase() === form.codigo_interno.trim().toLowerCase()
      )
      if (!produto) {
        setErro(`Produto "${form.codigo_interno}" não encontrado`)
      } else if (produto.tipo !== 'reutilizavel') {
        setErro(`"${produto.nome}" é consumível e não pode ser emprestado`)
      } else if (produto.status !== 'disponivel') {
        setErro(`"${produto.nome}" está ${produto.status}`)
      } else if (produto.quantidade_atual <= 0) {
        setErro(`"${produto.nome}" não tem estoque disponível`)
      } else {
        setProdutoEncontrado(produto)
      }
    } catch {
      setErro('Erro ao buscar produto')
    } finally {
      setBuscandoProduto(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!produtoEncontrado) return setErro('Busque um produto válido')
    if (!form.pessoa_id) return setErro('Selecione uma pessoa')

    setCarregando(true)
    try {
      await api.post('/emprestimos', {
        produto_id: produtoEncontrado.id,
        pessoa_id: form.pessoa_id,
        observacoes: form.observacoes,
      })
      addToast('Empréstimo registrado com sucesso!', 'sucesso')
      onSalvar()
    } catch (error) {
      const msg = error.response?.data?.erro || 'Erro ao registrar empréstimo'
      setErro(msg)
      addToast(msg, 'erro')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Novo Empréstimo</h2>
          <button className={styles.btnFechar} onClick={onFechar}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {erro && <div className={styles.erro}>{erro}</div>}

          <div className={styles.campo}>
            <label>Código do produto *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={codigoRef}
                name="codigo_interno"
                value={form.codigo_interno}
                onChange={handleChange}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleBuscarProduto())}
                placeholder="Digite ou escaneie o código"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleBuscarProduto}
                disabled={buscandoProduto || !form.codigo_interno.trim()}
                style={{
                  padding: '9px 16px',
                  background: 'var(--color-secondary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: buscandoProduto ? 0.7 : 1
                }}
              >
                {buscandoProduto ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {produtoEncontrado && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: '13px', color: '#15803d' }}>
              <strong>{produtoEncontrado.nome}</strong> — {produtoEncontrado.codigo_interno}
              <br />
              <span style={{ fontSize: '12px' }}>
                {produtoEncontrado.quantidade_atual} unidade(s) disponível(is)
                {produtoEncontrado.localizacao_fisica && ` · ${produtoEncontrado.localizacao_fisica}`}
              </span>
            </div>
          )}

          <div className={styles.campo}>
            <label>Solicitante *</label>
            <select name="pessoa_id" value={form.pessoa_id} onChange={handleChange}>
              <option value="">Selecione uma pessoa</option>
              {pessoas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome_completo} {p.setor ? `— ${p.setor}` : ''}
                </option>
              ))}
            </select>
          </div>

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

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '12px', color: '#92400e' }}>
            O solicitante receberá um e-mail de lembrete no dia seguinte caso não devolva o item.
          </div>

          <div className={styles.acoes}>
            <button type="button" onClick={onFechar} className={styles.btnCancelar}>Cancelar</button>
            <button type="submit" disabled={carregando || !produtoEncontrado} className={styles.btnSalvar}>
              {carregando ? 'Registrando...' : 'Registrar Empréstimo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalEmprestimo