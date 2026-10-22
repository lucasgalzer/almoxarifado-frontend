import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  ArrowLeftRight,
  Wrench,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  CalendarDays,
  Clock3,
  MapPin
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
  const [dataAgenda, setDataAgenda] = useState(() => dataLocalISO())
  const [carregando, setCarregando] = useState(true)
  const [carregandoReservas, setCarregandoReservas] = useState(true)

  const [menusInstituicao, setMenusInstituicao] = useState([])
  const [cardsInstituicao, setCardsInstituicao] = useState([])

  useEffect(() => {
    carregarDashboard(dataAgenda)

    const intervalo = setInterval(() => {
      carregarDashboard(dataAgenda)
    }, 10000)

    return () => clearInterval(intervalo)
  }, [dataAgenda])

  async function carregarDashboard(dataSelecionada) {
    try {
      const [
        { data: indicadores },
        { data: alertasData },
        { data: instituicao },
        { data: reservasData }
      ] = await Promise.all([
        api.get('/dashboard/indicadores'),
        api.get('/alertas'),
        api.get('/instituicao'),
        api.get('/dashboard/reservas', {
          params: { data: dataSelecionada }
        })
      ])

      setDados(indicadores)
      setAlertas(Array.isArray(alertasData) ? alertasData : [])
      setReservas(Array.isArray(reservasData) ? reservasData : [])

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
      setCarregandoReservas(false)
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

  const dataFormatada = dataAgenda
    ? new Date(`${dataAgenda}T12:00:00`).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : ''

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Dashboard</h1>
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
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </div>
      </div>

      <div className={styles.cards}>
        {carregando ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className={styles.cardSkeleton} />
          ))
        ) : (
          cards.map(card => {
            const Icon = card.icon

            return (
              <div
                key={card.label}
                className={styles.card}
                onClick={() => navigate(card.rota)}
              >
                <div
                  className={styles.cardIconWrapper}
                  style={{ background: card.bg }}
                >
                  <Icon size={20} color={card.cor} />
                </div>

                <span
                  className={styles.cardValor}
                  style={{ color: card.cor }}
                >
                  {card.valor}
                </span>

                <p className={styles.cardLabel}>{card.label}</p>
              </div>
            )
          })
        )}
      </div>

      <section className={styles.secao}>
        <div className={styles.agendaHeader}>
          <div>
            <h2 className={styles.agendaTitulo}>
              <CalendarDays size={19} />
              Reservas do dia
            </h2>
            <p className={styles.agendaSubtitulo}>
              Somente reservas aprovadas do setor
            </p>
          </div>

          <label className={styles.seletorData}>
            <span>Data</span>
            <input
              type="date"
              value={dataAgenda}
              onChange={event => {
                setCarregandoReservas(true)
                setDataAgenda(event.target.value)
              }}
            />
          </label>
        </div>

        <div className={styles.agenda}>
          {carregandoReservas ? (
            <div className={styles.agendaVazia}>Carregando reservas...</div>
          ) : reservas.length === 0 ? (
            <div className={styles.agendaVazia}>
              Nenhuma reserva aprovada para {dataFormatada}.
            </div>
          ) : (
            reservas.map(reserva => (
              <article key={reserva.id} className={styles.reservaItem}>
                <div className={styles.reservaHorario}>
                  <strong>{formatarHora(reserva.hora_inicio)}</strong>
                  <span>{formatarHora(reserva.hora_fim)}</span>
                </div>

                <div className={styles.reservaDetalhes}>
                  <strong>{reserva.titulo}</strong>
                  <span>{reserva.servico_nome}</span>
                  <span>Solicitante: {reserva.solicitante_nome}</span>
                </div>

                <div className={styles.reservaLocal}>
                  <MapPin size={15} />
                  <span>{reserva.local}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <div className={styles.tudo}>
        {alertas.length === 0 ? (
          <>
            <CheckCircle size={18} color="#7eb82c" />
            <span>Estoque em ordem — nenhum alerta no momento</span>
          </>
        ) : (
          <div style={{ width: '100%' }}>
            {alertas.map(alerta => (
              <div
                key={alerta.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 0',
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                <AlertTriangle size={18} color="#f59e0b" />
                <div style={{ flex: 1 }}>
                  <strong>{alerta.titulo}</strong>
                  <div>{alerta.mensagem}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard