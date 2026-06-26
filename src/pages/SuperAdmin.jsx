import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuth from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import styles from './SuperAdmin.module.css'
import { Mail, Phone, Building2, Calendar, CheckCircle, XCircle } from 'lucide-react'

function SuperAdmin() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [instituicoes, setInstituicoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [modalEditando, setModalEditando] = useState(null)
  const [modalUsuarios, setModalUsuarios] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false)
  const [senhaEditando, setSenhaEditando] = useState(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome: '', email: '', cnpj: '', telefone: '',
    admin_nome: '', admin_email: '', admin_senha: '',
  })
  const [formEdit, setFormEdit] = useState({
    nome: '', email: '', cnpj: '', telefone: '',
  })

  useEffect(() => {
    carregarInstituicoes()
  }, [])

  async function carregarInstituicoes() {
    try {
      setCarregando(true)
      const { data } = await api.get('/super-admin/instituicoes')
      setInstituicoes(data)
    } catch (error) {
      if (error.response?.status === 403) navigate('/dashboard')
    } finally {
      setCarregando(false)
    }
  }

  async function abrirUsuarios(inst) {
    setModalUsuarios(inst)
    setCarregandoUsuarios(true)
    setSenhaEditando(null)
    setNovaSenha('')
    try {
      const { data } = await api.get(`/super-admin/instituicoes/${inst.id}/usuarios`)
      setUsuarios(data)
    } catch {
      addToast('Erro ao carregar usuários', 'erro')
    } finally {
      setCarregandoUsuarios(false)
    }
  }

  async function salvarSenha(usuarioId) {
    if (!novaSenha || novaSenha.length < 6) {
      addToast('Senha deve ter pelo menos 6 caracteres', 'erro')
      return
    }
    try {
      await api.patch(`/super-admin/usuarios/${usuarioId}/senha`, { nova_senha: novaSenha })
      addToast('Senha atualizada com sucesso!', 'sucesso')
      setSenhaEditando(null)
      setNovaSenha('')
    } catch (error) {
      addToast(error.response?.data?.erro || 'Erro ao atualizar senha', 'erro')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      await api.post('/super-admin/instituicoes', form)
      addToast('Escola criada com sucesso!', 'sucesso')
      setModalAberto(false)
      setForm({ nome: '', email: '', cnpj: '', telefone: '', admin_nome: '', admin_email: '', admin_senha: '' })
      carregarInstituicoes()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao criar escola')
    } finally {
      setSalvando(false)
    }
  }

  async function handleEditar(e) {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      await api.put(`/super-admin/instituicoes/${modalEditando.id}`, formEdit)
      addToast('Escola atualizada com sucesso!', 'sucesso')
      setModalEditando(null)
      carregarInstituicoes()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao atualizar escola')
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivo(inst) {
    try {
      await api.patch(`/super-admin/instituicoes/${inst.id}/toggle`)
      addToast(inst.ativo ? 'Escola desativada' : 'Escola reativada', inst.ativo ? 'aviso' : 'sucesso')
      carregarInstituicoes()
    } catch (error) {
      addToast('Erro ao atualizar', 'erro')
    }
  }

  async function acessarEscola(inst) {
  try {
    const { data } = await api.post(`/super-admin/instituicoes/${inst.id}/acessar`)
    localStorage.setItem('token_super_admin', localStorage.getItem('token'))
    localStorage.setItem('token', data.token)
    localStorage.removeItem('usuario')
    localStorage.removeItem('usuario_super_admin')
    navigate('/dashboard')
    addToast(`Acessando como ${inst.nome}`, 'sucesso')
  } catch (error) {
    addToast(error.response?.data?.erro || 'Erro ao acessar escola', 'erro')
  }
}

  function abrirEditar(inst) {
    setModalEditando(inst)
    setFormEdit({ nome: inst.nome, email: inst.email || '', cnpj: inst.cnpj || '', telefone: inst.telefone || '' })
    setErro('')
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleChangeEdit(e) {
    const { name, value } = e.target
    setFormEdit(prev => ({ ...prev, [name]: value }))
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const labelStyle = {
    fontSize: '12px', fontWeight: '600', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: '0.4px',
    display: 'block', marginBottom: '5px'
  }

  const secaoStyle = {
    fontSize: '12px', fontWeight: '700', color: '#374151',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '8px'
  }

  function labelPerfil(perfil) {
    const mapa = { admin: 'Admin', operador: 'Operador', solicitante: 'Solicitante' }
    return mapa[perfil] || perfil
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLogo}>
          <div className={styles.logoIcon}>SA</div>
          <div>
            <span className={styles.logoTitle}>Super Admin</span>
            <span className={styles.logoSub}>Gestão de escolas</span>
          </div>
        </div>
        <div className={styles.headerUser}>
          <span className={styles.userName}>{usuario?.nome}</span>
          <button className={styles.btnLogout} onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.titulo}>Escolas cadastradas</h1>
            <p className={styles.subtitulo}>{instituicoes.length} escola(s)</p>
          </div>
          <button className={styles.btnNova} onClick={() => { setModalAberto(true); setErro('') }}>
            + Nova Escola
          </button>
        </div>

        {carregando ? (
          <div className={styles.vazio}>Carregando...</div>
        ) : instituicoes.length === 0 ? (
          <div className={styles.vazio}>Nenhuma escola cadastrada.</div>
        ) : (
          <div className={styles.grid}>
            {instituicoes.map(inst => (
              <div key={inst.id} className={`${styles.card} ${!inst.ativo ? styles.cardInativo : ''}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardNome}>{inst.nome}</h3>
                  <span className={`${styles.badge} ${inst.ativo ? styles.badgeAtivo : styles.badgeInativo}`}>
                    {inst.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                <div className={styles.cardInfo}>
  {inst.email && (
    <p><Mail size={12} style={{ marginRight: '5px', verticalAlign: 'middle' }} />{inst.email}</p>
  )}
  {inst.telefone && (
    <p><Phone size={12} style={{ marginRight: '5px', verticalAlign: 'middle' }} />{inst.telefone}</p>
  )}
  {inst.cnpj && (
    <p><Building2 size={12} style={{ marginRight: '5px', verticalAlign: 'middle' }} />{inst.cnpj}</p>
  )}
  <p><Calendar size={12} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
    {new Date(inst.created_at).toLocaleDateString('pt-BR')}
  </p>
</div>

                <div className={styles.cardStats}>
                  <div className={styles.stat}>
                    <span className={styles.statNum}>{inst.total_usuarios}</span>
                    <span className={styles.statLabel}>Usuários</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statNum}>{inst.total_produtos}</span>
                    <span className={styles.statLabel}>Produtos</span>
                  </div>
                </div>

                <div className={styles.cardAcoes}>
                  <button onClick={() => abrirEditar(inst)} className={styles.btnEditar}>Editar</button>
                  <button onClick={() => abrirUsuarios(inst)} className={styles.btnUsuarios}>Usuários</button>
                  {inst.ativo && (
                    <button onClick={() => acessarEscola(inst)} className={styles.btnAcessar}>Acessar</button>
                  )}
                  <button onClick={() => toggleAtivo(inst)} className={inst.ativo ? styles.btnDesativar : styles.btnAtivar}>
                    {inst.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Nova Escola */}
      {modalAberto && (
        <div className={styles.overlay} onClick={() => setModalAberto(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Nova Escola</h2>
              <button className={styles.btnFechar} onClick={() => setModalAberto(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              {erro && <div className={styles.erro}>{erro}</div>}
              <p style={secaoStyle}>Dados da escola</p>
              <div className={styles.campo}>
                <label style={labelStyle}>Nome da escola *</label>
                <input name="nome" value={form.nome} onChange={handleChange} placeholder="Ex: Colégio Teutônia" className={styles.input} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className={styles.campo} style={{ flex: 1 }}>
                  <label style={labelStyle}>E-mail</label>
                  <input name="email" value={form.email} onChange={handleChange} placeholder="contato@escola.com" className={styles.input} />
                </div>
                <div className={styles.campo} style={{ flex: 1 }}>
                  <label style={labelStyle}>Telefone</label>
                  <input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(51) 99999-9999" className={styles.input} />
                </div>
              </div>
              <div className={styles.campo}>
                <label style={labelStyle}>CNPJ</label>
                <input name="cnpj" value={form.cnpj} onChange={handleChange} placeholder="00.000.000/0001-00" className={styles.input} />
              </div>
              <p style={secaoStyle}>Administrador da escola</p>
              <div className={styles.campo}>
                <label style={labelStyle}>Nome do administrador *</label>
                <input name="admin_nome" value={form.admin_nome} onChange={handleChange} placeholder="Nome completo" className={styles.input} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className={styles.campo} style={{ flex: 1 }}>
                  <label style={labelStyle}>E-mail do admin *</label>
                  <input name="admin_email" value={form.admin_email} onChange={handleChange} placeholder="admin@escola.com" className={styles.input} />
                </div>
                <div className={styles.campo} style={{ flex: 1 }}>
                  <label style={labelStyle}>Senha *</label>
                  <input type="password" name="admin_senha" value={form.admin_senha} onChange={handleChange} placeholder="Mínimo 6 caracteres" className={styles.input} />
                </div>
              </div>
              <div className={styles.modalAcoes}>
                <button type="button" onClick={() => setModalAberto(false)} className={styles.btnCancelar}>Cancelar</button>
                <button type="submit" disabled={salvando} className={styles.btnSalvar}>
                  {salvando ? 'Criando...' : 'Criar escola'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Escola */}
      {modalEditando && (
        <div className={styles.overlay} onClick={() => setModalEditando(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Editar Escola</h2>
              <button className={styles.btnFechar} onClick={() => setModalEditando(null)}>✕</button>
            </div>
            <form onSubmit={handleEditar} className={styles.modalForm}>
              {erro && <div className={styles.erro}>{erro}</div>}
              <div className={styles.campo}>
                <label style={labelStyle}>Nome da escola *</label>
                <input name="nome" value={formEdit.nome} onChange={handleChangeEdit} placeholder="Ex: Colégio Teutônia" className={styles.input} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className={styles.campo} style={{ flex: 1 }}>
                  <label style={labelStyle}>E-mail</label>
                  <input name="email" value={formEdit.email} onChange={handleChangeEdit} placeholder="contato@escola.com" className={styles.input} />
                </div>
                <div className={styles.campo} style={{ flex: 1 }}>
                  <label style={labelStyle}>Telefone</label>
                  <input name="telefone" value={formEdit.telefone} onChange={handleChangeEdit} placeholder="(51) 99999-9999" className={styles.input} />
                </div>
              </div>
              <div className={styles.campo}>
                <label style={labelStyle}>CNPJ</label>
                <input name="cnpj" value={formEdit.cnpj} onChange={handleChangeEdit} placeholder="00.000.000/0001-00" className={styles.input} />
              </div>
              <div className={styles.modalAcoes}>
                <button type="button" onClick={() => setModalEditando(null)} className={styles.btnCancelar}>Cancelar</button>
                <button type="submit" disabled={salvando} className={styles.btnSalvar}>
                  {salvando ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Usuários da Escola */}
      {modalUsuarios && (
        <div className={styles.overlay} onClick={() => setModalUsuarios(null)}>
          <div className={styles.modal} style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Usuários — {modalUsuarios.nome}</h2>
              <button className={styles.btnFechar} onClick={() => setModalUsuarios(null)}>✕</button>
            </div>
            <div style={{ padding: '16px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
              {carregandoUsuarios ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>Carregando...</p>
              ) : usuarios.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>Nenhum usuário encontrado.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {usuarios.map(u => (
                    <div key={u.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#111827' }}>{u.nome}</strong>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{u.email}</p>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#eff6ff', color: '#2563eb', fontWeight: '600' }}>
                              {labelPerfil(u.perfil)}
                            </span>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: u.ativo ? '#f0fdf4' : '#fef2f2', color: u.ativo ? '#16a34a' : '#dc2626', fontWeight: '600' }}>
                              {u.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => { setSenhaEditando(u.id); setNovaSenha('') }}
                          style={{ padding: '5px 12px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#7c3aed', cursor: 'pointer' }}
                        >
                          Trocar senha
                        </button>
                      </div>
                      {senhaEditando === u.id && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <input
                            type="password"
                            value={novaSenha}
                            onChange={e => setNovaSenha(e.target.value)}
                            placeholder="Nova senha (mín. 6 caracteres)"
                            autoFocus
                            style={{ flex: 1, padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                          />
                          <button
                            onClick={() => salvarSenha(u.id)}
                            style={{ padding: '7px 14px', background: '#6366f1', border: 'none', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setSenhaEditando(null)}
                            style={{ padding: '7px 10px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 24px', borderTop: '1px solid #e5e7eb' }}>
              <button onClick={() => setModalUsuarios(null)} className={styles.btnCancelar} style={{ width: '100%' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuperAdmin