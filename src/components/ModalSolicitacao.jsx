import { useState, useEffect } from 'react'
import api from '../services/api'
import styles from './ModalProduto.module.css'
import estilos from './ModalSolicitacao.module.css'

function ModalSolicitacao({ onFechar, onSalvar }) {
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [itens, setItens] = useState([{ produto_id: '', quantidade_solicitada: 1 }])
  const [form, setForm] = useState({
    finalidade: '',
    data_desejada: '',
    observacoes: '',
  })

  useEffect(() => {
    api.get('/produtos').then(({ data }) => setProdutos(data)).catch(console.error)
  }, [])

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleItemChange(index, field, value) {
    setItens(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  function adicionarItem() {
    setItens(prev => [...prev, { produto_id: '', quantidade_solicitada: 1 }])
  }

  function removerItem(index) {
    if (itens.length === 1) return
    setItens(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    const itensValidos = itens.filter(i => i.produto_id)
    if (itensValidos.length === 0) return setErro('Adicione pelo menos um produto')

    setCarregando(true)
    try {
      await api.post('/solicitacoes', { ...form, itens: itensValidos })
      onSalvar()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao criar solicitação')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Nova Solicitação</h2>
          <button className={styles.btnFechar} onClick={onFechar}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {erro && <div className={styles.erro}>{erro}</div>}

          <div className={styles.campo}>
            <label>Itens solicitados *</label>
            {itens.map((item, index) => (
              <div key={index} className={estilos.itemLinha}>
                <select
                  value={item.produto_id}
                  onChange={e => handleItemChange(index, 'produto_id', e.target.value)}
                  className={estilos.selectProduto}
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.codigo_interno} — {p.nome}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantidade_solicitada}
                  onChange={e => handleItemChange(index, 'quantidade_solicitada', parseInt(e.target.value))}
                  className={estilos.inputQtd}
                />
                <button
                  type="button"
                  onClick={() => removerItem(index)}
                  className={estilos.btnRemover}
                  disabled={itens.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={adicionarItem} className={estilos.btnAdicionarItem}>
              + Adicionar item
            </button>
          </div>

          <div className={styles.grid2}>
            <div className={styles.campo}>
              <label>Data desejada</label>
              <input
                type="datetime-local"
                name="data_desejada"
                value={form.data_desejada}
                onChange={handleFormChange}
              />
            </div>
            <div className={styles.campo}>
              <label>Finalidade</label>
              <input
                name="finalidade"
                value={form.finalidade}
                onChange={handleFormChange}
                placeholder="Ex: Aula de artes — turma 6A"
              />
            </div>
          </div>

          <div className={styles.campo}>
            <label>Observações</label>
            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={handleFormChange}
              rows={2}
              placeholder="Informações adicionais para o almoxarifado"
            />
          </div>

          <div className={styles.acoes}>
            <button type="button" onClick={onFechar} className={styles.btnCancelar}>Cancelar</button>
            <button type="submit" disabled={carregando} className={styles.btnSalvar}>
              {carregando ? 'Enviando...' : 'Enviar Solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalSolicitacao