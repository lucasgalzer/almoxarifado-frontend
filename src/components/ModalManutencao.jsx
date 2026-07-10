import { useState, useEffect } from 'react'
import api from '../services/api'
import styles from './ModalProduto.module.css'
import Select from 'react-select'
import reactSelectStyles from '../utils/reactSelectStyles'

const TIPOS = [
  'Defeito mecânico', 'Defeito elétrico', 'Desgaste natural',
  'Dano por mau uso', 'Dano por queda', 'Outros'
]

const opcoesProblemas = TIPOS.map(t => ({ value: t, label: t }))

function ModalManutencao({ onFechar, onSalvar }) {
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    produto_id: '',
    tipo_problema: '',
    descricao_defeito: '',
    fornecedor_tecnico: '',
    data_previsao_retorno: '',
    custo_estimado: '',
    observacoes: '',
  })

  const opcoesProdutosM = produtos.map(p => ({
    value: p.id,
    label: `${p.nome}${p.codigo_interno ? ` (${p.codigo_interno})` : ''}`,
  }))


  useEffect(() => {
    api.get('/produtos', { params: { tipo: 'reutilizavel' } })
      .then(({ data }) => setProdutos(data.dados || []))
      .catch(console.error)
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }




  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (!form.produto_id) return setErro('Selecione um produto')
    if (!form.tipo_problema) return setErro('Informe o tipo do problema')

    setCarregando(true)
    try {
      await api.post('/manutencoes', form)
      onSalvar()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao abrir ocorrência')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={styles.overlay} data-modal-open="true" onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Nova Ocorrência de Manutenção</h2>
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
              options={opcoesProdutosM}
              value={opcoesProdutosM.find(op => op.value === form.produto_id) || null}
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
              <label>Tipo do problema *</label>
              <Select
                className={styles.reactSelect}
                classNamePrefix="react-select"
                styles={reactSelectStyles}
                placeholder="Selecione o tipo do problema"
                options={opcoesProblemas}
                value={opcoesProblemas.find(op => op.value === form.tipo_problema) || null}
                onChange={(opcao) =>
                  handleChange({
                    target: {
                      name: 'tipo_problema',
                      value: opcao?.value || '',
                    },
                  })
                }
              />
            </div>
            <div className={styles.campo}>
              <label>Fornecedor / Técnico</label>
              <input name="fornecedor_tecnico" value={form.fornecedor_tecnico} onChange={handleChange} placeholder="Nome da empresa ou técnico" />
            </div>
          </div>

          <div className={styles.campo}>
            <label>Descrição do defeito</label>
            <textarea name="descricao_defeito" value={form.descricao_defeito} onChange={handleChange} rows={2} placeholder="Descreva o problema encontrado" />
          </div>

          <div className={styles.grid2}>
            <div className={styles.campo}>
              <label>Previsão de retorno</label>
              <input type="date" name="data_previsao_retorno" value={form.data_previsao_retorno} onChange={handleChange} />
            </div>
            <div className={styles.campo}>
              <label>Custo estimado (R$)</label>
              <input type="number" name="custo_estimado" value={form.custo_estimado} onChange={handleChange} placeholder="0.00" step="0.01" min="0" />
            </div>
          </div>

          <div className={styles.campo}>
            <label>Observações</label>
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={2} placeholder="Informações adicionais" />
          </div>

          <div className={styles.acoes}>
            <button type="button" onClick={onFechar} className={styles.btnCancelar}>Cancelar</button>
            <button type="submit" disabled={carregando} className={styles.btnSalvar}>
              {carregando ? 'Abrindo...' : 'Abrir Ocorrência'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalManutencao