import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import styles from './Login.module.css'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('erro') === 'instituicao_desativada') {
      setErro('Sua instituição foi desativada. Entre em contato com o suporte.')
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
    const response = await fetch('http://localhost:3333/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    })

    const data = await response.json()

    if (!response.ok) {
      setErro(data.erro || 'Erro ao fazer login')
      return
    }

    // Salva só o token — dados do usuário ficam no JWT
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
  } catch {
    setErro('Não foi possível conectar ao servidor')
  } finally {
    setCarregando(false)
  }
}
  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.leftContent}>
          <img
            src="/uploadlogo/Prancheta 1.png"
            alt="Logo"
            style={{ height: '50px', objectFit: 'contain', marginBottom: '24px' }}
            onError={e => e.target.style.display = 'none'}
          />

          <p className={styles.brandDesc}>
            Controle completo de estoque, empréstimos e solicitações para sua instituição de ensino.
          </p>

          <div className={styles.features}>
            {[
              'Controle de estoque em tempo real',
              'Gestão de empréstimos e devoluções',
              'Solicitações online de materiais',
              'Relatórios e indicadores gerenciais',
            ].map(f => (
              <div key={f} className={styles.feature}>
                <div className={styles.featureDot} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Bem-vindo</h2>
            <p className={styles.cardSub}>Entre com suas credenciais para acessar o sistema</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {erro && (
              <div className={styles.erro}>
                <AlertCircle size={16} />
                <span>{erro}</span>
              </div>
            )}

            <div className={styles.campo}>
              <label className={styles.label}>E-mail</label>
              <div className={styles.inputWrapper}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={carregando}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.campo}>
              <label className={styles.label}>Senha</label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  disabled={carregando}
                  className={styles.input}
                />
              </div>
            </div>

            <button type="submit" disabled={carregando} className={styles.botao}>
              {carregando ? (
                <span>Entrando...</span>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className={styles.footer}>
            Sistema de Almoxarifado Escolar © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login