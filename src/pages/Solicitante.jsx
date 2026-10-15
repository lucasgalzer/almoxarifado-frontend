import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuth from '../hooks/useAuth'
import ModalSolicitacao from '../components/ModalSolicitacao'
import { useToast } from '../components/Toast'
import styles from './Solicitante.module.css'

function Solicitante() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [solicitacoes, setSolicitacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [instituicao, setInstituicao] = useState(null)

  // =====================================================
  // NOVA SOLICITAÇÃO
  // =====================================================

  const [modalAberto, setModalAberto] = useState(false)
  const [tipoModal, setTipoModal] = useState(null)

  // Etapa atual:
  // setor -> escolha do tipo -> formulário
  const [etapaSolicitacao, setEtapaSolicitacao] = useState('setor')

  const [setores, setSetores] = useState([])
  const [setorSelecionado, setSetorSelecionado] = useState(null)
  const [carregandoSetores, setCarregandoSetores] = useState(false)

  useEffect(() => {
    carregarSolicitacoes()
    carregarInstituicao()
  }, [])

  // =====================================================
  // INSTITUIÇÃO
  // =====================================================

  async function carregarInstituicao() {
    try {
      const { data } = await api.get('/instituicao')

      setInstituicao(data)

      if (data.cor_primaria) {
        document.documentElement.style.setProperty(
          '--color-primary',
          data.cor_primaria
        )
      }

      if (data.cor_secundaria) {
        document.documentElement.style.setProperty(
          '--color-secondary',
          data.cor_secundaria
        )
      }
    } catch (error) {
      console.error(error)
    }
  }

  // =====================================================
  // SOLICITAÇÕES
  // =====================================================

  async function carregarSolicitacoes() {
    try {
      setCarregando(true)

      const { data } = await api.get('/solicitacoes')

      setSolicitacoes(
        Array.isArray(data) ? data : []
      )
    } catch (error) {
      console.error(error)
    } finally {
      setCarregando(false)
    }
  }

  // =====================================================
  // SETORES
  // =====================================================

  async function carregarSetores() {
    try {
      setCarregandoSetores(true)

      const { data } = await api.get('/setores')

      setSetores(
        Array.isArray(data) ? data : []
      )
    } catch (error) {
      console.error('Erro ao carregar setores:', error)

      addToast(
        'Não foi possível carregar os setores.',
        'erro'
      )
    } finally {
      setCarregandoSetores(false)
    }
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  function handleLogout() {
    logout()
    navigate('/login')
  }

  // =====================================================
  // ABRIR NOVA SOLICITAÇÃO
  // =====================================================

  function abrirNovaSolicitacao() {
    setSetorSelecionado(null)
    setTipoModal(null)
    setEtapaSolicitacao('setor')
    setModalAberto(true)

    carregarSetores()
  }

  // =====================================================
  // ESCOLHER SETOR
  // =====================================================

  function selecionarSetor(setor) {
    setSetorSelecionado(setor)
    setEtapaSolicitacao('tipo')
  }

  // =====================================================
  // ESCOLHER TIPO
  // =====================================================

  function selecionarTipo(tipo) {
    setTipoModal(tipo)
    setEtapaSolicitacao('formulario')
  }

  // =====================================================
  // VOLTAR
  // =====================================================

  function voltarEtapa() {
    if (etapaSolicitacao === 'tipo') {
      setSetorSelecionado(null)
      setEtapaSolicitacao('setor')
      return
    }

    if (etapaSolicitacao === 'formulario') {
      setTipoModal(null)
      setEtapaSolicitacao('tipo')
    }
  }

  // =====================================================
  // FECHAR MODAL
  // =====================================================

  function fecharModal() {
    setModalAberto(false)
    setTipoModal(null)
    setSetorSelecionado(null)
    setEtapaSolicitacao('setor')
  }

  // =====================================================
  // DATA
  // =====================================================

  function formatarData(data) {
    if (!data) return '—'

    return new Date(data).toLocaleDateString('pt-BR')
  }

  function formatarDataReserva(data) {
    if (!data) return '—'

    const dataObj = new Date(`${data}T00:00:00`)

    return dataObj.toLocaleDateString('pt-BR')
  }

  // =====================================================
  // STATUS
  // =====================================================

  function labelStatus(status) {
    const mapa = {
      pendente: 'Pendente',
      aprovada: 'Aprovada',
      pronta: 'Pronta p/ retirada',
      entregue: 'Entregue',
      agendada: 'Agendada',
      em_andamento: 'Em andamento',
      concluida: 'Concluída',
      recusada: 'Recusada',
      cancelada: 'Cancelada'
    }

    return mapa[status] || status
  }

  function corStatus(status) {
    const mapa = {
      pendente: {
        bg: '#fffbeb',
        color: '#d97706'
      },

      aprovada: {
        bg: '#f0fdf4',
        color: '#16a34a'
      },

      pronta: {
        bg: '#eff6ff',
        color: '#2563eb'
      },

      agendada: {
        bg: '#eff6ff',
        color: '#2563eb'
      },

      em_andamento: {
        bg: '#eff6ff',
        color: '#2563eb'
      },

      entregue: {
        bg: '#f0fdf4',
        color: '#15803d'
      },

      concluida: {
        bg: '#f0fdf4',
        color: '#15803d'
      },

      recusada: {
        bg: '#fef2f2',
        color: '#dc2626'
      },

      cancelada: {
        bg: '#f3f4f6',
        color: '#6b7280'
      }
    }

    return (
      mapa[status] || {
        bg: '#f3f4f6',
        color: '#6b7280'
      }
    )
  }

  // =====================================================
  // TIPOS
  // =====================================================

  function labelTipo(tipo) {
    const mapa = {
      material: 'Materiais',
      reserva: 'Reservas / Eventos',
      manutencao: 'Manutenção / Infra'
    }

    return mapa[tipo] || 'Solicitação'
  }

  function iconeTipo(tipo) {
    const mapa = {
      material: '',
      reserva: '',
      manutencao: ''
    }

    return mapa[tipo] || '📋'
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className={styles.page}>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className={styles.header}>

        <div className={styles.headerLogo}>

          {instituicao?.logo_base64 ? (
            <img
              src={instituicao.logo_base64}
              alt="Logo"
              style={{
                height: '36px',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div className={styles.logoIcon}>
              A
            </div>
          )}

          <div>
            <span className={styles.logoTitle}>
              Almoxarifado
            </span>

            <span className={styles.logoSub}>
              {instituicao?.nome_exibicao ||
                instituicao?.nome ||
                'Escolar'}
            </span>
          </div>

        </div>

        <div className={styles.headerUser}>

          <span className={styles.userName}>
            {usuario?.nome}
          </span>

          <button
            className={styles.btnLogout}
            onClick={handleLogout}
          >
            Sair
          </button>

        </div>

      </header>

      {/* =====================================================
          CONTEÚDO
      ===================================================== */}

      <main className={styles.main}>

        <div className={styles.topBar}>

          <div>
            <h1 className={styles.titulo}>
              Minhas Solicitações
            </h1>

            <p className={styles.subtitulo}>
              {solicitacoes.length} solicitação(ões)
            </p>
          </div>

        </div>

        {/* ===================================================
            NOVA SOLICITAÇÃO
        =================================================== */}

        <button
          type="button"
          onClick={abrirNovaSolicitacao}
          className={styles.btnNova}
          style={{
            marginBottom: '24px'
          }}
        >
          + Nova solicitação
        </button>

        {/* ===================================================
            LISTA
        =================================================== */}

        {carregando ? (

          <div className={styles.vazio}>
            Carregando...
          </div>

        ) : solicitacoes.length === 0 ? (

          <div className={styles.vazioCard}>

            <p>
              Você ainda não fez nenhuma solicitação.
            </p>

           

          </div>

        ) : (

          <div className={styles.lista}>

            {solicitacoes.map(sol => {

              const cor = corStatus(sol.status)

              return (
                <div
                  key={sol.id}
                  className={styles.card}
                >

                  {/* TOPO */}

                  <div className={styles.cardTopo}>

                    <span
                      className={styles.badge}
                      style={{
                        background: cor.bg,
                        color: cor.color
                      }}
                    >
                      {labelStatus(sol.status)}
                    </span>

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color:
                          'var(--color-text-muted)'
                      }}
                    >
                      {iconeTipo(sol.tipo)}{' '}
                      {labelTipo(sol.tipo)}
                    </span>

                    <span
                      className={styles.cardData}
                    >
                      {formatarData(sol.created_at)}
                    </span>

                  </div>

                  {/* SETOR DESTINO */}

                  {sol.setor_destino_nome && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '13px',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      Destino:{' '}
                      <strong
                        style={{
                          color: 'var(--color-text)'
                        }}
                      >
                        {sol.setor_destino_nome}
                      </strong>
                    </div>
                  )}

                  {/* MATERIAL */}

                  {sol.tipo === 'material' && (
                    <>
                      {sol.finalidade && (
                        <p
                          className={
                            styles.cardFinalidade
                          }
                        >
                          {sol.finalidade}
                        </p>
                      )}

                      {Array.isArray(sol.itens) &&
                        sol.itens.length > 0 && (

                          <div
                            className={
                              styles.cardItens
                            }
                          >

                            {sol.itens.map(item => (

                              <span
                                key={item.id}
                                className={
                                  styles.itemTag
                                }
                              >
                                {item.produto_nome}
                                {' × '}
                                {item.quantidade_solicitada}
                                {' '}
                                {item.unidade_medida}
                              </span>

                            ))}

                          </div>

                        )}

                    </>
                  )}

                  {/* RESERVA */}

                  {sol.tipo === 'reserva' &&
                    sol.reserva && (

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginTop: '8px'
                      }}
                    >

                      <strong>
                        {sol.reserva.titulo}
                      </strong>

                      <span
                        style={{
                          fontSize: '13px',
                          color:
                            'var(--color-text-muted)'
                        }}
                      >
                        {formatarDataReserva(
                          sol.reserva.data
                        )}
                        {' · '}
                        {sol.reserva.hora_inicio}
                        {' às '}
                        {sol.reserva.hora_fim}
                        {' · '}
                        {sol.reserva.local}
                      </span>

                      {Array.isArray(
                        sol.reserva.recursos
                      ) &&
                        sol.reserva.recursos.length > 0 && (

                          <div
                            className={
                              styles.cardItens
                            }
                          >

                            {sol.reserva.recursos.map(
                              recurso => (

                                <span
                                  key={recurso.id}
                                  className={
                                    styles.itemTag
                                  }
                                >
                                  {recurso.recurso}
                                  {' × '}
                                  {recurso.quantidade}
                                </span>

                              )
                            )}

                          </div>

                        )}

                    </div>

                  )}

                  {/* MANUTENÇÃO */}

                  {sol.tipo === 'manutencao' &&
                    sol.manutencao && (

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginTop: '8px'
                      }}
                    >

                      <strong>
                        {sol.manutencao.categoria}
                      </strong>

                      <span
                        style={{
                          fontSize: '13px',
                          color:
                            'var(--color-text-muted)'
                        }}
                      >
                        Local:{' '}
                        {sol.manutencao.local}
                        {' · '}
                        Prioridade:{' '}
                        {sol.manutencao.prioridade}
                      </span>

                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: '14px'
                        }}
                      >
                        {sol.manutencao.descricao}
                      </p>

                    </div>

                  )}

                  {/* OBSERVAÇÕES */}

                  {sol.observacoes && (
                    <p
                      className={styles.cardObs}
                    >
                      {sol.observacoes}
                    </p>
                  )}

                  {/* ALERTA MATERIAL */}

                  {sol.tipo === 'material' &&
                    sol.status === 'pronta' && (

                    <div
                      className={
                        styles.cardAlerta
                      }
                    >
                      Seu material está pronto
                      para retirada no almoxarifado!
                    </div>

                  )}

                  {/* ALERTA RESERVA */}

                  {sol.tipo === 'reserva' &&
                    sol.status === 'agendada' && (

                    <div
                      className={
                        styles.cardAlerta
                      }
                    >
                      Sua reserva está confirmada.
                    </div>

                  )}

                  {/* ALERTA MANUTENÇÃO */}

                  {sol.tipo === 'manutencao' &&
                    sol.status === 'em_andamento' && (

                    <div
                      className={
                        styles.cardAlerta
                      }
                    >
                      Sua solicitação de manutenção
                      está em andamento.
                    </div>

                  )}

                </div>
              )
            })}

          </div>

        )}

      </main>

      {/* =====================================================
          MODAL DE NOVA SOLICITAÇÃO
      ===================================================== */}

      {modalAberto && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >

          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: '14px',
              padding: '24px',
              width: 'min(650px, calc(100vw - 32px))',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)'
            }}
          >

            {/* =================================================
                ETAPA 1 — SETOR
            ================================================= */}

            {etapaSolicitacao === 'setor' && (

              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      color: 'var(--color-text)'
                    }}
                  >
                    Nova solicitação
                  </h2>

                  <button
                    type="button"
                    onClick={fecharModal}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: '22px',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    ×
                  </button>
                </div>

                <p
                  style={{
                    marginTop: '0',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  Para qual setor você deseja enviar
                  sua solicitação?
                </p>

                {carregandoSetores ? (

                  <div
                    style={{
                      padding: '30px',
                      textAlign: 'center',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    Carregando setores...
                  </div>

                ) : setores.length === 0 ? (

                  <div
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    Nenhum setor disponível para
                    receber solicitações.
                  </div>

                ) : (

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      marginTop: '20px'
                    }}
                  >

                    {setores.map(setor => (

                      <button
                        key={setor.id}
                        type="button"
                        onClick={() =>
                          selecionarSetor(setor)
                        }
                        style={{
                          textAlign: 'left',
                          background:
                            'var(--color-surface)',
                          border:
                            '1px solid var(--color-border)',
                          borderRadius: '12px',
                          padding: '18px',
                          cursor: 'pointer',
                          boxShadow:
                            'var(--shadow-sm)'
                        }}
                      >

                        <strong
                          style={{
                            display: 'block',
                            color: 'var(--color-text)',
                            fontSize: '16px',
                            marginBottom: '6px'
                          }}
                        >
                          {setor.nome}
                        </strong>

                        <span
                          style={{
                            fontSize: '13px',
                            color:
                              'var(--color-text-muted)'
                          }}
                        >
                          Enviar solicitação para este setor
                        </span>

                      </button>

                    ))}

                  </div>

                )}

              </>

            )}

            {/* =================================================
                ETAPA 2 — TIPO
            ================================================= */}

            {etapaSolicitacao === 'tipo' && (

              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}
                >

                  <button
                    type="button"
                    onClick={voltarEtapa}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--color-primary)',
                      fontSize: '14px'
                    }}
                  >
                    ← Voltar
                  </button>

                  <button
                    type="button"
                    onClick={fecharModal}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: '22px',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    ×
                  </button>

                </div>

                <h2
                  style={{
                    margin: '8px 0 4px',
                    color: 'var(--color-text)'
                  }}
                >
                  {setorSelecionado?.nome}
                </h2>

                <p
                  style={{
                    marginTop: 0,
                    color: 'var(--color-text-muted)'
                  }}
                >
                  O que você deseja solicitar?
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    marginTop: '20px'
                  }}
                >

                  {/* MATERIAL */}

                  <button
                    type="button"
                    onClick={() =>
                      selecionarTipo('material')
                    }
                    style={{
                      textAlign: 'left',
                      background:
                        'var(--color-surface)',
                      border:
                        '1px solid var(--color-border)',
                      borderRadius: '12px',
                      padding: '18px',
                      cursor: 'pointer',
                      boxShadow:
                        'var(--shadow-sm)'
                    }}
                  >

                    <strong
                      style={{
                        display: 'block',
                        color: 'var(--color-text)',
                        marginBottom: '6px'
                      }}
                    >
                      Materiais
                    </strong>

                    <span
                      style={{
                        fontSize: '13px',
                        color:
                          'var(--color-text-muted)'
                      }}
                    >
                      Solicitar produtos e materiais.
                    </span>

                  </button>

                  {/* RESERVA */}

                  <button
                    type="button"
                    onClick={() =>
                      selecionarTipo('reserva')
                    }
                    style={{
                      textAlign: 'left',
                      background:
                        'var(--color-surface)',
                      border:
                        '1px solid var(--color-border)',
                      borderRadius: '12px',
                      padding: '18px',
                      cursor: 'pointer',
                      boxShadow:
                        'var(--shadow-sm)'
                    }}
                  >

                    <strong
                      style={{
                        display: 'block',
                        color: 'var(--color-text)',
                        marginBottom: '6px'
                      }}
                    >
                      Reservas / Eventos
                    </strong>

                    <span
                      style={{
                        fontSize: '13px',
                        color:
                          'var(--color-text-muted)'
                      }}
                    >
                      Solicitar espaços e recursos
                      para eventos.
                    </span>

                  </button>

                  {/* MANUTENÇÃO */}

                  <button
                    type="button"
                    onClick={() =>
                      selecionarTipo('manutencao')
                    }
                    style={{
                      textAlign: 'left',
                      background:
                        'var(--color-surface)',
                      border:
                        '1px solid var(--color-border)',
                      borderRadius: '12px',
                      padding: '18px',
                      cursor: 'pointer',
                      boxShadow:
                        'var(--shadow-sm)'
                    }}
                  >

                    <strong
                      style={{
                        display: 'block',
                        color: 'var(--color-text)',
                        marginBottom: '6px'
                      }}
                    >
                      Manutenção / Infra
                    </strong>

                    <span
                      style={{
                        fontSize: '13px',
                        color:
                          'var(--color-text-muted)'
                      }}
                    >
                      Informar problemas de
                      infraestrutura.
                    </span>

                  </button>

                </div>

              </>

            )}

            {/* =================================================
                ETAPA 3 — FORMULÁRIO
            ================================================= */}

            {etapaSolicitacao === 'formulario' && (

              <>
                {tipoModal === 'material' && (
                  <ModalSolicitacao
                    setorDestinoId={
                      setorSelecionado?.id
                    }
                    setorDestinoNome={
                      setorSelecionado?.nome
                    }
                    onFechar={fecharModal}
                    onVoltar={voltarEtapa}
                    onSalvar={() => {

                      fecharModal()

                      addToast(
                        'Solicitação enviada com sucesso!',
                        'sucesso'
                      )

                      carregarSolicitacoes()
                    }}
                  />
                )}

                {tipoModal === 'reserva' && (

                  <div>
                    <button
                      type="button"
                      onClick={voltarEtapa}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--color-primary)'
                      }}
                    >
                      ← Voltar
                    </button>

                    <h2>
                      Reserva / Evento
                    </h2>

                    <p
                      style={{
                        color:
                          'var(--color-text-muted)'
                      }}
                    >
                      Setor de destino:{' '}
                      <strong>
                        {setorSelecionado?.nome}
                      </strong>
                    </p>

                    <p>
                      O formulário de reserva será
                      disponibilizado aqui.
                    </p>

                    <button
                      type="button"
                      onClick={fecharModal}
                      className={styles.btnLogout}
                    >
                      Fechar
                    </button>
                  </div>

                )}

                {tipoModal === 'manutencao' && (

                  <div>
                    <button
                      type="button"
                      onClick={voltarEtapa}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--color-primary)'
                      }}
                    >
                      ← Voltar
                    </button>

                    <h2>
                      Manutenção / Infra
                    </h2>

                    <p
                      style={{
                        color:
                          'var(--color-text-muted)'
                      }}
                    >
                      Setor de destino:{' '}
                      <strong>
                        {setorSelecionado?.nome}
                      </strong>
                    </p>

                    <p>
                      O formulário de manutenção será
                      disponibilizado aqui.
                    </p>

                    <button
                      type="button"
                      onClick={fecharModal}
                      className={styles.btnLogout}
                    >
                      Fechar
                    </button>
                  </div>

                )}

              </>

            )}

          </div>

        </div>

      )}

    </div>
  )
}

export default Solicitante