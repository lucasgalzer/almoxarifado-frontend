import { useState, useEffect } from 'react'
import api from '../services/api'
import styles from './ModalProduto.module.css'

function ModalPessoa({ pessoa, onFechar, onSalvar }) {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    nome_completo: '',
    matricula: '',
    email: '',
    setor: '',
    cargo: '',
    telefone: '',
    ativo: true,
  })

  useEffect(() => {
    if (pessoa) {
      setForm({
        nome_completo: pessoa.nome_completo || '',
        matricula: pessoa.matricula || '',
        email: pessoa.email || '',
        setor: pessoa.setor || '',
        cargo: pessoa.cargo || '',
        telefone: pessoa.telefone || '',
        ativo: pessoa.ativo ?? true,
      })
    }
  }, [pessoa])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!form.nome_completo) return setErro('Nome completo é obrigatório')

    setCarregando(true)
    try {
      if (pessoa) {
        await api.put(`/pessoas/${pessoa.id}`, form)
      } else {
        await api.post('/pessoas', form)
      }
      onSalvar()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao salvar')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{pessoa ? 'Editar Pessoa' : 'Nova Pessoa'}</h2>
          <button className={styles.btnFechar} onClick={onFechar}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {erro && <div className={styles.erro}>{erro}</div>}

          <div className={styles.campo}>
            <label>Nome completo *</label>
            <input name="nome_completo" value={form.nome_completo} onChange={handleChange} placeholder="Nome completo" />
          </div>

          <div className={styles.grid2}>
            <div className={styles.campo}>
              <label>Matrícula</label>
              <input name="matricula" value={form.matricula} onChange={handleChange} placeholder="001" />
            </div>
            <div className={styles.campo}>
              <label>E-mail</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@escola.com" />
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.campo}>
              <label>Setor</label>
              <input name="setor" value={form.setor} onChange={handleChange} placeholder="Ex: Coordenação" />
            </div>
            <div className={styles.campo}>
              <label>Cargo</label>
              <input name="cargo" value={form.cargo} onChange={handleChange} placeholder="Ex: Professor" />
            </div>
          </div>

          <div className={styles.campo}>
            <label>Telefone</label>
            <input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(51) 99999-9999" />
          </div>

          {pessoa && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" name="ativo" id="ativo" checked={form.ativo} onChange={handleChange} />
              <label htmlFor="ativo" style={{ fontSize: '14px', cursor: 'pointer' }}>Pessoa ativa</label>
            </div>
          )}

          <div className={styles.acoes}>
            <button type="button" onClick={onFechar} className={styles.btnCancelar}>Cancelar</button>
            <button type="submit" disabled={carregando} className={styles.btnSalvar}>
              {carregando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalPessoa