import { useState } from 'react'
import api from '../services/api'
import styles from './ModalDevolucao.module.css'
import estilos from './ModalDetalhesSolicitacao.module.css'

const STATUS_OPCOES = [
  { value: 'em_conserto', label: '🔧 Enviar para conserto' },
  { value: 'consertado', label: '✅ Marcar como consertado' },
  { value: 'descartado', label: '🗑 Descartar item' },
]

function ModalAtualizarManutencao({ manutencao, onFechar, onSalvar }) {
  const [form, setForm] = useState({
    status: '',
    fornecedor_tecnico: manutencao.fornecedor_tecnico || '',
    data_previsao_retorno: '',
    custo_real: '',
    observacoes: '',
  })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (!form.status) return setErro('Selecione o novo status')

    setCarregando(true)
    try {
      await api.patch(`/manutencoes/${manutencao.id}/status`, form)
      onSalvar()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao atualizar')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={estilos.modal} onClick={e => e.stopPropagation()}>
        <div className={estilos.header}>
          <h2>Atualizar Manutenção</h2>
          <button className={estilos.btnFechar} onClick={onFechar}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={estilos.corpo}>
          <div className={estilos.infoBox}>
            <div className={estilos.infoLinha}>
              <span>Produto</span>
              <strong>{manutencao.produto_nome}</strong>
            </div>
            <div className={estilos.infoLinha}>
              <span>Problema</span>
              <strong>{manutencao.tipo_problema}</strong>
            </div>
            <div className={estilos.infoLinha}>
              <span>Status atual</span>
              <strong>{manutencao.status}</strong>
            </div>
          </div>

          <div className={estilos.secao}>
            <h3>Novo status *</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {STATUS_OPCOES.filter(s => {
                if (manutencao.status === 'aguardando') return true
                if (manutencao.status === 'em_conserto') return ['consertado', 'descartado'].includes(s.value)
                return false
              }).map(op => (
                <button
                  key={op.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, status: op.value }))}
                  style={{
                    padding: '10px 14px',
                    border: `2px solid ${form.status === op.value ? '#1a237e' : '#e0e0e0'}`,
                    borderRadius: '8px',
                    background: form.status === op.value ? '#e8eaf6' : 'white',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: form.status === op.value ? '#1a237e' : '#444',
                    fontWeight: form.status === op.value ? '600' : '400',
                  }}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          <div className={estilos.secao}>
            <h3>Informações adicionais</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '4px' }}>
                  Fornecedor / Técnico
                </label>
                <input
                  name="fornecedor_tecnico"
                  value={form.fornecedor_tecnico}
                  onChange={handleChange}
                  placeholder="Nome da empresa ou técnico"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {form.status === 'consertado' && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '4px' }}>
                    Custo real (R$)
                  </label>
                  <input
                    type="number"
                    name="custo_real"
                    value={form.custo_real}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '4px' }}>
                  Observações
                </label>
                <textarea
                  name="observacoes"
                  value={form.observacoes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Informações adicionais"
                  className={estilos.textarea}
                />
              </div>
            </div>
          </div>

          {erro && <div className={estilos.erro}>{erro}</div>}

          <div className={estilos.acoes}>
            <button type="button" onClick={onFechar} style={{ flex: 1, padding: '11px', background: '#f0f0f0', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={carregando} style={{ flex: 1, padding: '11px', background: '#1a237e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: carregando ? 0.7 : 1 }}>
              {carregando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalAtualizarManutencao