import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react'

import styles from './Login.module.css'
import api from '../services/api'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('erro') === 'instituicao_desativada') {
      setErro(
        'Sua instituição foi desativada. Entre em contato com o suporte.'
      )
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!email || !senha) {
      setErro('Preencha o e-mail e a senha')
      return
    }

    setCarregando(true)

    try {
      const { data } = await api.post('/auth/login', {
        email,
        senha,
      })

      localStorage.setItem('token', data.token)

      localStorage.removeItem('usuario')
      localStorage.removeItem('usuario_super_admin')

      if (data.usuario.super_admin) {
        navigate('/super-admin')
      } else if (data.usuario.perfil === 'solicitante') {
        navigate('/solicitante')
      } else {
        navigate('/dashboard')
      }

    } catch (error) {
      setErro(
        error.response?.data?.erro ||
        'Não foi possível conectar ao servidor'
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={styles.container}>

      {/* ELEMENTOS DECORATIVOS DO FUNDO */}
      <div className={`${styles.decor} ${styles.decorTop}`} />
      <div className={`${styles.decor} ${styles.decorBottom}`} />

      <main className={styles.loginArea}>

        <div className={styles.loginCard}>

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


          {/* DESCRIÇÃO */}

          <div className={styles.cardHeader}>
            <p>
              Entre com suas credenciais para acessar o sistema.
            </p>
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


            {/* E-MAIL */}

            <div className={styles.campo}>

              <label htmlFor="email">
                E-mail
              </label>

              <div className={styles.inputWrapper}>

                <Mail
                  size={18}
                  className={styles.inputIcon}
                />

                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={carregando}
                  autoComplete="email"
                />

              </div>

            </div>


            {/* SENHA */}

            <div className={styles.campo}>

              <label htmlFor="senha">
                Senha
              </label>

              <div className={styles.inputWrapper}>

                <Lock
                  size={18}
                  className={styles.inputIcon}
                />

                <input
                  id="senha"
                  type="password"
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={carregando}
                  autoComplete="current-password"
                />

              </div>

            </div>


            {/* BOTÃO */}

            <button
              type="submit"
              disabled={carregando}
              className={styles.botao}
            >

              {carregando ? (
                <>
                  <span className={styles.spinner} />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight size={18} />
                </>
              )}

            </button>

          </form>


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

export default Login