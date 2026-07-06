import { useState, useEffect } from 'react'
import api from '../services/api'
import styles from './ModalProduto.module.css'
import Select from 'react-select'
import reactSelectStyles from '../utils/reactSelectStyles'

const opcoesEstoque = [
  { value: 'entrada', label: 'Entrada (aumenta estoque)' },
  { value: 'saida', label: 'Saída (diminui estoque)' },
  { value: 'ajuste', label: 'Ajuste (define quantidade exata)' },
  { value: 'devolucao', label: 'Devolução ao estoque' },
]

function ModalMovimentacao({ produtos, onFechar, onSalvar }) {
  const [pessoas, setPessoas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    produto_id: '',
    tipo: 'entrada',
    quantidade: 1,
    motivo: '',
    observacoes: '',
    pessoa_id: '',
  })

  const opcoesPessoas = pessoas.map(p => ({
    value: p.id,
    label: `${p.nome_completo}${p.setor ? ` — ${p.setor}` : ''}`,
  }))

  const opcoesProdutos = produtos.map(p => ({
    value: p.id,
    label: `${p.nome}${p.codigo_interno ? ` (${p.codigo_interno})` : ''}`,
  }))

  

function handleChange(e) {
  const { name, value } = e.target

  setForm(prev => ({
    ...prev,
    [name]: value,
  }))
}

  useEffect(() => {
    api.get('/pessoas').then(({ data }) => setPessoas(data)).catch(console.error)
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }
  

  const produtoSelecionado = produtos.find(p => p.id === form.produto_id)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!form.produto_id) return setErro('Selecione um produto')
    if (!form.quantidade || form.quantidade <= 0) return setErro('Quantidade deve ser maior que zero')

    setCarregando(true)
    try {
      await api.post('/estoque/movimentacoes', form)
      onSalvar()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao registrar movimentação')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Nova Movimentação</h2>
          <button className={styles.btnFechar} onClick={onFechar}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {erro && <div className={styles.erro}>{erro}</div>}

          <div className={styles.campo}>
            <label>Produto *</label>
            <Select
              className={styles.reactSelect}
              classNamePrefix="react-select"
              styles={reactSelectStyles}
              placeholder="Selecione um Produto"
              options={opcoesProdutos}
              value={opcoesProdutos.find(op => op.value === form.produto_id) || null}
              onChange={(opcao) =>
                handleChange({
                  target: {
                    name: 'produto_id',
                    value: opcao?.value || '',
                  },
                })
              }
            />
          </div>

          <div className={styles.grid2}>
            <div className={styles.campo}>
              <label>Tipo *</label>
              <Select
                className={styles.reactSelect}
                classNamePrefix="react-select"
                styles={reactSelectStyles}
                placeholder="Selecione uma categoria"
                options={opcoesEstoque}
                value={opcoesEstoque.find(op => op.value === form.tipo) || null}
                onChange={(opcao) =>
                  handleChange({
                    target: {
                      name: 'tipo',
                      value: opcao?.value || '',
                    },
                  })
                }
              />
            </div>
            <div className={styles.campo}>
              <label>
                {form.tipo === 'ajuste' ? 'Nova quantidade' : 'Quantidade'} *
              </label>
              <input
                type="number"
                name="quantidade"
                value={form.quantidade}
                onChange={handleChange}
                min="1"
              />
            </div>
          </div>

          {produtoSelecionado && (
            <div style={{ background: '#f5f7fa', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#555' }}>
              Estoque atual: <strong>{produtoSelecionado.quantidade_atual} {produtoSelecionado.unidade_medida}</strong>
              {form.tipo === 'entrada' && ` → ${produtoSelecionado.quantidade_atual + parseInt(form.quantidade || 0)}`}
              {form.tipo === 'saida' && ` → ${produtoSelecionado.quantidade_atual - parseInt(form.quantidade || 0)}`}
              {form.tipo === 'ajuste' && ` → ${form.quantidade}`}
              {form.tipo === 'devolucao' && ` → ${produtoSelecionado.quantidade_atual + parseInt(form.quantidade || 0)}`}
            </div>
          )}

          <div className={styles.campo}>
            <label>Pessoa (opcional)</label>
            <Select
              className={styles.reactSelect}
              classNamePrefix="react-select"
              styles={reactSelectStyles}
              placeholder="Selecione uma pessoa"
              options={opcoesPessoas}
              value={opcoesPessoas.find(op => op.value === form.pessoa_id) || null}
              onChange={(opcao) =>
                handleChange({
                  target: {
                    name: 'pessoa_id',
                    value: opcao?.value || '',
                  },
                })
              }
              isClearable
            />
          </div>

          <div className={styles.campo}>
            <label>Motivo</label>
            <input name="motivo" value={form.motivo} onChange={handleChange} placeholder="Ex: Compra, doação, ajuste de inventário" />
          </div>

          <div className={styles.campo}>
            <label>Observações</label>
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={2} placeholder="Observações adicionais" />
          </div>

          <div className={styles.acoes}>
            <button type="button" onClick={onFechar} className={styles.btnCancelar}>Cancelar</button>
            <button type="submit" disabled={carregando} className={styles.btnSalvar}>
              {carregando ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalMovimentacao