import { useState } from 'react'
import api from '../services/api'
import styles from './ModalDevolucao.module.css'

const STATUS_OPCOES = [
  { value: 'devolvido', label: '✅ Devolvido em bom estado' },
  { value: 'danificado', label: '⚠️ Devolvido com dano' },
  { value: 'perdido', label: '❌ Perdido / Não devolvido' },
]

function ModalDevolucao({ emprestimo, onFechar, onSalvar }) {
  const [status, setStatus] = useState('devolvido')
  const [observacoes, setObservacoes] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleConfirmar() {
    setErro('')
    setCarregando(true)
    try {
      await api.patch(`/emprestimos/${emprestimo.id}/devolver`, {
        status,
        observacoes
      })
      onSalvar()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao registrar devolução')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <div className={styles.icone}>↩</div>

        <h2 className={styles.titulo}>Confirmar Devolução</h2>

        <div className={styles.infoBox}>
          <div className={styles.infoLinha}>
            <span className={styles.infoLabel}>Produto</span>
            <span className={styles.infoValor}>{emprestimo.produto_nome}</span>
          </div>
          <div className={styles.infoLinha}>
            <span className={styles.infoLabel}>Código</span>
            <span className={styles.infoValor}>{emprestimo.codigo_interno}</span>
          </div>
          <div className={styles.infoLinha}>
            <span className={styles.infoLabel}>Pessoa</span>
            <span className={styles.infoValor}>{emprestimo.pessoa_nome}</span>
          </div>
          {emprestimo.data_devolucao_prevista && (
            <div className={styles.infoLinha}>
              <span className={styles.infoLabel}>Previsto para</span>
              <span className={`${styles.infoValor} ${emprestimo.atrasado ? styles.atrasado : ''}`}>
                {new Date(emprestimo.data_devolucao_prevista).toLocaleDateString('pt-BR')}
                {emprestimo.atrasado && ' — Atrasado'}
              </span>
            </div>
          )}
        </div>

        <div className={styles.campo}>
          <label className={styles.label}>Condição de devolução</label>
          <div className={styles.opcoes}>
            {STATUS_OPCOES.map(op => (
              <button
                key={op.value}
                type="button"
                className={`${styles.opcao} ${status === op.value ? styles.opcaoAtiva : ''}`}
                onClick={() => setStatus(op.value)}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.campo}>
          <label className={styles.label}>Observações</label>
          <textarea
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            rows={2}
            placeholder="Ex: Item devolvido com arranhão na lateral"
            className={styles.textarea}
          />
        </div>

        {erro && <div className={styles.erro}>{erro}</div>}

        <div className={styles.acoes}>
          <button onClick={onFechar} className={styles.btnCancelar}>Cancelar</button>
          <button
            onClick={handleConfirmar}
            disabled={carregando}
            className={`${styles.btnConfirmar} ${status === 'perdido' ? styles.btnPerigo : status === 'danificado' ? styles.btnAlerta : ''}`}
          >
            {carregando ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalDevolucao