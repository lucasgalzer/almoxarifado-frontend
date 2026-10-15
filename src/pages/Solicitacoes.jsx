import { useState, useEffect } from 'react'
import api from '../services/api'
import ModalSolicitacao from '../components/ModalSolicitacao'
import ModalDetalhesSolicitacao from '../components/ModalDetalhesSolicitacao'
import ModalConfirmacao from '../components/ModalConfirmacao'
import { useToast } from '../components/Toast'
import styles from './Solicitacoes.module.css'
import Select from 'react-select'
import reactSelectStyles from '../utils/reactSelectStyles'

function Solicitacoes() {
  const { addToast } = useToast()

  const [solicitacoes, setSolicitacoes] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [carregando, setCarregando] = useState(true)

  const [modalAberto, setModalAberto] = useState(false)
  const [tipoModal, setTipoModal] = useState(null)

  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null)
  const [solicitacaoCancelando, setSolicitacaoCancelando] = useState(null)

  const opcoesStatus = [
    { value: '', label: 'Todos os status' },
    { value: 'pendente', label: 'Pendentes' },
    { value: 'aprovada', label: 'Aprovadas' },
    { value: 'pronta', label: 'Prontas para retirada' },
    { value: 'agendada', label: 'Agendadas' },
    { value: 'em_andamento', label: 'Em andamento' },
    { value: 'entregue', label: 'Entregues' },
    { value: 'concluida', label: 'Concluídas' },
    { value: 'recusada', label: 'Recusadas' },
    { value: 'cancelada', label: 'Canceladas' },
  ]

  const opcoesTipo = [
    { value: '', label: 'Todos os tipos' },
    { value: 'material', label: 'Materiais' },
    { value: 'reserva', label: 'Reservas / Eventos' },
    { value: 'manutencao', label: 'Manutenção / Infra' },
  ]

  useEffect(() => {
    carregarSolicitacoes()
  }, [filtroStatus, filtroTipo])

  async function carregarSolicitacoes() {
    try {
      setCarregando(true)

      const params = {}

      if (filtroStatus) {
        params.status = filtroStatus
      }

      if (filtroTipo) {
        params.tipo = filtroTipo
      }

      const { data } = await api.get('/solicitacoes', { params })

      setSolicitacoes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)

      addToast(
        error.response?.data?.erro || 'Erro ao carregar solicitações',
        'erro'
      )
    } finally {
      setCarregando(false)
    }
  }

  async function handleCancelar() {
    if (!solicitacaoCancelando) return

    try {
      await api.patch(
        `/solicitacoes/${solicitacaoCancelando.id}/status`,
        {
          status: 'cancelada'
        }
      )

      addToast('Solicitação cancelada', 'aviso')

      setSolicitacaoCancelando(null)

      carregarSolicitacoes()
    } catch (error) {
      addToast(
        error.response?.data?.erro || 'Erro ao cancelar',
        'erro'
      )

      setSolicitacaoCancelando(null)
    }
  }

  function abrirNovaSolicitacao(tipo) {
    setTipoModal(tipo)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setTipoModal(null)
  }

  function formatarData(data) {
    if (!data) return '—'

    return new Date(data).toLocaleDateString('pt-BR')
  }

  function formatarDataReserva(data) {
    if (!data) return '—'

    const dataObj = new Date(`${data}T00:00:00`)

    return dataObj.toLocaleDateString('pt-BR')
  }

  function badgeStatus(status) {
    const mapa = {
      pendente: styles.badgePendente,
      aprovada: styles.badgeAprovada,
      pronta: styles.badgePronta,
      agendada: styles.badgeAprovada,
      em_andamento: styles.badgeAprovada,
      entregue: styles.badgeEntregue,
      concluida: styles.badgeEntregue,
      recusada: styles.badgeRecusada,
      cancelada: styles.badgeCancelada,
    }

    return mapa[status] || ''
  }

  function labelStatus(status) {
    const mapa = {
      pendente: 'Pendente',
      aprovada: 'Aprovada',
      pronta: 'Pronta p/ retirada',
      agendada: 'Agendada',
      em_andamento: 'Em andamento',
      entregue: 'Entregue',
      concluida: 'Concluída',
      recusada: 'Recusada',
      cancelada: 'Cancelada',
    }

    return mapa[status] || status
  }

  function labelTipo(tipo) {
    const mapa = {
      material: 'Materiais',
      reserva: 'Reservas / Eventos',
      manutencao: 'Manutenção / Infra',
    }

    return mapa[tipo] || 'Solicitação'
  }

  function iconeTipo(tipo) {
    const mapa = {
      material: '',
      reserva: '',
      manutencao: '',
    }

    return mapa[tipo] || '📋'
  }

  const pendentes = solicitacoes.filter(
    s => s.status === 'pendente'
  ).length

  return (
    <div>
      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>
            Central de Solicitações
          </h1>

          <p className={styles.subtitulo}>
            {solicitacoes.length} solicitações encontradas
          </p>
        </div>
      </div>

      {/* =====================================================
          NOVA SOLICITAÇÃO
      ===================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '24px'
        }}
      >
        <button
          type="button"
          onClick={() => abrirNovaSolicitacao('material')}
          style={{
            textAlign: 'left',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '18px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div
            style={{
              fontSize: '24px',
              marginBottom: '8px'
            }}
          >
            
          </div>

          <strong
            style={{
              display: 'block',
              color: 'var(--color-text)',
              marginBottom: '5px'
            }}
          >
            Materiais
          </strong>

          <span
            style={{
              fontSize: '13px',
              color: 'var(--color-text-muted)'
            }}
          >
            Solicite produtos e materiais do almoxarifado.
          </span>
        </button>

        <button
          type="button"
          onClick={() => abrirNovaSolicitacao('reserva')}
          style={{
            textAlign: 'left',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '18px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div
            style={{
              fontSize: '24px',
              marginBottom: '8px'
            }}
          >
            
          </div>

          <strong
            style={{
              display: 'block',
              color: 'var(--color-text)',
              marginBottom: '5px'
            }}
          >
            Reservas / Eventos
          </strong>

          <span
            style={{
              fontSize: '13px',
              color: 'var(--color-text-muted)'
            }}
          >
            Solicite espaços, recursos e estrutura para eventos.
          </span>
        </button>

        <button
          type="button"
          onClick={() => abrirNovaSolicitacao('manutencao')}
          style={{
            textAlign: 'left',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '18px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div
            style={{
              fontSize: '24px',
              marginBottom: '8px'
            }}
          >
            
          </div>

          <strong
            style={{
              display: 'block',
              color: 'var(--color-text)',
              marginBottom: '5px'
            }}
          >
            Manutenção / Infra
          </strong>

          <span
            style={{
              fontSize: '13px',
              color: 'var(--color-text-muted)'
            }}
          >
            Informe problemas de infraestrutura e instalações.
          </span>
        </button>
      </div>

      {/* =====================================================
          AVISO DE PENDENTES
      ===================================================== */}

      {pendentes > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#d97706',
            fontWeight: '600'
          }}
        >
          {pendentes} solicitação(ões) aguardando sua atenção
        </div>
      )}

      {/* =====================================================
          FILTROS
      ===================================================== */}

      <div
        className={styles.filtros}
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        <Select
          className={styles.reactSelect}
          classNamePrefix="react-select"
          styles={reactSelectStyles}
          isSearchable={false}
          options={opcoesTipo}
          value={
            opcoesTipo.find(
              op => op.value === filtroTipo
            )
          }
          onChange={opcao =>
            setFiltroTipo(opcao?.value || '')
          }
          placeholder="Tipo"
        />

        <Select
          className={styles.reactSelect}
          classNamePrefix="react-select"
          styles={reactSelectStyles}
          isSearchable={false}
          options={opcoesStatus}
          value={
            opcoesStatus.find(
              op => op.value === filtroStatus
            )
          }
          onChange={opcao =>
            setFiltroStatus(opcao?.value || '')
          }
          placeholder="Status"
        />
      </div>

      {/* =====================================================
          LISTA
      ===================================================== */}

      <div className={styles.lista}>
        {carregando ? (
          <div className={styles.vazio}>
            Carregando...
          </div>
        ) : solicitacoes.length === 0 ? (
          <div className={styles.vazio}>
            Nenhuma solicitação encontrada.
          </div>
        ) : (
          solicitacoes.map(sol => (
            <div
              key={sol.id}
              className={styles.card}
            >

              {/* =================================================
                  TOPO
              ================================================= */}

              <div className={styles.cardTopo}>

                <div className={styles.cardInfo}>

                  <span
                    className={`${styles.badge} ${badgeStatus(sol.status)}`}
                  >
                    {labelStatus(sol.status)}
                  </span>

                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    {iconeTipo(sol.tipo)}{' '}
                    {labelTipo(sol.tipo)}
                  </span>

                  <span className={styles.cardData}>
                    Solicitado em {formatarData(sol.created_at)}

                    {sol.tipo === 'material' &&
                      sol.data_desejada &&
                      ` · Desejado para ${formatarData(sol.data_desejada)}`}
                  </span>

                </div>

                <div className={styles.cardAcoes}>

                  <button
                    className={styles.btnDetalhes}
                    onClick={() =>
                      setSolicitacaoSelecionada(sol)
                    }
                  >
                    Ver detalhes
                  </button>

                  {sol.status === 'pendente' && (
                    <button
                      className={styles.btnCancelar}
                      onClick={() =>
                        setSolicitacaoCancelando(sol)
                      }
                    >
                      Cancelar
                    </button>
                  )}

                </div>

              </div>

              {/* =================================================
                  MATERIAL
              ================================================= */}

              {sol.tipo === 'material' && (
                <>
                  {sol.finalidade && (
                    <p className={styles.cardFinalidade}>
                      {sol.finalidade}
                    </p>
                  )}

                  {Array.isArray(sol.itens) &&
                    sol.itens.length > 0 && (
                      <div className={styles.cardItens}>
                        {sol.itens.map(item => (
                          <span
                            key={item.id}
                            className={styles.itemTag}
                          >
                            {item.produto_nome} ×{' '}
                            {item.quantidade_solicitada}{' '}
                            {item.unidade_medida}
                          </span>
                        ))}
                      </div>
                    )}
                </>
              )}

              {/* =================================================
                  RESERVA
              ================================================= */}

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
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      {formatarDataReserva(sol.reserva.data)}
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
                          className={styles.cardItens}
                        >
                          {sol.reserva.recursos.map(
                            recurso => (
                              <span
                                key={recurso.id}
                                className={styles.itemTag}
                              >
                                {recurso.recurso} ×{' '}
                                {recurso.quantidade}
                              </span>
                            )
                          )}
                        </div>
                      )}
                  </div>
                )}

              {/* =================================================
                  MANUTENÇÃO
              ================================================= */}

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
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      Local: {sol.manutencao.local}
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

              {/* =================================================
                  OBSERVAÇÕES
              ================================================= */}

              {sol.observacoes && (
                <p className={styles.cardObs}>
                  {sol.observacoes}
                </p>
              )}

              {/* =================================================
                  RODAPÉ
              ================================================= */}

              <div className={styles.cardRodape}>
                <span>
                  Solicitante:{' '}
                  {sol.solicitante_nome}
                </span>

                {sol.operador_nome && (
                  <span>
                    Operador:{' '}
                    {sol.operador_nome}
                  </span>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* =====================================================
          MODAL DE MATERIAIS
      ===================================================== */}

      {modalAberto &&
        tipoModal === 'material' && (
          <ModalSolicitacao
            onFechar={fecharModal}
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

      {/* =====================================================
          MODAL RESERVA
          Será criado na próxima etapa
      ===================================================== */}

      {modalAberto &&
        tipoModal === 'reserva' && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <div
              style={{
                background: 'var(--color-surface)',
                borderRadius: '12px',
                padding: '24px',
                width: 'min(500px, calc(100vw - 32px))'
              }}
            >
              <h2>
                Reserva / Evento
              </h2>

              <p
                style={{
                  color: 'var(--color-text-muted)'
                }}
              >
                O formulário de reserva será
                disponibilizado aqui.
              </p>

              <button
                type="button"
                onClick={fecharModal}
                className={styles.btnCancelar}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

      {/* =====================================================
          MODAL MANUTENÇÃO
          Será criado na próxima etapa
      ===================================================== */}

      {modalAberto &&
        tipoModal === 'manutencao' && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <div
              style={{
                background: 'var(--color-surface)',
                borderRadius: '12px',
                padding: '24px',
                width: 'min(500px, calc(100vw - 32px))'
              }}
            >
              <h2>
                Manutenção / Infra
              </h2>

              <p
                style={{
                  color: 'var(--color-text-muted)'
                }}
              >
                O formulário de manutenção será
                disponibilizado aqui.
              </p>

              <button
                type="button"
                onClick={fecharModal}
                className={styles.btnCancelar}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

      {/* =====================================================
          DETALHES
      ===================================================== */}

      {solicitacaoSelecionada && (
        <ModalDetalhesSolicitacao
          solicitacao={solicitacaoSelecionada}
          onFechar={() =>
            setSolicitacaoSelecionada(null)
          }
          onAtualizar={() => {
            setSolicitacaoSelecionada(null)

            addToast(
              'Solicitação atualizada!',
              'sucesso'
            )

            carregarSolicitacoes()
          }}
        />
      )}

      {/* =====================================================
          CONFIRMAÇÃO DE CANCELAMENTO
      ===================================================== */}

      {solicitacaoCancelando && (
        <ModalConfirmacao
          titulo="Cancelar solicitação"
          mensagem="Tem certeza que deseja cancelar esta solicitação? Esta ação não pode ser desfeita."
          onConfirmar={handleCancelar}
          onCancelar={() =>
            setSolicitacaoCancelando(null)
          }
          tipo="aviso"
        />
      )}
    </div>
  )
}

export default Solicitacoes