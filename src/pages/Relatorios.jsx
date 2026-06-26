import { useState } from 'react'
import api from '../services/api'
import styles from './Relatorios.module.css'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const ABAS = [
  { id: 'estoque', label: 'Estoque atual' },
  { id: 'movimentacoes', label: 'Movimentações' },
  { id: 'emprestimos', label: 'Empréstimos' },
  { id: 'manutencoes', label: 'Manutenções' },
  { id: 'consumo', label: 'Consumo' },
]

function Relatorios() {
  const [aba, setAba] = useState('estoque')
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: '',
    tipo: '',
    status: '',
  })

  function handleFiltro(e) {
    const { name, value } = e.target
    setFiltros(prev => ({ ...prev, [name]: value }))
  }

  async function gerarRelatorio() {
    setCarregando(true)
    setDados(null)
    try {
      const params = {}
      if (filtros.data_inicio) params.data_inicio = filtros.data_inicio
      if (filtros.data_fim) params.data_fim = filtros.data_fim
      if (filtros.tipo) params.tipo = filtros.tipo
      if (filtros.status) params.status = filtros.status

      const { data } = await api.get(`/relatorios/${aba}`, { params })
      setDados(data)
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

  function exportarCSV() {
    if (!dados) return
    let linhas = []
    let nome = aba

    if (aba === 'estoque') {
      linhas = [
        ['Código', 'Nome', 'Tipo', 'Categoria', 'Qtd. Atual', 'Qtd. Mínima', 'Unidade', 'Localização', 'Status'],
        ...dados.produtos.map(p => [p.codigo_interno, p.nome, p.tipo, p.categoria_nome || '', p.quantidade_atual, p.quantidade_minima, p.unidade_medida, p.localizacao_fisica || '', p.status])
      ]
    } else if (aba === 'movimentacoes') {
      linhas = [
        ['Data', 'Produto', 'Código', 'Tipo', 'Quantidade', 'Motivo', 'Pessoa', 'Setor', 'Operador'],
        ...dados.movimentacoes.map(m => [formatarData(m.data), m.produto_nome, m.codigo_interno, m.tipo, m.quantidade, m.motivo || '', m.pessoa_nome || '', m.pessoa_setor || '', m.operador_nome || ''])
      ]
    } else if (aba === 'emprestimos') {
      linhas = [
        ['Produto', 'Código', 'Pessoa', 'Setor', 'Retirada', 'Prev. Devolução', 'Devolvido em', 'Status', 'Atrasado'],
        ...dados.emprestimos.map(e => [e.produto_nome, e.codigo_interno, e.pessoa_nome, e.pessoa_setor || '', formatarData(e.data_retirada), formatarData(e.data_devolucao_prevista), formatarData(e.data_devolucao_efetiva), e.status, e.atrasado ? 'Sim' : 'Não'])
      ]
    } else if (aba === 'manutencoes') {
      linhas = [
        ['Produto', 'Código', 'Problema', 'Fornecedor', 'Abertura', 'Encerramento', 'Custo Est.', 'Custo Real', 'Status'],
        ...dados.manutencoes.map(m => [m.produto_nome, m.codigo_interno, m.tipo_problema, m.fornecedor_tecnico || '', formatarData(m.data_abertura), formatarData(m.data_encerramento), m.custo_estimado || '', m.custo_real || '', m.status])
      ]
    } else if (aba === 'consumo') {
      linhas = [
        ['Código', 'Produto', 'Tipo', 'Setor', 'Total Consumido', 'Unidade', 'Total Retiradas'],
        ...dados.consumo.map(c => [c.codigo_interno, c.produto_nome, c.produto_tipo, c.setor || '', c.total_consumido, c.unidade_medida, c.total_retiradas])
      ]
    }

    const csv = linhas.map(l => l.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nome}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportarPDF() {
  if (!dados) return

  const doc = new jsPDF()
  const data = new Date().toLocaleDateString('pt-BR')

  const titulos = {
    estoque: 'Relatório de Estoque Atual',
    movimentacoes: 'Relatório de Movimentações',
    emprestimos: 'Relatório de Empréstimos',
    manutencoes: 'Relatório de Manutenções',
    consumo: 'Relatório de Consumo',
  }

  doc.setFontSize(16)
  doc.setTextColor(26, 35, 126)
  doc.text(titulos[aba], 14, 18)

  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Gerado em ${data}`, 14, 26)

  const resumoTexto = Object.entries(dados.resumo)
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
    .join('   |   ')
  doc.text(resumoTexto, 14, 33)

  let head = []
  let body = []

  if (aba === 'estoque') {
    head = [['Código', 'Nome', 'Tipo', 'Qtd. Atual', 'Qtd. Mínima', 'Localização', 'Status']]
    body = dados.produtos.map(p => [p.codigo_interno, p.nome, p.tipo, `${p.quantidade_atual} ${p.unidade_medida}`, `${p.quantidade_minima} ${p.unidade_medida}`, p.localizacao_fisica || '—', p.status])
  } else if (aba === 'movimentacoes') {
    head = [['Data', 'Produto', 'Tipo', 'Quantidade', 'Motivo', 'Pessoa', 'Operador']]
    body = dados.movimentacoes.map(m => [formatarData(m.data), m.produto_nome, m.tipo, m.quantidade, m.motivo || '—', m.pessoa_nome || '—', m.operador_nome || '—'])
  } else if (aba === 'emprestimos') {
    head = [['Produto', 'Pessoa', 'Setor', 'Retirada', 'Prev. Devolução', 'Status']]
    body = dados.emprestimos.map(e => [e.produto_nome, e.pessoa_nome, e.pessoa_setor || '—', formatarData(e.data_retirada), formatarData(e.data_devolucao_prevista), e.atrasado ? 'Atrasado' : e.status])
  } else if (aba === 'manutencoes') {
    head = [['Produto', 'Problema', 'Fornecedor', 'Abertura', 'Custo Est.', 'Custo Real', 'Status']]
    body = dados.manutencoes.map(m => [m.produto_nome, m.tipo_problema, m.fornecedor_tecnico || '—', formatarData(m.data_abertura), m.custo_estimado ? `R$ ${parseFloat(m.custo_estimado).toFixed(2)}` : '—', m.custo_real ? `R$ ${parseFloat(m.custo_real).toFixed(2)}` : '—', m.status])
  } else if (aba === 'consumo') {
    head = [['Código', 'Produto', 'Tipo', 'Setor', 'Total Consumido', 'Total Retiradas']]
    body = dados.consumo.map(c => [c.codigo_interno, c.produto_nome, c.produto_tipo, c.setor || '—', `${c.total_consumido} ${c.unidade_medida}`, c.total_retiradas])
  }

  autoTable(doc, {
    head,
    body,
    startY: 40,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [26, 35, 126], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 244, 255] },
    didParseCell: (data) => {
      if (aba === 'emprestimos' && data.row.raw && data.row.raw[5] === 'Atrasado') {
        data.cell.styles.textColor = [230, 81, 0]
        data.cell.styles.fontStyle = 'bold'
      }
      if (aba === 'estoque' && data.section === 'body') {
        const qtdAtual = parseInt(data.row.raw[3])
        const qtdMin = parseInt(data.row.raw[4])
        if (qtdAtual <= qtdMin) {
          data.cell.styles.fillColor = [255, 248, 225]
        }
      }
    }
  })

  doc.save(`${aba}_${new Date().toISOString().slice(0, 10)}.pdf`)
}

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Relatórios</h1>
          <p className={styles.subtitulo}>Gere e exporte relatórios do sistema</p>
        </div>
       {dados && (
  <div style={{ display: 'flex', gap: '8px' }}>
    <button className={styles.btnExportarCSV} onClick={exportarCSV}>
      ⬇ CSV
    </button>
    <button className={styles.btnExportarPDF} onClick={exportarPDF}>
      ⬇ PDF
    </button>
  </div>
)}
      </div>

      <div className={styles.abas}>
        {ABAS.map(a => (
          <button
            key={a.id}
            className={`${styles.aba} ${aba === a.id ? styles.abaAtiva : ''}`}
            onClick={() => { setAba(a.id); setDados(null) }}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className={styles.filtrosBox}>
        {aba !== 'estoque' && (
          <>
            <div className={styles.filtroGrupo}>
              <label>Data início</label>
              <input type="date" name="data_inicio" value={filtros.data_inicio} onChange={handleFiltro} className={styles.input} />
            </div>
            <div className={styles.filtroGrupo}>
              <label>Data fim</label>
              <input type="date" name="data_fim" value={filtros.data_fim} onChange={handleFiltro} className={styles.input} />
            </div>
          </>
        )}

        {aba === 'movimentacoes' && (
          <div className={styles.filtroGrupo}>
            <label>Tipo</label>
            <select name="tipo" value={filtros.tipo} onChange={handleFiltro} className={styles.select}>
              <option value="">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
              <option value="ajuste">Ajuste</option>
              <option value="devolucao">Devolução</option>
            </select>
          </div>
        )}

        {aba === 'emprestimos' && (
          <div className={styles.filtroGrupo}>
            <label>Status</label>
            <select name="status" value={filtros.status} onChange={handleFiltro} className={styles.select}>
              <option value="">Todos</option>
              <option value="emprestado">Em aberto</option>
              <option value="devolvido">Devolvido</option>
              <option value="perdido">Perdido</option>
              <option value="danificado">Danificado</option>
            </select>
          </div>
        )}

        {aba === 'manutencoes' && (
          <div className={styles.filtroGrupo}>
            <label>Status</label>
            <select name="status" value={filtros.status} onChange={handleFiltro} className={styles.select}>
              <option value="">Todos</option>
              <option value="aguardando">Aguardando</option>
              <option value="em_conserto">Em conserto</option>
              <option value="consertado">Consertado</option>
              <option value="descartado">Descartado</option>
            </select>
          </div>
        )}

        <button className={styles.btnGerar} onClick={gerarRelatorio} disabled={carregando}>
          {carregando ? 'Gerando...' : ' Gerar relatório'}
        </button>
      </div>

      {dados && (
        <>
          <div className={styles.resumoCards}>
            {Object.entries(dados.resumo).map(([key, val]) => (
              <div key={key} className={styles.resumoCard}>
                <div className={styles.resumoValor}>{val}</div>
                <div className={styles.resumoLabel}>{key.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>

          <div className={styles.tabela}>
            {aba === 'estoque' && (
              <table>
                <thead>
                  <tr>
                    <th>Código</th><th>Nome</th><th>Tipo</th><th>Categoria</th>
                    <th>Qtd. Atual</th><th>Qtd. Mínima</th><th>Localização</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.produtos.map(p => (
                    <tr key={p.codigo_interno} className={p.quantidade_atual <= p.quantidade_minima ? styles.rowAlerta : ''}>
                      <td>{p.codigo_interno}</td>
                      <td>{p.nome}</td>
                      <td>{p.tipo === 'consumivel' ? 'Consumível' : 'Reutilizável'}</td>
                      <td>{p.categoria_nome || '—'}</td>
                      <td><strong>{p.quantidade_atual}</strong> {p.unidade_medida}</td>
                      <td>{p.quantidade_minima} {p.unidade_medida}</td>
                      <td>{p.localizacao_fisica || '—'}</td>
                      <td>{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {aba === 'movimentacoes' && (
              <table>
                <thead>
                  <tr>
                    <th>Data</th><th>Produto</th><th>Tipo</th>
                    <th>Quantidade</th><th>Motivo</th><th>Pessoa</th><th>Operador</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.movimentacoes.map(m => (
                    <tr key={m.id}>
                      <td>{formatarData(m.data)}</td>
                      <td>{m.produto_nome}<br /><small style={{ color: '#888' }}>{m.codigo_interno}</small></td>
                      <td>{m.tipo}</td>
                      <td><strong>{m.quantidade}</strong></td>
                      <td>{m.motivo || '—'}</td>
                      <td>{m.pessoa_nome || '—'}</td>
                      <td>{m.operador_nome || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {aba === 'emprestimos' && (
              <table>
                <thead>
                  <tr>
                    <th>Produto</th><th>Pessoa</th><th>Setor</th>
                    <th>Retirada</th><th>Prev. Devolução</th><th>Devolvido em</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.emprestimos.map(e => (
                    <tr key={e.id} className={e.atrasado ? styles.rowAlerta : ''}>
                      <td>{e.produto_nome}<br /><small style={{ color: '#888' }}>{e.codigo_interno}</small></td>
                      <td>{e.pessoa_nome}</td>
                      <td>{e.pessoa_setor || '—'}</td>
                      <td>{formatarData(e.data_retirada)}</td>
                      <td>{formatarData(e.data_devolucao_prevista)}</td>
                      <td>{formatarData(e.data_devolucao_efetiva)}</td>
                      <td>{e.atrasado ? '⚠ Atrasado' : e.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {aba === 'manutencoes' && (
              <table>
                <thead>
                  <tr>
                    <th>Produto</th><th>Problema</th><th>Fornecedor</th>
                    <th>Abertura</th><th>Encerramento</th><th>Custo Est.</th><th>Custo Real</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.manutencoes.map(m => (
                    <tr key={m.id}>
                      <td>{m.produto_nome}<br /><small style={{ color: '#888' }}>{m.codigo_interno}</small></td>
                      <td>{m.tipo_problema}</td>
                      <td>{m.fornecedor_tecnico || '—'}</td>
                      <td>{formatarData(m.data_abertura)}</td>
                      <td>{formatarData(m.data_encerramento)}</td>
                      <td>{m.custo_estimado ? `R$ ${parseFloat(m.custo_estimado).toFixed(2)}` : '—'}</td>
                      <td>{m.custo_real ? `R$ ${parseFloat(m.custo_real).toFixed(2)}` : '—'}</td>
                      <td>{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {aba === 'consumo' && (
              <table>
                <thead>
                  <tr>
                    <th>Código</th><th>Produto</th><th>Tipo</th>
                    <th>Setor</th><th>Total consumido</th><th>Total retiradas</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.consumo.map((c, i) => (
                    <tr key={i}>
                      <td>{c.codigo_interno}</td>
                      <td>{c.produto_nome}</td>
                      <td>{c.produto_tipo === 'consumivel' ? 'Consumível' : 'Reutilizável'}</td>
                      <td>{c.setor || '—'}</td>
                      <td><strong>{c.total_consumido}</strong> {c.unidade_medida}</td>
                      <td>{c.total_retiradas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {!dados && !carregando && (
        <div className={styles.semDados}>
          Selecione os filtros e clique em <strong>Gerar relatório</strong> para visualizar os dados.
        </div>
      )}
    </div>
  )
}

export default Relatorios