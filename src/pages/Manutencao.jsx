import { useState, useEffect } from 'react'
import api from '../services/api'
import ModalManutencao from '../components/ModalManutencao'
import ModalAtualizarManutencao from '../components/ModalAtualizarManutencao'
import styles from './Manutencao.module.css'

function Manutencao() {
  const [manutencoes, setManutencoes] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [manutencaoSelecionada, setManutencaoSelecionada] = useState(null)

  useEffect(() => {
    carregarManutencoes()
  }, [filtroStatus])

  async function carregarManutencoes() {
    try {
      setCarregando(true)
      const params = {}
      if (filtroStatus) params.status = filtroStatus
      const { data } = await api.get('/manutencoes', { params })
      setManutencoes(data)
    } catch (error) {
      console.error(error)
    } finally {
      setCarregando(false)
    }
  }

  function formatarData(data) {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  function badgeStatus(status) {
    const mapa = {
      aguardando: styles.badgeAguardando,
      em_conserto: styles.badgeConserto,
      consertado: styles.badgeConsertado,
      descartado: styles.badgeDescartado,
    }
    return mapa[status] || ''
  }

  function labelStatus(status) {
    const mapa = {
      aguardando: 'Aguardando',
      em_conserto: 'Em conserto',
      consertado: 'Consertado',
      descartado: 'Descartado',
    }
    return mapa[status] || status
  }

  const emAberto = manutencoes.filter(m => ['aguardando', 'em_conserto'].includes(m.status)).length

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Manutenção</h1>
          <p className={styles.subtitulo}>{manutencoes.length} ocorrência(s) encontrada(s)</p>
        </div>
        <button className={styles.btnNovo} onClick={() => setModalAberto(true)}>
          + Nova Ocorrência
        </button>
      </div>

      {emAberto > 0 && (
        <div className={styles.alerta}>
          🔧 {emAberto} item(ns) em manutenção — bloqueados para empréstimo
        </div>
      )}

      <div className={styles.filtros}>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className={styles.select}>
          <option value="">Todos os status</option>
          <option value="aguardando">Aguardando</option>
          <option value="em_conserto">Em conserto</option>
          <option value="consertado">Consertados</option>
          <option value="descartado">Descartados</option>
        </select>
      </div>

      <div className={styles.tabela}>
        {carregando ? (
          <div className={styles.vazio}>Carregando...</div>
        ) : manutencoes.length === 0 ? (
          <div className={styles.vazio}>Nenhuma ocorrência encontrada.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Problema</th>
                <th>Fornecedor</th>
                <th>Abertura</th>
                <th>Previsão retorno</th>
                <th>Custo est.</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {manutencoes.map(m => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.produto_nome}</strong>
                    <br />
                    <small style={{ color: '#888' }}>{m.codigo_interno}</small>
                  </td>
                  <td>{m.tipo_problema}</td>
                  <td>{m.fornecedor_tecnico || '—'}</td>
                  <td>{formatarData(m.data_abertura)}</td>
                  <td>{formatarData(m.data_previsao_retorno)}</td>
                  <td>{m.custo_estimado ? `R$ ${parseFloat(m.custo_estimado).toFixed(2)}` : '—'}</td>
                  <td>
                    <span className={`${styles.badge} ${badgeStatus(m.status)}`}>
                      {labelStatus(m.status)}
                    </span>
                  </td>
                  <td>
                    {!['consertado', 'descartado'].includes(m.status) && (
                      <button
                        className={styles.btnAtualizar}
                        onClick={() => setManutencaoSelecionada(m)}
                      >
                        Atualizar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <ModalManutencao
          onFechar={() => setModalAberto(false)}
          onSalvar={() => { setModalAberto(false); carregarManutencoes() }}
        />
      )}

      {manutencaoSelecionada && (
        <ModalAtualizarManutencao
          manutencao={manutencaoSelecionada}
          onFechar={() => setManutencaoSelecionada(null)}
          onSalvar={() => { setManutencaoSelecionada(null); carregarManutencoes() }}
        />
      )}
    </div>
  )
}

export default Manutencao