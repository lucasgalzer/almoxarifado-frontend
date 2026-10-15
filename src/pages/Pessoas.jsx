import { useState, useEffect } from 'react'
import api from '../services/api'
import { useToast } from '../components/Toast'
import styles from './Pessoas.module.css'
import Select from 'react-select'
import reactSelectStyles from '../utils/reactSelectStyles'

function Pessoas() {
  const { addToast } = useToast()

  const [pessoas, setPessoas] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState('')
  const [carregando, setCarregando] = useState(true)

  const opcoesAtivo = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Ativos' },
    { value: 'false', label: 'Inativos' },
  ]

  useEffect(() => {
    carregarPessoas()
  }, [busca, filtroAtivo])

  async function carregarPessoas() {
    try {
      setCarregando(true)

      const params = {}

      if (busca) {
        params.busca = busca
      }

      if (filtroAtivo !== '') {
        params.ativo = filtroAtivo
      }

      const { data } = await api.get(
        '/pessoas',
        { params }
      )

      setPessoas(data)
    } catch (error) {
      console.error(
        'Erro ao carregar pessoas:',
        error
      )

      addToast(
        error.response?.data?.erro ||
          'Erro ao carregar pessoas',
        'erro'
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>
            Pessoas
          </h1>

          <p className={styles.subtitulo}>
            {pessoas.length} pessoa(s) encontrada(s)
          </p>
        </div>
      </div>

      <div className={styles.filtros}>
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={busca}
          onChange={e =>
            setBusca(e.target.value)
          }
          className={styles.inputBusca}
        />

        <Select
          className={styles.reactSelect}
          classNamePrefix="react-select"
          styles={reactSelectStyles}
          placeholder="Todos"
          isSearchable={false}
          options={opcoesAtivo}
          value={
            opcoesAtivo.find(
              op => op.value === filtroAtivo
            ) || null
          }
          onChange={opcao =>
            setFiltroAtivo(
              opcao?.value || ''
            )
          }
        />
      </div>

      <div className={styles.tabela}>
        {carregando ? (
          <div className={styles.vazio}>
            Carregando...
          </div>
        ) : pessoas.length === 0 ? (
          <div className={styles.vazio}>
            Nenhuma pessoa encontrada.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Matrícula</th>
                <th>Cargo</th>
                <th>E-mail</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {pessoas.map(pessoa => (
                <tr key={pessoa.id}>
                  <td>
                    {pessoa.nome_completo}
                  </td>

                  <td>
                    {pessoa.matricula || '—'}
                  </td>

                  <td>
                    {pessoa.cargo || '—'}
                  </td>

                  <td>
                    {pessoa.email || '—'}
                  </td>

                  <td>
                    <span
                      className={`${styles.badge} ${
                        pessoa.ativo
                          ? styles.badgeAtivo
                          : styles.badgeInativo
                      }`}
                    >
                      {pessoa.ativo
                        ? 'Ativo'
                        : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Pessoas