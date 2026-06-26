import { useState, useEffect } from 'react'
import api from '../services/api'
import ModalConfirmacao from '../components/ModalConfirmacao'
import { useToast } from '../components/Toast'
import styles from './Usuarios.module.css'

const PERFIS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'operador', label: 'Operador' },
  { value: 'solicitante', label: 'Solicitante' },
]

function Usuarios() {
  const { addToast } = useToast()
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [usuarioDesativando, setUsuarioDesativando] = useState(null)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'operador' })
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
      console.error(error)
    } finally {
      setCarregando(false)
    }
  }

  function abrirModalNovo() {
    setUsuarioEditando(null)
    setForm({ nome: '', email: '', senha: '', perfil: 'operador' })
    setErro('')
    setModalAberto(true)
  }

  function abrirModalEditar(usuario) {
    setUsuarioEditando(usuario)
    setForm({ nome: usuario.nome, email: usuario.email, senha: '', perfil: usuario.perfil })
    setErro('')
    setModalAberto(true)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      if (usuarioEditando) {
        await api.put(`/usuarios/${usuarioEditando.id}`, form)
        addToast('Usuário atualizado com sucesso!', 'sucesso')
      } else {
        await api.post('/usuarios', form)
        addToast('Usuário criado com sucesso!', 'sucesso')
      }
      setModalAberto(false)
      carregarUsuarios()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao salvar usuário')
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivo() {
    try {
      await api.put(`/usuarios/${usuarioDesativando.id}`, {
        ...usuarioDesativando,
        ativo: !usuarioDesativando.ativo
      })
      addToast(
        usuarioDesativando.ativo ? 'Usuário desativado' : 'Usuário reativado',
        usuarioDesativando.ativo ? 'aviso' : 'sucesso'
      )
      setUsuarioDesativando(null)
      carregarUsuarios()
    } catch (error) {
      addToast(error.response?.data?.erro || 'Erro ao atualizar', 'erro')
      setUsuarioDesativando(null)
    }
  }

  function labelPerfil(perfil) {
    const mapa = {
      admin: 'Administrador',
      operador: 'Operador',
      solicitante: 'Solicitante',
    }
    return mapa[perfil] || perfil
  }

  function badgePerfil(perfil) {
    const mapa = {
      admin: styles.badgeAdmin,
      operador: styles.badgeOperador,
      solicitante: styles.badgeSolicitante,
    }
    return mapa[perfil] || ''
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Usuários</h1>
          <p className={styles.subtitulo}>{usuarios.length} usuário(s) cadastrado(s)</p>
        </div>
        <button className={styles.btnNovo} onClick={abrirModalNovo}>
          + Novo Usuário
        </button>
      </div>

      <div className={styles.tabela}>
        {carregando ? (
          <div className={styles.vazio}>Carregando...</div>
        ) : usuarios.length === 0 ? (
          <div className={styles.vazio}>Nenhum usuário encontrado.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td><strong>{usuario.nome}</strong></td>
                  <td>{usuario.email}</td>
                  <td>
                    <span className={`${styles.badge} ${badgePerfil(usuario.perfil)}`}>
                      {labelPerfil(usuario.perfil)}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${usuario.ativo ? styles.badgeAtivo : styles.badgeInativo}`}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>{new Date(usuario.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className={styles.btnEditar} onClick={() => abrirModalEditar(usuario)}>
                        Editar
                      </button>
                      <button
                        className={usuario.ativo ? styles.btnDesativar : styles.btnAtivar}
                        onClick={() => setUsuarioDesativando(usuario)}
                      >
                        {usuario.ativo ? 'Desativar' : 'Reativar'}
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
        <div className={styles.overlay} onClick={() => setModalAberto(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button className={styles.btnFechar} onClick={() => setModalAberto(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              {erro && <div className={styles.erro}>{erro}</div>}

              <div className={styles.campo}>
                <label>Nome *</label>
                <input name="nome" value={form.nome} onChange={handleChange} placeholder="Nome completo" />
              </div>

              <div className={styles.campo}>
                <label>E-mail *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@escola.com" />
              </div>

              <div className={styles.campo}>
                <label>{usuarioEditando ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}</label>
                <input type="password" name="senha" value={form.senha} onChange={handleChange} placeholder="Mínimo 6 caracteres" />
              </div>

              <div className={styles.campo}>
                <label>Perfil *</label>
                <select name="perfil" value={form.perfil} onChange={handleChange}>
                  {PERFIS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.modalAcoes}>
                <button type="button" onClick={() => setModalAberto(false)} className={styles.btnCancelar}>
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className={styles.btnSalvar}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {usuarioDesativando && (
        <ModalConfirmacao
          titulo={usuarioDesativando.ativo ? 'Desativar usuário' : 'Reativar usuário'}
          mensagem={`Tem certeza que deseja ${usuarioDesativando.ativo ? 'desativar' : 'reativar'} o usuário "${usuarioDesativando.nome}"?`}
          onConfirmar={toggleAtivo}
          onCancelar={() => setUsuarioDesativando(null)}
          tipo={usuarioDesativando.ativo ? 'perigo' : 'aviso'}
        />
      )}
    </div>
  )
}

export default Usuarios