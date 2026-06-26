import { useState, useEffect } from 'react'
import api from '../services/api'
import styles from './ModalHistorico.module.css'

function ModalHistoricoPessoa({ pessoaId, onFechar }) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState('emprestimos')

  useEffect(() => {
    api.get(`/historico/pessoa/${pessoaId}`)
      .then(({ data }) => setDados(data))
      .catch(console.error)
      .finally(() => setCarregando(false))
  }, [pessoaId])

  function formatarData(data) {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  function badgeStatus(status) {
    const mapa = {
      emprestado: styles.badgeEmprestado,
      devolvido: styles.badgeDevolvido,
      perdido: styles.badgePerdido,
      danificado: styles.badgeDanificado,
    }
    return mapa[status] || ''
  }

  function badgeMovimentacao(tipo) {
    const mapa = {
      entrada: styles.badgeEntrada,
      saida: styles.badgeSaida,
      ajuste: styles.badgeAjuste,
      devolucao: styles.badgeDevolucao,
    }
    return mapa[tipo] || ''
  }

  function labelMovimentacao(tipo) {
    const mapa = {
      entrada: '⬆ Entrada',
      saida: '⬇ Saída',
      ajuste: '⚙ Ajuste',
      devolucao: '↩ Devolução',
    }
    return mapa[tipo] || tipo
  }

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2>Histórico da Pessoa</h2>
            {dados && (
              <p className={styles.nomeProduto}>
                {dados.pessoa.nome_completo}
                {dados.pessoa.setor ? ` — ${dados.pessoa.setor}` : ''}
              </p>
            )}
          </div>
          <button className={styles.btnFechar} onClick={onFechar}>✕</button>
        </div>

        {carregando ? (
          <div className={styles.vazio}>Carregando...</div>
        ) : dados && (
          <>
            <div className={styles.resumo}>
              <div className={styles.resumoItem}>
                <span className={styles.resumoValor}>{dados.total_emprestimos}</span>
                <span className={styles.resumoLabel}>Empréstimos</span>
              </div>
              <div className={styles.resumoItem}>
                <span className={styles.resumoValor}>{dados.pendentes}</span>
                <span className={styles.resumoLabel}>Em aberto</span>
              </div>
              <div className={styles.resumoItem}>
                <span className={styles.resumoValor}>{dados.total_emprestimos - dados.pendentes}</span>
                <span className={styles.resumoLabel}>Devolvidos</span>
              </div>
              <div className={styles.resumoItem}>
                <span className={styles.resumoValor} style={{ color: dados.pendentes > 0 ? '#e65100' : '#2e7d32' }}>
                  {dados.pendentes > 0 ? '⚠️' : '✅'}
                </span>
                <span className={styles.resumoLabel}>Status</span>
              </div>
            </div>

            <div className={styles.abas}>
              <button className={`${styles.aba} ${aba === 'emprestimos' ? styles.abaAtiva : ''}`} onClick={() => setAba('emprestimos')}>
                Empréstimos ({dados.total_emprestimos})
              </button>
              <button className={`${styles.aba} ${aba === 'movimentacoes' ? styles.abaAtiva : ''}`} onClick={() => setAba('movimentacoes')}>
                Consumos ({dados.movimentacoes.length})
              </button>
            </div>

            <div className={styles.conteudo}>
              {aba === 'emprestimos' && (
                dados.emprestimos.length === 0 ? (
                  <div className={styles.vazio}>Nenhum empréstimo registrado.</div>
                ) : (
                  dados.emprestimos.map(e => (
                    <div key={e.id} className={styles.card}>
                      <div className={styles.cardTopo}>
                        <span className={`${styles.badge} ${badgeStatus(e.status)}`}>
                          {e.status}
                        </span>
                        <span className={styles.cardData}>{formatarData(e.data_retirada)}</span>
                      </div>
                      <div className={styles.cardInfo}>
                        <span>📦 {e.produto_nome} — {e.codigo_interno}</span>
                        {e.data_devolucao_prevista && <span>📅 Previsto: {formatarData(e.data_devolucao_prevista)}</span>}
                        {e.data_devolucao_efetiva && <span>✅ Devolvido: {formatarData(e.data_devolucao_efetiva)}</span>}
                        {e.observacoes && <span>📝 {e.observacoes}</span>}
                      </div>
                    </div>
                  ))
                )
              )}

              {aba === 'movimentacoes' && (
                dados.movimentacoes.length === 0 ? (
                  <div className={styles.vazio}>Nenhum consumo registrado.</div>
                ) : (
                  dados.movimentacoes.map(m => (
                    <div key={m.id} className={styles.card}>
                      <div className={styles.cardTopo}>
                        <span className={`${styles.badge} ${badgeMovimentacao(m.tipo)}`}>
                          {labelMovimentacao(m.tipo)}
                        </span>
                        <span className={styles.cardData}>{formatarData(m.created_at)}</span>
                      </div>
                      <div className={styles.cardInfo}>
                        <span>📦 {m.produto_nome} — {m.codigo_interno}</span>
                        <span>🔢 Quantidade: <strong>{m.quantidade}</strong></span>
                        {m.motivo && <span>📋 {m.motivo}</span>}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ModalHistoricoPessoa