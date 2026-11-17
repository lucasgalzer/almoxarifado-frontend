import { useState, useEffect } from 'react'
import api from '../services/api'
import styles from './ModalHistorico.module.css'

function ModalHistorico({ produtoId, onFechar }) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aba, setAba] = useState('emprestimos')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true

    async function carregarHistorico() {
      setCarregando(true)
      setErro('')
      setDados(null)

      try {
        const { data } = await api.get(`/historico/produto/${produtoId}`)
        if (!ativo) return

        setDados({
          ...data,
          produto: data.produto || {},
          emprestimos: Array.isArray(data.emprestimos) ? data.emprestimos : [],
          movimentacoes: Array.isArray(data.movimentacoes) ? data.movimentacoes : [],
          manutencoes: Array.isArray(data.manutencoes) ? data.manutencoes : [],
          total_emprestimos: Number(data.total_emprestimos ?? data.emprestimos?.length ?? 0),
          total_movimentacoes: Number(data.total_movimentacoes ?? data.movimentacoes?.length ?? 0),
          total_manutencoes: Number(data.total_manutencoes ?? data.manutencoes?.length ?? 0)
        })
      } catch (error) {
        if (!ativo) return
        setErro(
          error.response?.data?.erro ||
          error.response?.data?.mensagem ||
          (error.response?.status === 404
            ? 'O histórico deste produto não foi encontrado.'
            : error.response?.status === 403
              ? 'Você não tem permissão para consultar este histórico ou seu setor não está configurado.'
              : 'Não foi possível carregar o histórico. Verifique a conexão e tente novamente.')
        )
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarHistorico()
    return () => { ativo = false }
  }, [produtoId, tentativa])

  function formatarData(data) {
    if (!data) return '—'
    const dataFormatada = new Date(data)
    return Number.isNaN(dataFormatada.getTime())
      ? '—'
      : dataFormatada.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  }

  function formatarStatus(status) {
    const mapa = {
      emprestado: 'Emprestado',
      devolvido: 'Devolvido',
      atrasado: 'Atrasado',
      perdido: 'Perdido',
      danificado: 'Danificado',
      aguardando: 'Aguardando',
      em_conserto: 'Em conserto',
      consertado: 'Consertado',
      descartado: 'Descartado'
    }
    return mapa[status] || status || '—'
  }

  function badgeEmprestimo(status) {
    const mapa = {
      emprestado: styles.badgeEmprestado,
      devolvido: styles.badgeDevolvido,
      atrasado: styles.badgePerdido,
      perdido: styles.badgePerdido,
      danificado: styles.badgeDanificado
    }
    return mapa[status] || ''
  }

  function badgeMovimentacao(tipo) {
    const mapa = {
      entrada: styles.badgeEntrada,
      saida: styles.badgeSaida,
      ajuste: styles.badgeAjuste,
      devolucao: styles.badgeDevolucao
    }
    return mapa[tipo] || ''
  }

  function labelMovimentacao(tipo) {
    const mapa = {
      entrada: 'Entrada',
      saida: 'Saída',
      ajuste: 'Ajuste',
      devolucao: 'Devolução'
    }
    return mapa[tipo] || tipo || 'Movimentação'
  }

  function badgeManutencao(status) {
    const mapa = {
      aguardando: styles.badgeAguardando,
      em_conserto: styles.badgeConserto,
      consertado: styles.badgeConsertado,
      descartado: styles.badgeDescartado
    }
    return mapa[status] || ''
  }

  function renderVazio(mensagem) {
    return <div className={styles.vazio}>{mensagem}</div>
  }

  return (
    <div className={styles.overlay} data-modal-open="true" onClick={onFechar}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-historico" onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <h2 id="titulo-historico">Histórico do produto</h2>
            {dados && (
              <p className={styles.nomeProduto}>
                {dados.produto.codigo_interno || 'Sem código'} — {dados.produto.nome || 'Produto'}
              </p>
            )}
          </div>
          <button type="button" className={styles.btnFechar} onClick={onFechar} aria-label="Fechar histórico">×</button>
        </header>

        {carregando ? (
          renderVazio('Carregando histórico...')
        ) : erro ? (
          <div className={styles.estadoErro}>
            <strong>Não foi possível abrir o histórico</strong>
            <p>{erro}</p>
            <button type="button" onClick={() => setTentativa(valor => valor + 1)}>Tentar novamente</button>
          </div>
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
                <span className={styles.resumoValor}>{dados.produto.quantidade_atual ?? 0}</span>
                <span className={styles.resumoLabel}>Qtd. atual</span>
              </div>
            </div>

            <nav className={styles.abas}>
              <button type="button" className={`${styles.aba} ${aba === 'emprestimos' ? styles.abaAtiva : ''}`} onClick={() => setAba('emprestimos')}>
                Empréstimos ({dados.total_emprestimos})
              </button>
              <button type="button" className={`${styles.aba} ${aba === 'movimentacoes' ? styles.abaAtiva : ''}`} onClick={() => setAba('movimentacoes')}>
                Movimentações ({dados.total_movimentacoes})
              </button>
              <button type="button" className={`${styles.aba} ${aba === 'manutencoes' ? styles.abaAtiva : ''}`} onClick={() => setAba('manutencoes')}>
                Manutenções ({dados.total_manutencoes})
              </button>
            </nav>

            <div className={styles.conteudo}>
              {aba === 'emprestimos' && (
                dados.emprestimos.length === 0 ? renderVazio('Nenhum empréstimo registrado para este produto.') :
                  dados.emprestimos.map(e => {
                    const status = e.item_status || e.status
                    return (
                      <article key={e.item_id || e.id} className={styles.card}>
                        <div className={styles.cardTopo}>
                          <span className={`${styles.badge} ${badgeEmprestimo(status)}`}>{formatarStatus(status)}</span>
                          <span className={styles.cardData}>{formatarData(e.data_retirada)}</span>
                        </div>
                        <div className={styles.cardInfo}>
                          <span><strong>Responsável:</strong> {e.pessoa_nome || 'Não informado'}{e.pessoa_setor ? ` — ${e.pessoa_setor}` : ''}</span>
                          {e.data_devolucao_prevista && <span><strong>Devolução prevista:</strong> {formatarData(e.data_devolucao_prevista)}</span>}
                          {e.data_devolucao_efetiva && <span><strong>Devolvido em:</strong> {formatarData(e.data_devolucao_efetiva)}</span>}
                          {e.operador_nome && <span><strong>Operador:</strong> {e.operador_nome}</span>}
                          {e.observacoes && <span><strong>Observações:</strong> {e.observacoes}</span>}
                        </div>
                      </article>
                    )
                  })
              )}

              {aba === 'movimentacoes' && (
                dados.movimentacoes.length === 0 ? renderVazio('Nenhuma movimentação de estoque registrada.') :
                  dados.movimentacoes.map(m => (
                    <article key={m.id} className={styles.card}>
                      <div className={styles.cardTopo}>
                        <span className={`${styles.badge} ${badgeMovimentacao(m.status)}`}>{labelMovimentacao(m.status)}</span>
                        <span className={styles.cardData}>{formatarData(m.data_retirada)}</span>
                      </div>
                      <div className={styles.cardInfo}>
                        <span><strong>Quantidade:</strong> {m.quantidade ?? '—'}</span>
                        {m.motivo && <span><strong>Motivo:</strong> {m.motivo}</span>}
                        {m.pessoa_nome && <span><strong>Pessoa:</strong> {m.pessoa_nome}</span>}
                        {m.operador_nome && <span><strong>Operador:</strong> {m.operador_nome}</span>}
                        {m.observacoes && <span><strong>Observações:</strong> {m.observacoes}</span>}
                      </div>
                    </article>
                  ))
              )}

              {aba === 'manutencoes' && (
                dados.manutencoes.length === 0 ? renderVazio('Nenhuma manutenção registrada para este produto.') :
                  dados.manutencoes.map(m => (
                    <article key={m.id} className={styles.card}>
                      <div className={styles.cardTopo}>
                        <span className={`${styles.badge} ${badgeManutencao(m.status)}`}>{formatarStatus(m.status)}</span>
                        <span className={styles.cardData}>{formatarData(m.data_retirada)}</span>
                      </div>
                      <div className={styles.cardInfo}>
                        {m.tipo_problema && <span><strong>Problema:</strong> {m.tipo_problema}</span>}
                        {m.descricao_defeito && <span><strong>Descrição:</strong> {m.descricao_defeito}</span>}
                        {m.fornecedor_tecnico && <span><strong>Técnico/fornecedor:</strong> {m.fornecedor_tecnico}</span>}
                        {m.custo_real !== null && m.custo_real !== undefined && <span><strong>Custo:</strong> {Number(m.custo_real).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>}
                        {m.data_encerramento && <span><strong>Encerrado em:</strong> {formatarData(m.data_encerramento)}</span>}
                        {m.operador_nome && <span><strong>Responsável:</strong> {m.operador_nome}</span>}
                        {m.observacoes && <span><strong>Observações:</strong> {m.observacoes}</span>}
                      </div>
                    </article>
                  ))
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default ModalHistorico
