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
        cargo: pessoa.cargo || '',
        telefone: pessoa.telefone || '',
        ativo: pessoa.ativo ?? true,
      })
    } else {
      setForm({
        nome_completo: '',
        matricula: '',
        email: '',
        cargo: '',
        telefone: '',
        ativo: true,
      })
    }

    setErro('')
  }, [pessoa])

  function handleChange(e) {
    const { name, value, type, checked } = e.target

    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!form.nome_completo.trim()) {
      return setErro('Nome completo é obrigatório')
    }

    setCarregando(true)

    try {
      const dados = {
        nome_completo: form.nome_completo.trim(),
        matricula: form.matricula.trim(),
        email: form.email.trim(),
        cargo: form.cargo.trim(),
        telefone: form.telefone.trim(),
      }

      if (pessoa) {
        dados.ativo = form.ativo

        await api.put(
          `/pessoas/${pessoa.id}`,
          dados
        )
      } else {
        await api.post(
          '/pessoas',
          dados
        )
      }

      onSalvar()
    } catch (error) {
      console.error('Erro ao salvar pessoa:', error)

      setErro(
        error.response?.data?.erro ||
        'Erro ao salvar pessoa'
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div
      className={styles.overlay}
      data-modal-open="true"
      onClick={onFechar}
    >
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2>
            {pessoa ? 'Editar Pessoa' : 'Nova Pessoa'}
          </h2>

          <button
            type="button"
            className={styles.btnFechar}
            onClick={onFechar}
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className={styles.form}
        >
          {erro && (
            <div className={styles.erro}>
              {erro}
            </div>
          )}

          <div className={styles.campo}>
            <label>
              Nome completo *
            </label>

            <input
              type="text"
              name="nome_completo"
              value={form.nome_completo}
              onChange={handleChange}
              placeholder="Nome completo"
              autoFocus
            />
          </div>

          <div className={styles.grid2}>
            <div className={styles.campo}>
              <label>
                Matrícula
              </label>

              <input
                type="text"
                name="matricula"
                value={form.matricula}
                onChange={handleChange}
                placeholder="001"
              />
            </div>

            <div className={styles.campo}>
              <label>
                E-mail
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@escola.com"
              />
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.campo}>
              <label>
                Cargo
              </label>

              <input
                type="text"
                name="cargo"
                value={form.cargo}
                onChange={handleChange}
                placeholder="Ex: Professor"
              />
            </div>

            <div className={styles.campo}>
              <label>
                Telefone
              </label>

              <input
                type="text"
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                placeholder="(51) 99999-9999"
              />
            </div>
          </div>

          {pessoa && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <input
                type="checkbox"
                name="ativo"
                id="ativo"
                checked={form.ativo}
                onChange={handleChange}
              />

              <label
                htmlFor="ativo"
                style={{
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Pessoa ativa
              </label>
            </div>
          )}

          <div className={styles.acoes}>
            <button
              type="button"
              onClick={onFechar}
              className={styles.btnCancelar}
              disabled={carregando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={carregando}
              className={styles.btnSalvar}
            >
              {carregando
                ? 'Salvando...'
                : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalPessoa