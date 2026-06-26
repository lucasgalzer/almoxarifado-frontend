import { useState, useEffect } from 'react'
import api from '../services/api'
import ModalMovimentacao from '../components/ModalMovimentacao'
import styles from './Estoque.module.css'

function Estoque() {
  const [produtos, setProdutos] = useState([])
  const [movimentacoes, setMovimentacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [aba, setAba] = useState('saldo')
  const [total, setTotal] = useState(0)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      setCarregando(true)
      const [{ data: prods }, { data: movs }] = await Promise.all([
        api.get('/produtos', { params: { por_pagina: 'todos' } }),
        api.get('/estoque/movimentacoes')
      ])
      setProdutos(prods.dados)
      setTotal(prods.total)
      setMovimentacoes(movs)
    } catch (error) {
      console.error(error)
    } finally {
      setCarregando(false)
    }
  }

  function badgeEstoque(produto) {
    if (produto.quantidade_atual === 0 && produto.tipo === 'reutilizavel') return styles.badgeEmprestado
    if (produto.quantidade_atual === 0) return styles.badgeZerado
    if (produto.quantidade_atual <= produto.quantidade_minima) return styles.badgeBaixo
    return styles.badgeOk
  }

  function labelEstoque(produto) {
    if (produto.quantidade_atual === 0 && produto.tipo === 'reutilizavel') return 'Emprestado'
    if (produto.quantidade_atual === 0) return 'Zerado'
    if (produto.quantidade_atual <= produto.quantidade_minima) return 'Estoque baixo'
    return 'Normal'
  }

  function labelTipo(tipo) {
    const mapa = {
      entrada: 'Entrada',
      saida: 'Saída',
      ajuste: 'Ajuste',
      devolucao: 'Devolução',
    }
    return mapa[tipo] || tipo
  }

  function classeTipo(tipo) {
    const mapa = {
      entrada: styles.tipoEntrada,
      saida: styles.tipoSaida,
      ajuste: styles.tipoAjuste,
      devolucao: styles.tipoDevolucao,
    }
    return mapa[tipo] || ''
  }

  function formatarData(data) {
    return new Date(data).toLocaleString('pt-BR')
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Estoque</h1>
          <p className={styles.subtitulo}>{total} produto(s) cadastrado(s)</p>
        </div>
        <button className={styles.btnNovo} onClick={() => setModalAberto(true)}>
          + Nova Movimentação
        </button>
      </div>

      <div className={styles.abas}>
        <button
          className={`${styles.aba} ${aba === 'saldo' ? styles.abaAtiva : ''}`}
          onClick={() => setAba('saldo')}
        >
          Saldo Atual
        </button>
        <button
          className={`${styles.aba} ${aba === 'movimentacoes' ? styles.abaAtiva : ''}`}
          onClick={() => setAba('movimentacoes')}
        >
          Movimentações
        </button>
      </div>

      {aba === 'saldo' && (
        <div className={styles.tabela}>
          {carregando ? (
            <div className={styles.vazio}>Carregando...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Qtd. Atual</th>
                  <th>Qtd. Mínima</th>
                  <th>Localização</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(produto => (
                  <tr key={produto.id}>
                    <td>{produto.codigo_interno}</td>
                    <td>{produto.nome}</td>
                    <td>{produto.tipo === 'consumivel' ? 'Consumível' : 'Reutilizável'}</td>
                    <td><strong>{produto.quantidade_atual}</strong> {produto.unidade_medida}</td>
                    <td>{produto.quantidade_minima} {produto.unidade_medida}</td>
                    <td>{produto.localizacao_fisica || '—'}</td>
                    <td>
                      <span className={`${styles.badge} ${badgeEstoque(produto)}`}>
                        {labelEstoque(produto)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {aba === 'movimentacoes' && (
        <div className={styles.tabela}>
          {carregando ? (
            <div className={styles.vazio}>Carregando...</div>
          ) : movimentacoes.length === 0 ? (
            <div className={styles.vazio}>Nenhuma movimentação registrada.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Motivo</th>
                  <th>Pessoa</th>
                  <th>Operador</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map(mov => (
                  <tr key={mov.id}>
                    <td>{formatarData(mov.created_at)}</td>
                    <td>{mov.produto_nome}</td>
                    <td>
                      <span className={`${styles.badge} ${classeTipo(mov.tipo)}`}>
                        {labelTipo(mov.tipo)}
                      </span>
                    </td>
                    <td><strong>{mov.quantidade}</strong></td>
                    <td>{mov.motivo || '—'}</td>
                    <td>{mov.pessoa_nome || '—'}</td>
                    <td>{mov.usuario_nome || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modalAberto && (
        <ModalMovimentacao
          produtos={produtos}
          onFechar={() => setModalAberto(false)}
          onSalvar={() => { setModalAberto(false); carregarDados() }}
        />
      )}
    </div>
  )
}

export default Estoque