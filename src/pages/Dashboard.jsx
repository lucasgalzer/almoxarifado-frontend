import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  ArrowLeftRight,
  Wrench,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  CalendarDays
} from 'lucide-react'
import api from '../services/api'
import useAuth from '../hooks/useAuth'
import styles from './Dashboard.module.css'

function dataLocalISO(data = new Date()) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function formatarHora(hora) {
  return hora ? String(hora).slice(0, 5) : '--:--'
}

function Dashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [dados, setDados] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [reservas, setReservas] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [menusInstituicao, setMenusInstituicao] = useState([])
  const [cardsInstituicao, setCardsInstituicao] = useState([])

  useEffect(() => {
    carregarDashboard()

    const intervalo = setInterval(carregarDashboard, 10000)
    return () => clearInterval(intervalo)
  }, [])

  async function carregarDashboard() {
    try {
      const dataHoje = dataLocalISO()
      const [
        { data: indicadores },
        { data: alertasData },
        { data: instituicao }
      ] = await Promise.all([
        api.get('/dashboard/indicadores'),
        api.get('/alertas'),
        api.get('/instituicao')
      ])

      setDados(indicadores)
      setAlertas(Array.isArray(alertasData) ? alertasData : [])

      // A falha na consulta das reservas não deve afetar os cards existentes.
      try {
        const { data: reservasData } = await api.get('/dashboard/reservas', {
          params: { data: dataHoje }
        })
        setReservas(Array.isArray(reservasData) ? reservasData : [])
      } catch (erroReservas) {
        console.error('Erro ao carregar notificações de reservas:', erroReservas)
      }

      setMenusInstituicao(
        Array.isArray(instituicao?.menus) ? instituicao.menus : []
      )

      setCardsInstituicao(
        Array.isArray(instituicao?.cards) ? instituicao.cards : []
      )
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setCarregando(false)
    }
  }

  const cards = dados
    ? [
        {
          menu: 'produtos',
          label: 'Produtos',
          valor: dados.total_produtos,
          icon: Package,
          cor: '#2563eb',
          bg: '#eff6ff',
          rota: '/produtos'
        },

        {
          menu: 'emprestimos',
          label: 'Empréstimos em aberto',
          valor: dados.emprestimos_abertos,
          icon: ArrowLeftRight,
          cor: '#d97706',
          bg: '#fffbeb',
          rota: '/emprestimos'
        },

        {
          menu: 'manutencao',
          label: 'Em manutenção',
          valor: dados.manutencoes_abertas,
          icon: Wrench,
          cor: '#dc2626',
          bg: '#fef2f2',
          rota: '/manutencao'
        },

        {
          menu: 'solicitacoes',
          label: 'Solicitações pendentes',
          valor: dados.solicitacoes_pendentes,
          icon: ClipboardList,
          cor: '#7eb82c',
          bg: '#f0fdf4',
          rota: '/solicitacoes'
        }
      ].filter(card => cardsInstituicao.includes(card.menu))
    : []

  return (
    <div className={styles.page}>

      <div className={styles.header}>

        <div>
          <h1 className={styles.titulo}>
            Dashboard
          </h1>

          {usuario?.setor_nome && (
            <div
              style={{
                marginTop: '3px',
                fontSize: '12px',
                color: '#6b6f85'
              }}
            >
              {usuario.setor_nome}
            </div>
          )}
        </div>

        <div className={styles.data}>
          {new Date().toLocaleDateString(
            'pt-BR',
            {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            }
          )}
        </div>

      </div>

      <div className={styles.cards}>

        {carregando ? (

          [1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={styles.cardSkeleton}
            />
          ))

        ) : (

          cards.map(card => {

            const Icon = card.icon

            return (
              <div
                key={card.label}
                className={styles.card}
                onClick={() =>
                  navigate(card.rota)
                }
              >

                <div
                  className={
                    styles.cardIconWrapper
                  }
                  style={{
                    background: card.bg
                  }}
                >
                  <Icon
                    size={20}
                    color={card.cor}
                  />
                </div>

                <span
                  className={styles.cardValor}
                  style={{
                    color: card.cor
                  }}
                >
                  {card.valor}
                </span>

                <p
                  className={
                    styles.cardLabel
                  }
                >
                  {card.label}
                </p>

              </div>
            )
          })

        )}

      </div>

      <div className={styles.tudo}>

        {alertas.length === 0 ? (

          <>
            <CheckCircle
              size={18}
              color="#7eb82c"
            />

            <span>
              Estoque em ordem — nenhum alerta
              no momento
            </span>
          </>

        ) : (

          <div
            style={{
              width: '100%'
            }}
          >

            {alertas.map(alerta => (

              <div
                key={alerta.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 0',
                  borderBottom:
                    '1px solid #e5e7eb'
                }}
              >

                <AlertTriangle
                  size={18}
                  color="#f59e0b"
                />

                <div
                  style={{
                    flex: 1
                  }}
                >

                  <strong>
                    {alerta.titulo}
                  </strong>

                  <div>
                    {alerta.mensagem}
                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      <div className={styles.tudo}>
        <CalendarDays size={18} color="#6366f1" />
        <div style={{ flex: 1 }}>
          <strong>
            {reservas.length === 0
              ? 'Nenhuma reserva aprovada para hoje'
              : `${reservas.length} ${reservas.length === 1 ? 'reserva aprovada' : 'reservas aprovadas'} para hoje`}
          </strong>

          {reservas.map(reserva => (
            <div
              key={reserva.id}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px 10px',
                paddingTop: '7px'
              }}
            >
              <span>
                {formatarHora(reserva.hora_inicio)}–{formatarHora(reserva.hora_fim)}
              </span>
              <span>{reserva.titulo}</span>
              <span>{reserva.local}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default Dashboard