
import React, { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import ModalEmprestimo from '../components/ModalEmprestimo'
import ModalDevolucao from '../components/ModalDevolucao'
import { useToast } from '../components/Toast'
import styles from './Emprestimos.module.css'
import Select from 'react-select'
import reactSelectStyles from '../utils/reactSelectStyles'
import { tocarSom } from '../utils/sons'

function Emprestimos() {
  const { addToast } = useToast()
  const [emprestimos, setEmprestimos] = useState([])
  const [pessoas, setPessoas] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('emprestado')
  const [filtroPessoa, setFiltroPessoa] = useState('')
  const [filtroSetor, setFiltroSetor] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [emprestimoDevolvendo, setEmprestimoDevolvendo] = useState(null)
  const [codigoDevolucao, setCodigoDevolucao] = useState('')
  const [devolvendo, setDevolvendo] = useState(false)
  const inputDevolucaoRef = useRef(null)
  const [emprestimoExpandido, setEmprestimoExpandido] = useState(null)

  useEffect(() => {
    api.get('/pessoas', { params: { ativo: true } })
      .then(({ data }) => setPessoas(data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    carregarEmprestimos()
  }, [filtroStatus, filtroPessoa])

  async function carregarEmprestimos() {
    try {
      setCarregando(true)
      const params = {}
      if (filtroStatus) params.status = filtroStatus
      if (filtroPessoa) params.pessoa_id = filtroPessoa
      const { data } = await api.get('/emprestimos', { params })
      setEmprestimos(data)
    } catch (error) {
      console.error(error)
    } finally {
      setCarregando(false)
    }
  }

async function handleDevolverPorCodigo(e) {
  e.preventDefault()

  const codigo = codigoDevolucao.trim()

  if (!codigo || devolvendo) return

  setDevolvendo(true)

  try {
    const { data } = await api.post('/emprestimos/devolver-por-codigo', {
      codigo_interno: codigo
    })

    tocarSom('devolucao')

    addToast(
      `${data.mensagem} — ${data.pessoa}`,
      'sucesso'
    )

    setCodigoDevolucao('')

    await carregarEmprestimos()

  } catch (error) {
    addToast(
      error.response?.data?.erro || 'Erro ao devolver',
      'erro'
    )

    setCodigoDevolucao('')

  } finally {
    setDevolvendo(false)

    setTimeout(() => {
      inputDevolucaoRef.current?.focus()
    }, 100)
  }
}

  const setores = [...new Set(pessoas.map(p => p.setor).filter(Boolean))]
  const emprestimosFiltrados = filtroSetor
    ? emprestimos.filter(e => e.pessoa_setor === filtroSetor)
    : emprestimos

  const opcoesPessoas = [
    { value: '', label: 'Todas as pessoas' },
    ...pessoas.map(p => ({
      value: p.id,
      label: p.nome_completo,
    })),
  ]

  const opcoesSetores = [
    { value: '', label: 'Todos os setores' },
    ...setores.map(setor => ({
      value: setor,
      label: setor,
    })),
  ]

  function formatarData(data) {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  function badgeStatus(emp) {
    if (emp.atrasado) return styles.badgeAtrasado
    const mapa = {
     
    }
    return mapa[emp.status] || ''
  }

  function labelStatus(emp) {
    if (emp.atrasado && emp.status === 'emprestado') return 'Atrasado'
    const mapa = {
      emprestado: 'Emprestado',
      devolvido: 'Devolvido',
      perdido: 'Perdido',
      danificado: 'Danificado',
    }
    return mapa[emp.status] || emp.status
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Empréstimos</h1>
          <p className={styles.subtitulo}>{emprestimosFiltrados.length} registro(s) encontrado(s)</p>
        </div>
      </div>

      <div className={styles.acoesRapidas}>
        <form onSubmit={handleDevolverPorCodigo} className={styles.formDevolucao}>
          <input
            ref={inputDevolucaoRef}
            value={codigoDevolucao}
            onChange={e => setCodigoDevolucao(e.target.value)}
            placeholder="Código do produto para devolver..."
            className={styles.inputCodigo}
            disabled={devolvendo}
          />
          <button type="submit" disabled={devolvendo || !codigoDevolucao.trim()} className={styles.btnDevolverRapido}>
            {devolvendo ? 'Devolvendo...' : 'Devolver'}
          </button>
        </form>

        <button className={styles.btnNovo} onClick={() => setModalAberto(true)}>
          + Inserir Empréstimo
        </button>
      </div>

      <div className={styles.filtros}>
        <Select
          className={styles.reactSelect}
          classNamePrefix="react-select"
          styles={reactSelectStyles}
          placeholder="Status"
          isSearchable={false}
          options={[
            { value: '', label: 'Todos os status' },
            { value: 'emprestado', label: 'Em aberto' },
            { value: 'devolvido', label: 'Devolvidos' },
            { value: 'perdido', label: 'Perdidos' },
            { value: 'danificado', label: 'Danificados' },
          ]}
          value={[
            { value: '', label: 'Todos os status' },
            { value: 'emprestado', label: 'Em aberto' },
            { value: 'devolvido', label: 'Devolvidos' },
            { value: 'perdido', label: 'Perdidos' },
            { value: 'danificado', label: 'Danificados' },
          ].find(op => op.value === filtroStatus)}
          onChange={opcao => setFiltroStatus(opcao.value)}
          
        />

        <Select
          className={styles.reactSelect}
          classNamePrefix="react-select"
          styles={reactSelectStyles}
          placeholder="Pesquisar pessoa..."
          options={opcoesPessoas}
          isSearchable={false}
          value={
            opcoesPessoas.find(op => op.value === filtroPessoa) || null
          }

          onChange={(opcao) => setFiltroPessoa(opcao?.value || '')}
        />

        <Select
          className={styles.reactSelect}
          classNamePrefix="react-select"
          styles={reactSelectStyles}
          placeholder="Setor"
          isSearchable={false}
          options={opcoesSetores}
          value={opcoesSetores.find(op => op.value === filtroSetor) || null}
          onChange={opcao => setFiltroSetor(opcao.value)}
        />
      </div>

      <div className={styles.tabela}>
        {carregando ? (
          <div className={styles.vazio}>Carregando...</div>
        ) : emprestimosFiltrados.length === 0 ? (
          <div className={styles.vazio}>Nenhum empréstimo encontrado.</div>
        ) : (
          <table>
            <thead>
              <tr>
                    <th>Solicitante</th>
                    <th>Setor</th>
                    <th>Retirada</th>            
                    <th>Equipamentos</th>
                    <th>Status</th>
              </tr>
            </thead>
            <tbody>
  {emprestimosFiltrados.map(emp => (
    <React.Fragment key={emp.id}>

      <tr
  className={emp.atrasado ? styles.rowAtrasado : ''}
  onClick={() =>
    setEmprestimoExpandido(
      emprestimoExpandido === emp.id ? null : emp.id
    )
  }
  style={{ cursor: 'pointer' }}
>

        <td>
          <strong>{emp.pessoa_nome}</strong>
        </td>

        <td>
          {emp.pessoa_setor || '—'}
        </td>

        <td>
          {formatarData(emp.data_retirada)}
        </td>

        
        <td>
  <div style={{
    maxWidth: '280px'
  }}>
    <strong style={{
      display: 'block',
      fontSize: '12px',
      marginBottom: '4px'
    }}>
      {emp.quantidade_itens || 0} equipamento(s)
    </strong>

    <div style={{
      color: '#64748b',
      fontSize: '11px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }}>
      {emp.itens?.slice(0, 3).map(item => item.produto_nome).join(' · ')}

      {emp.itens?.length > 3 && (
        <span>
          {' '}+ {emp.itens.length - 3} outros
        </span>
      )}
    </div>
  </div>
</td>

        <td>
          <span className={`${styles.badge} ${badgeStatus(emp)}`}>
            {labelStatus(emp)}
          </span>
        </td>

        

      </tr>

      {emprestimoExpandido === emp.id && (
        <tr>
          <td colSpan="7" style={{ padding: 0 }}>

            <div
              style={{
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                borderBottom: '1px solid #e2e8f0',
                padding: '16px 20px'
              }}
            >

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}
              >
                <div>
                  <strong>
                    Equipamentos do empréstimo
                  </strong>

                  <div
                    style={{
                      fontSize: '12px',
                      color: '#64748b',
                      marginTop: '3px'
                    }}
                  >
                    {emp.quantidade_itens} equipamento(s)
                  </div>
                </div>

              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '8px'
                }}
              >

                {emp.itens?.map(item => (
                  <div
                    key={item.id}
                    style={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 12px'
                    }}
                  >

                    <strong
                      style={{
                        display: 'block',
                        fontSize: '13px'
                      }}
                    >
                      {item.produto_nome}
                    </strong>

                    <span
                      style={{
                        display: 'block',
                        color: '#64748b',
                        fontSize: '11px',
                        marginTop: '3px'
                      }}
                    >
                      Código: {item.codigo_interno}
                    </span>

                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '7px',
                        fontSize: '10px',
                        padding: '3px 7px',
                        borderRadius: '10px',
                        background:
                          item.item_status === 'emprestado'
                            ? '#dbeafe'
                            : '#dcfce7',
                        color:
                          item.item_status === 'emprestado'
                            ? '#1d4ed8'
                            : '#15803d'
                      }}
                    >
                      {item.item_status === 'emprestado'
                        ? 'Emprestado'
                        : item.item_status}
                    </span>

                  </div>
                ))}

              </div>

            </div>

          </td>
        </tr>
      )}

    </React.Fragment>
  ))}
</tbody>
          </table>
        )}
      </div>
    
      {modalAberto && (
        <ModalEmprestimo
          onFechar={() => setModalAberto(false)}
          onSalvar={() => { setModalAberto(false); carregarEmprestimos() }}
        />
      )}

      {emprestimoDevolvendo && (
        <ModalDevolucao
          emprestimo={emprestimoDevolvendo}
          onFechar={() => setEmprestimoDevolvendo(null)}
          onSalvar={() => { setEmprestimoDevolvendo(null); carregarEmprestimos() }}
        />
      )}
    </div>
  )
}

export default Emprestimos