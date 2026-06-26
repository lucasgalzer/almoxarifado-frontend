import { useState, useEffect } from 'react'
import api from '../services/api'
import styles from './ModalHistorico.module.css'

function ModalHistorico({ produtoId, onFechar }) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState('emprestimos')

  useEffect(() => {
    api.get(`/historico/produto/${produtoId}`)
      .then(({ data }) => setDados(data))
      .catch(console.error)
      .finally(() => setCarregando(false))
  }, [produtoId])

  function formatarData(data) {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  function badgeEmprestimo(status) {
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

  function badgeManutencao(status) {
    const mapa = {
      aguardando: styles.badgeAguardando,
      em_conserto: styles.badgeConserto,
      consertado: styles.badgeConsertado,
      descartado: styles.badgeDescartado,
    }
    return mapa[status] || ''
  }

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2>Histórico do Produto</h2>
            {dados && (
              <p className={styles.nomeProduto}>
                {dados.produto.codigo_interno} — {dados.produto.nome}
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
                <span className={styles.resumoValor}>{dados.total_movimentacoes}</span>
                <span className={styles.resumoLabel}>Movimentações</span>
              </div>
              <div className={styles.resumoItem}>
                <span className={styles.resumoValor}>{dados.total_manutencoes}</span>
                <span className={styles.resumoLabel}>Manutenções</span>
              </div>
              <div className={styles.resumoItem}>
                <span className={styles.resumoValor}>{dados.produto.quantidade_atual}</span>
                <span className={styles.resumoLabel}>Qtd. atual</span>
              </div>
            </div>

            <div className={styles.abas}>
              <button className={`${styles.aba} ${aba === 'emprestimos' ? styles.abaAtiva : ''}`} onClick={() => setAba('emprestimos')}>
                Empréstimos ({dados.total_emprestimos})
              </button>
              <button className={`${styles.aba} ${aba === 'movimentacoes' ? styles.abaAtiva : ''}`} onClick={() => setAba('movimentacoes')}>
                Movimentações ({dados.total_movimentacoes})
              </button>
              <button className={`${styles.aba} ${aba === 'manutencoes' ? styles.abaAtiva : ''}`} onClick={() => setAba('manutencoes')}>
                Manutenções ({dados.total_manutencoes})
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
                        <span className={`${styles.badge} ${badgeEmprestimo(e.status)}`}>
                          {e.status}
                        </span>
                        <span className={styles.cardData}>{formatarData(e.data_retirada)}</span>
                      </div>
                      <div className={styles.cardInfo}>
                        <span> {e.pessoa_nome} {e.pessoa_setor ? `— ${e.pessoa_setor}` : ''}</span>
                        {e.data_devolucao_prevista && <span> Previsto: {formatarData(e.data_devolucao_prevista)}</span>}
                        {e.data_devolucao_efetiva && <span> Devolvido: {formatarData(e.data_devolucao_efetiva)}</span>}
                        {e.operador_nome && <span> Operador: {e.operador_nome}</span>}
                        {e.observacoes && <span> {e.observacoes}</span>}
                      </div>
                    </div>
                  ))
                )
              )}

              {aba === 'movimentacoes' && (
                dados.movimentacoes.length === 0 ? (
                  <div className={styles.vazio}>Nenhuma movimentação registrada.</div>
                ) : (
                  dados.movimentacoes.map(m => (
                    <div key={m.id} className={styles.card}>
                      <div className={styles.cardTopo}>
                        <span className={`${styles.badge} ${badgeMovimentacao(m.status)}`}>
                          {labelMovimentacao(m.status)}
                        </span>
                        <span className={styles.cardData}>{formatarData(m.data_retirada)}</span>
                      </div>
                      <div className={styles.cardInfo}>
                        <span> Quantidade: <strong>{m.quantidade}</strong></span>
                        {m.motivo && <span> Motivo: {m.motivo}</span>}
                        {m.pessoa_nome && <span> Pessoa: {m.pessoa_nome}</span>}
                        {m.operador_nome && <span> Operador: {m.operador_nome}</span>}
                        {m.observacoes && <span> {m.observacoes}</span>}
                      </div>
                    </div>
                  ))
                )
              )}

              {aba === 'manutencoes' && (
                dados.manutencoes.length === 0 ? (
                  <div className={styles.vazio}>Nenhuma manutenção registrada.</div>
                ) : (
                  dados.manutencoes.map(m => (
                    <div key={m.id} className={styles.card}>
                      <div className={styles.cardTopo}>
                        <span className={`${styles.badge} ${badgeManutencao(m.status)}`}>
                          {m.status}
                        </span>
                        <span className={styles.cardData}>{formatarData(m.data_retirada)}</span>
                      </div>
                      <div className={styles.cardInfo}>
                        {m.tipo_problema && <span> {m.tipo_problema}</span>}
                        {m.descricao_defeito && <span> {m.descricao_defeito}</span>}
                        {m.fornecedor_tecnico && <span> {m.fornecedor_tecnico}</span>}
                        {m.custo_real && <span> Custo: R$ {m.custo_real}</span>}
                        {m.data_encerramento && <span> Encerrado: {formatarData(m.data_encerramento)}</span>}
                        {m.operador_nome && <span> Operador: {m.operador_nome}</span>}
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

export default ModalHistorico