import { useState, useEffect } from 'react'
import api from '../services/api'
import ModalConfirmacao from '../components/ModalConfirmacao'
import { useToast } from '../components/Toast'
import styles from './Usuarios.module.css'
import Select from 'react-select'
import reactSelectStyles from '../utils/reactSelectStyles'

const PERFIS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'operador', label: 'Operador' },
]

function Usuarios() {
  const { addToast } = useToast()

  const [usuarios, setUsuarios] = useState([])
  const [pessoasDisponiveis, setPessoasDisponiveis] = useState([])

  const [carregando, setCarregando] = useState(true)
  const [carregandoPessoas, setCarregandoPessoas] = useState(false)

  const [modalAberto, setModalAberto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [usuarioDesativando, setUsuarioDesativando] = useState(null)

  const [form, setForm] = useState({
    pessoa_id: '',
    perfil: 'operador',
  })

  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarUsuarios()
  }, [])

  async function carregarUsuarios() {
    try {
      setCarregando(true)

      const { data } = await api.get('/usuarios')

      setUsuarios(data)
    } catch (error) {
      console.error(
        'Erro ao carregar usuários:',
        error
      )

      addToast(
        error.response?.data?.erro ||
          'Erro ao carregar usuários',
        'erro'
      )
    } finally {
      setCarregando(false)
    }
  }

  async function carregarPessoasDisponiveis() {
    try {
      setCarregandoPessoas(true)

      const { data } = await api.get(
        '/usuarios/disponiveis'
      )

      setPessoasDisponiveis(data)
    } catch (error) {
      console.error(
        'Erro ao carregar pessoas disponíveis:',
        error
      )

      addToast(
        error.response?.data?.erro ||
          'Erro ao carregar pessoas disponíveis',
        'erro'
      )
    } finally {
      setCarregandoPessoas(false)
    }
  }

  async function abrirModalNovo() {
    setUsuarioEditando(null)

    setForm({
      pessoa_id: '',
      perfil: 'operador',
    })

    setErro('')
    setModalAberto(true)

    await carregarPessoasDisponiveis()
  }

  function abrirModalEditar(usuario) {
    setUsuarioEditando(usuario)

    setForm({
      pessoa_id: usuario.pessoa_id || '',
      perfil: usuario.perfil || 'operador',
    })

    setErro('')
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setUsuarioEditando(null)

    setForm({
      pessoa_id: '',
      perfil: 'operador',
    })

    setErro('')
  }

  function handleChange(e) {
    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  function handlePessoaChange(opcao) {
    setForm(prev => ({
      ...prev,
      pessoa_id: opcao?.value || '',
    }))
  }

  function handlePerfilChange(opcao) {
    setForm(prev => ({
      ...prev,
      perfil: opcao?.value || '',
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setErro('')

    if (!usuarioEditando && !form.pessoa_id) {
      setErro('Selecione uma pessoa')
      return
    }

    if (!form.perfil) {
      setErro('Selecione um perfil')
      return
    }

    setSalvando(true)

    try {
      if (usuarioEditando) {
        await api.put(
          `/usuarios/${usuarioEditando.id}`,
          {
            perfil: form.perfil,
          }
        )

        addToast(
          'Usuário atualizado com sucesso!',
          'sucesso'
        )
      } else {
        await api.post(
          '/usuarios',
          {
            pessoa_id: form.pessoa_id,
            perfil: form.perfil,
          }
        )

        addToast(
          'Pessoa adicionada ao setor com sucesso!',
          'sucesso'
        )
      }

      fecharModal()
      carregarUsuarios()
    } catch (error) {
      console.error(
        'Erro ao salvar usuário:',
        error
      )

      setErro(
        error.response?.data?.erro ||
          'Erro ao salvar usuário'
      )
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivo() {
    if (!usuarioDesativando) {
      return
    }

    try {
      await api.patch(
        `/usuarios/${usuarioDesativando.id}/status`,
        {
          ativo: !usuarioDesativando.ativo,
        }
      )

      addToast(
        usuarioDesativando.ativo
          ? 'Usuário desativado'
          : 'Usuário reativado',
        usuarioDesativando.ativo
          ? 'aviso'
          : 'sucesso'
      )

      setUsuarioDesativando(null)

      carregarUsuarios()
    } catch (error) {
      console.error(
        'Erro ao atualizar status:',
        error
      )

      /*
       * Compatibilidade caso a rota de status ainda
       * não exista no backend.
       */
      try {
        await api.put(
          `/usuarios/${usuarioDesativando.id}`,
          {
            perfil: usuarioDesativando.perfil,
            ativo: !usuarioDesativando.ativo,
          }
        )

        addToast(
          usuarioDesativando.ativo
            ? 'Usuário desativado'
            : 'Usuário reativado',
          usuarioDesativando.ativo
            ? 'aviso'
            : 'sucesso'
        )

        setUsuarioDesativando(null)

        carregarUsuarios()
      } catch (fallbackError) {
        addToast(
          fallbackError.response?.data?.erro ||
            error.response?.data?.erro ||
            'Erro ao atualizar status',
          'erro'
        )

        setUsuarioDesativando(null)
      }
    }
  }

  function labelPerfil(perfil) {
    const mapa = {
      admin: 'Administrador',
      operador: 'Operador',
    }

    return mapa[perfil] || perfil
  }

  function badgePerfil(perfil) {
    const mapa = {
      admin: styles.badgeAdmin,
      operador: styles.badgeOperador,
    }

    return mapa[perfil] || ''
  }

  function nomeUsuario(usuario) {
    return (
      usuario.nome_completo ||
      usuario.nome ||
      'Pessoa sem nome'
    )
  }

  const opcoesPessoas = pessoasDisponiveis.map(
    pessoa => ({
      value: pessoa.id,
      label: `${pessoa.nome_completo}${
        pessoa.email
          ? ` — ${pessoa.email}`
          : ''
      }`,
    })
  )

  const pessoaSelecionada =
    opcoesPessoas.find(
      opcao =>
        opcao.value === form.pessoa_id
    ) || null

  const perfilSelecionado =
    PERFIS.find(
      opcao =>
        opcao.value === form.perfil
    ) || null

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>
            Usuários
          </h1>

          <p className={styles.subtitulo}>
            {usuarios.length} usuário(s) com acesso a este setor
          </p>
        </div>

        <button
          className={styles.btnNovo}
          onClick={abrirModalNovo}
        >
          + Adicionar pessoa
        </button>
      </div>

      <div className={styles.tabela}>
        {carregando ? (
          <div className={styles.vazio}>
            Carregando...
          </div>
        ) : usuarios.length === 0 ? (
          <div className={styles.vazio}>
            Nenhuma pessoa possui acesso a este setor.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Adicionado em</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td>
                    <strong>
                      {nomeUsuario(usuario)}
                    </strong>
                  </td>

                  <td>
                    {usuario.email || '—'}
                  </td>

                  <td>
                    <span
                      className={`${styles.badge} ${
                        badgePerfil(
                          usuario.perfil
                        )
                      }`}
                    >
                      {labelPerfil(
                        usuario.perfil
                      )}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`${styles.badge} ${
                        usuario.ativo
                          ? styles.badgeAtivo
                          : styles.badgeInativo
                      }`}
                    >
                      {usuario.ativo
                        ? 'Ativo'
                        : 'Inativo'}
                    </span>
                  </td>

                  <td>
                    {usuario.created_at
                      ? new Date(
                          usuario.created_at
                        ).toLocaleDateString(
                          'pt-BR'
                        )
                      : '—'}
                  </td>

                  <td>
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                      }}
                    >
                      <button
                        className={
                          styles.btnEditar
                        }
                        onClick={() =>
                          abrirModalEditar(
                            usuario
                          )
                        }
                      >
                        Editar
                      </button>

                      <button
                        className={
                          usuario.ativo
                            ? styles.btnDesativar
                            : styles.btnAtivar
                        }
                        onClick={() =>
                          setUsuarioDesativando(
                            usuario
                          )
                        }
                      >
                        {usuario.ativo
                          ? 'Desativar'
                          : 'Reativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <div
          className={styles.overlay}
          onClick={fecharModal}
        >
          <div
            className={styles.modal}
            onClick={e =>
              e.stopPropagation()
            }
          >
            <div
              className={styles.modalHeader}
            >
              <h2>
                {usuarioEditando
                  ? 'Editar acesso ao setor'
                  : 'Adicionar pessoa ao setor'}
              </h2>

              <button
                type="button"
                className={styles.btnFechar}
                onClick={fecharModal}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className={styles.form}
            >
              {erro && (
                <div
                  className={styles.erro}
                >
                  {erro}
                </div>
              )}

              {!usuarioEditando && (
                <div
                  className={styles.campo}
                >
                  <label>
                    Pessoa *
                  </label>

                  {carregandoPessoas ? (
                    <div
                      className={styles.vazio}
                      style={{
                        padding: '10px',
                      }}
                    >
                      Carregando pessoas...
                    </div>
                  ) : opcoesPessoas.length ===
                    0 ? (
                    <div
                      className={styles.erro}
                    >
                      Não existem pessoas
                      disponíveis para
                      adicionar a este setor.
                    </div>
                  ) : (
                    <Select
                      className={
                        styles.reactSelect
                      }
                      classNamePrefix="react-select"
                      styles={
                        reactSelectStyles
                      }
                      placeholder="Selecione uma pessoa"
                      options={
                        opcoesPessoas
                      }
                      value={
                        pessoaSelecionada
                      }
                      onChange={
                        handlePessoaChange
                      }
                      isSearchable
                      isClearable
                    />
                  )}
                </div>
              )}

              {usuarioEditando && (
                <div
                  className={styles.campo}
                >
                  <label>
                    Pessoa
                  </label>

                  <input
                    type="text"
                    value={nomeUsuario(
                      usuarioEditando
                    )}
                    disabled
                  />
                </div>
              )}

              <div
                className={styles.campo}
              >
                <label>
                  Perfil no setor *
                </label>

                <Select
                  className={
                    styles.reactSelect
                  }
                  classNamePrefix="react-select"
                  styles={
                    reactSelectStyles
                  }
                  placeholder="Selecione o perfil"
                  options={PERFIS}
                  value={
                    perfilSelecionado
                  }
                  onChange={
                    handlePerfilChange
                  }
                  isSearchable={false}
                />
              </div>

              <div
                className={styles.modalAcoes}
              >
                <button
                  type="button"
                  onClick={fecharModal}
                  className={
                    styles.btnCancelar
                  }
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    salvando ||
                    (
                      !usuarioEditando &&
                      opcoesPessoas.length ===
                        0
                    )
                  }
                  className={
                    styles.btnSalvar
                  }
                >
                  {salvando
                    ? 'Salvando...'
                    : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {usuarioDesativando && (
        <ModalConfirmacao
          titulo={
            usuarioDesativando.ativo
              ? 'Desativar acesso'
              : 'Reativar acesso'
          }
          mensagem={`Tem certeza que deseja ${
            usuarioDesativando.ativo
              ? 'desativar'
              : 'reativar'
          } o acesso de "${nomeUsuario(
            usuarioDesativando
          )}" a este setor?`}
          onConfirmar={toggleAtivo}
          onCancelar={() =>
            setUsuarioDesativando(null)
          }
          tipo={
            usuarioDesativando.ativo
              ? 'perigo'
              : 'aviso'
          }
        />
      )}
    </div>
  )
}

export default Usuarios