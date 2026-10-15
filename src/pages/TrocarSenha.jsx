import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

import styles from './TrocarSenha.module.css'
import api from '../services/api'

function TrocarSenha() {
  const navigate = useNavigate()

  const [pessoa, setPessoa] = useState(null)

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)

  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const pessoaSalva = localStorage.getItem('troca_senha_pessoa')

    if (!token || !pessoaSalva) {
      localStorage.removeItem('token')
      localStorage.removeItem('troca_senha_pessoa')

      navigate('/login', { replace: true })
      return
    }

    try {
      setPessoa(JSON.parse(pessoaSalva))
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('troca_senha_pessoa')

      navigate('/login', { replace: true })
    }
  }, [navigate])

  async function handleSubmit(e) {
    e.preventDefault()

    setErro('')
    setSucesso('')

    if (!novaSenha || !confirmarSenha) {
      setErro('Preencha os dois campos de senha')
      return
    }

    if (novaSenha.length < 6) {
      setErro('A nova senha deve possuir pelo menos 6 caracteres')
      return
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem')
      return
    }

    setCarregando(true)

    try {
      const { data } = await api.patch(
        '/auth/trocar-senha',
        {
          nova_senha: novaSenha
        }
      )

      setSucesso(
        data.mensagem ||
        'Senha alterada com sucesso.'
      )

      setNovaSenha('')
      setConfirmarSenha('')

      // Aguarda um pouco para o usuário visualizar
      // a mensagem de sucesso.
      setTimeout(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('troca_senha_pessoa')

        navigate('/login', { replace: true })
      }, 1800)

    } catch (error) {
      const mensagem =
        error.response?.data?.erro ||
        'Não foi possível alterar a senha'

      setErro(mensagem)
    } finally {
      setCarregando(false)
    }
  }

  function voltarLogin() {
    localStorage.removeItem('token')
    localStorage.removeItem('troca_senha_pessoa')

    navigate('/login', { replace: true })
  }

  if (!pessoa) {
    return null
  }

  return (
    <div className={styles.container}>

      <div className={`${styles.decor} ${styles.decorTop}`} />
      <div className={`${styles.decor} ${styles.decorBottom}`} />

      <main className={styles.area}>

        <div className={styles.card}>

          {/* LOGO */}

          <div className={styles.logoWrapper}>
            <img
              src="/uploadlogo/logo.png"
              alt="Colégio Teutônia"
              className={styles.logo}
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>

          {/* CABEÇALHO */}

          <div className={styles.header}>

            <div className={styles.iconHeader}>
              <Lock size={21} />
            </div>

            <h1>
              Defina sua nova senha
            </h1>

            <p>
              Por segurança, é necessário alterar sua senha
              antes de continuar.
            </p>

          </div>

          {/* USUÁRIO */}

          <div className={styles.usuario}>

            <span>
              Usuário
            </span>

            <strong>
              {pessoa.nome}
            </strong>

            <small>
              {pessoa.email}
            </small>

          </div>

          {/* FORMULÁRIO */}

          <form
            onSubmit={handleSubmit}
            className={styles.form}
          >

            {/* ERRO */}

            {erro && (
              <div className={styles.erro}>

                <AlertCircle size={17} />

                <span>
                  {erro}
                </span>

              </div>
            )}

            {/* SUCESSO */}

            {sucesso && (
              <div className={styles.sucesso}>

                <CheckCircle2 size={17} />

                <span>
                  {sucesso}
                </span>

              </div>
            )}

            {/* NOVA SENHA */}

            <div className={styles.campo}>

              <label htmlFor="novaSenha">
                Nova senha
              </label>

              <div className={styles.inputWrapper}>

                <Lock
                  size={18}
                  className={styles.inputIcon}
                />

                <input
                  id="novaSenha"
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  placeholder="Digite sua nova senha"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  disabled={carregando || !!sucesso}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className={styles.botaoVisualizar}
                  onClick={() =>
                    setMostrarNovaSenha(!mostrarNovaSenha)
                  }
                  disabled={carregando || !!sucesso}
                  aria-label={
                    mostrarNovaSenha
                      ? 'Ocultar senha'
                      : 'Mostrar senha'
                  }
                >
                  {mostrarNovaSenha ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* CONFIRMAR SENHA */}

            <div className={styles.campo}>

              <label htmlFor="confirmarSenha">
                Confirmar nova senha
              </label>

              <div className={styles.inputWrapper}>

                <Lock
                  size={18}
                  className={styles.inputIcon}
                />

                <input
                  id="confirmarSenha"
                  type={
                    mostrarConfirmarSenha
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Digite novamente sua nova senha"
                  value={confirmarSenha}
                  onChange={(e) =>
                    setConfirmarSenha(e.target.value)
                  }
                  disabled={carregando || !!sucesso}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className={styles.botaoVisualizar}
                  onClick={() =>
                    setMostrarConfirmarSenha(
                      !mostrarConfirmarSenha
                    )
                  }
                  disabled={carregando || !!sucesso}
                  aria-label={
                    mostrarConfirmarSenha
                      ? 'Ocultar senha'
                      : 'Mostrar senha'
                  }
                >
                  {mostrarConfirmarSenha ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* REQUISITO */}

            <div className={styles.requisito}>

              <Lock size={14} />

              <span>
                A senha deve possuir pelo menos 6 caracteres.
              </span>

            </div>

            {/* BOTÃO */}

            <button
              type="submit"
              disabled={carregando || !!sucesso}
              className={styles.botao}
            >

              {carregando ? (
                <>
                  <span className={styles.spinner} />
                  <span>Alterando senha...</span>
                </>
              ) : (
                <>
                  <span>Alterar senha</span>
                  <ArrowRight size={18} />
                </>
              )}

            </button>

          </form>

          {/* VOLTAR */}

          <button
            type="button"
            className={styles.voltar}
            onClick={voltarLogin}
            disabled={carregando}
          >
            Voltar para o login
          </button>

          {/* SEGURANÇA */}

          <div className={styles.security}>

            <Lock size={14} />

            <span>
              Acesso seguro e protegido
            </span>

          </div>

          {/* RODAPÉ */}

          <div className={styles.footer}>

            Desenvolvido por{' '}
            <strong>
              Colégio Teutônia
            </strong>

            <br />

            © {new Date().getFullYear()} • Todos os direitos reservados

          </div>

        </div>

      </main>

    </div>
  )
}

export default TrocarSenha