import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuth from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import styles from './SuperAdmin.module.css'
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  KeyRound,
  X,
  Layers
} from 'lucide-react'

function SuperAdmin() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [instituicoes, setInstituicoes] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [modalAberto, setModalAberto] = useState(false)
  const [modalEditando, setModalEditando] = useState(null)

  const [modalPessoas, setModalPessoas] = useState(null)
  const [pessoas, setPessoas] = useState([])
  const [carregandoPessoas, setCarregandoPessoas] = useState(false)

  const [modalImportarCSV, setModalImportarCSV] = useState(false)
  const [arquivoCSV, setArquivoCSV] = useState(null)
  const [senhaTemporaria, setSenhaTemporaria] = useState('')
  const [exigirTrocaSenha, setExigirTrocaSenha] = useState(true)
  const [importandoCSV, setImportandoCSV] = useState(false)
  const [resultadoImportacao, setResultadoImportacao] = useState(null)

  const [modalPessoa, setModalPessoa] = useState(null)
  const [salvandoPessoa, setSalvandoPessoa] = useState(false)

  const [senhaEditando, setSenhaEditando] = useState(null)
  const [novaSenha, setNovaSenha] = useState('')

  const [formPessoa, setFormPessoa] = useState({
    nome_completo: '',
    matricula: '',
    email: '',
    cargo: '',
    telefone: '',
    senha: '',
    ativo: true
  })

  const [modalSetores, setModalSetores] = useState(null)
  const [setores, setSetores] = useState([])
  const [carregandoSetores, setCarregandoSetores] = useState(false)
  const [acessandoSetor, setAcessandoSetor] = useState(false)

  // ============================================================
  // GERENCIAMENTO DE SETORES
  // ============================================================

  const [modalGerenciarSetores, setModalGerenciarSetores] = useState(null)
  const [setoresGerenciamento, setSetoresGerenciamento] = useState([])
  const [carregandoGerenciamentoSetores, setCarregandoGerenciamentoSetores] = useState(false)

  const [modalNovoSetor, setModalNovoSetor] = useState(false)
  const [setorEditando, setSetorEditando] = useState(null)
  const [nomeSetor, setNomeSetor] = useState('')
  const [salvandoSetor, setSalvandoSetor] = useState(false)

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    nome: '',
    email: '',
    cnpj: '',
    telefone: '',
    admin_nome: '',
    admin_email: '',
    admin_senha: ''
  })

  const [formEdit, setFormEdit] = useState({
    nome: '',
    email: '',
    cnpj: '',
    telefone: ''
  })

  // ============================================================
  // CONFIGURAÇÃO DE MENUS E CARDS POR SETOR
  // ============================================================

  const menusDisponiveis = [
    { valor: 'dashboard', nome: 'Dashboard' },
    { valor: 'produtos', nome: 'Produtos' },
    { valor: 'pessoas', nome: 'Pessoas' },
    { valor: 'estoque', nome: 'Estoque' },
    { valor: 'emprestimos', nome: 'Empréstimos' },
    { valor: 'emprestimos-fixos', nome: 'Empréstimos Fixos' },
    { valor: 'solicitacoes', nome: 'Solicitações' },
    { valor: 'manutencao', nome: 'Manutenção' },
    { valor: 'relatorios', nome: 'Relatórios' },
    { valor: 'configuracoes', nome: 'Configurações' },
    { valor: 'usuarios', nome: 'Usuários' }
  ]

  const cardsDisponiveis = [
    { valor: 'produtos', nome: 'Produtos' },
    { valor: 'emprestimos', nome: 'Empréstimos em aberto' },
    { valor: 'manutencao', nome: 'Em manutenção' },
    { valor: 'solicitacoes', nome: 'Solicitações pendentes' }
  ]

  const [setorConfigurando, setSetorConfigurando] = useState(null)
  const [configuracoesSetores, setConfiguracoesSetores] = useState({})

  // ============================================================
  // CARREGAR INSTITUIÇÕES
  // ============================================================

  useEffect(() => {
    carregarInstituicoes()
  }, [])



  async function carregarInstituicoes() {
    try {
      setCarregando(true)

      const { data } = await api.get('/super-admin/instituicoes')

      setInstituicoes(data)
    } catch (error) {
      if (error.response?.status === 403) {
        navigate('/dashboard')
      } else {
        addToast(
          error.response?.data?.erro ||
          'Erro ao carregar instituições',
          'erro'
        )
      }
    } finally {
      setCarregando(false)
    }
  }

  async function toggleAtivo(inst) {
  try {
    await api.patch(
      `/super-admin/instituicoes/${inst.id}/toggle`
    )

    addToast(
      inst.ativo
        ? 'Escola desativada com sucesso'
        : 'Escola reativada com sucesso',
      inst.ativo
        ? 'aviso'
        : 'sucesso'
    )

    await carregarInstituicoes()
  } catch (error) {
    console.error(
      'Erro ao alterar status da escola:',
      error
    )

    addToast(
      error.response?.data?.erro ||
        'Erro ao alterar status da escola',
      'erro'
    )
  }
}

  async function abrirPessoas(inst) {
    try {
      setCarregandoPessoas(true)

      const { data } = await api.get(
        `/super-admin/instituicoes/${inst.id}/pessoas`
      )

      setPessoas(data)
      setModalPessoas(inst)
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error)

      addToast(
        error.response?.data?.erro ||
        'Erro ao carregar pessoas',
        'erro'
      )
    } finally {
      setCarregandoPessoas(false)
    }
  }

  function abrirImportarCSV() {
    setArquivoCSV(null)
    setSenhaTemporaria('')
    setExigirTrocaSenha(true)
    setResultadoImportacao(null)
    setModalImportarCSV(true)
  }

  async function importarCSV(e) {
    e.preventDefault()

    if (!modalPessoas) return

    if (!arquivoCSV) {
      addToast('Selecione um arquivo CSV', 'erro')
      return
    }

    if (!senhaTemporaria || senhaTemporaria.length < 6) {
      addToast(
        'A senha temporária deve ter pelo menos 6 caracteres',
        'erro'
      )
      return
    }

    try {
      setImportandoCSV(true)
      setResultadoImportacao(null)

      const formData = new FormData()
      formData.append('arquivo', arquivoCSV)
      formData.append('senha_temporaria', senhaTemporaria)
      formData.append(
        'exigir_troca_senha',
        exigirTrocaSenha ? 'true' : 'false'
      )

      const { data } = await api.post(
        `/super-admin/instituicoes/${modalPessoas.id}/pessoas/importar-csv`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      setResultadoImportacao(data)

      addToast(
        `Importação concluída: ${data.importadas || 0} pessoa(s) importada(s)`,
        'sucesso'
      )

      await abrirPessoas(modalPessoas)
    } catch (error) {
      console.error('Erro ao importar CSV:', error)

      addToast(
        error.response?.data?.erro ||
        'Erro ao importar pessoas',
        'erro'
      )
    } finally {
      setImportandoCSV(false)
    }
  }

  function abrirNovaPessoa() {
    setModalPessoa('nova')

    setFormPessoa({
      nome_completo: '',
      matricula: '',
      email: '',
      cargo: '',
      telefone: '',
      senha: '',
      ativo: true
    })
  }

  function abrirEditarPessoa(pessoa) {
    setModalPessoa(pessoa)

    setFormPessoa({
      nome_completo: pessoa.nome_completo || '',
      matricula: pessoa.matricula || '',
      email: pessoa.email || '',
      cargo: pessoa.cargo || '',
      telefone: pessoa.telefone || '',
      senha: '',
      ativo: pessoa.ativo ?? true
    })
  }

  function handleChangePessoa(e) {
    const {
      name,
      value,
      type,
      checked
    } = e.target

    setFormPessoa(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : value
    }))
  }

  async function salvarPessoa(e) {
    e.preventDefault()

    if (!formPessoa.nome_completo.trim()) {
      addToast(
        'Nome completo é obrigatório',
        'erro'
      )
      return
    }

    if (
      modalPessoa === 'nova' &&
      (!formPessoa.senha ||
        formPessoa.senha.length < 6)
    ) {
      addToast(
        'A senha deve ter pelo menos 6 caracteres',
        'erro'
      )
      return
    }

    try {
      setSalvandoPessoa(true)

      const dados = {
        nome_completo:
          formPessoa.nome_completo.trim(),

        matricula:
          formPessoa.matricula.trim(),

        email:
          formPessoa.email.trim(),

        cargo:
          formPessoa.cargo.trim(),

        telefone:
          formPessoa.telefone.trim()
      }

      if (modalPessoa === 'nova') {
        dados.senha = formPessoa.senha

        await api.post(
          `/super-admin/instituicoes/${modalPessoas.id}/pessoas`,
          dados
        )
      } else {
        await api.put(
          `/super-admin/instituicoes/${modalPessoas.id}/pessoas/${modalPessoa.id}`,
          dados
        )

        await api.patch(
          `/super-admin/instituicoes/${modalPessoas.id}/pessoas/${modalPessoa.id}/status`,
          {
            ativo: formPessoa.ativo
          }
        )
      }

      addToast(
        modalPessoa === 'nova'
          ? 'Pessoa cadastrada com sucesso'
          : 'Pessoa atualizada com sucesso',
        'sucesso'
      )

      setModalPessoa(null)

      await abrirPessoas(modalPessoas)
    } catch (error) {
      console.error(
        'Erro ao salvar pessoa:',
        error
      )

      addToast(
        error.response?.data?.erro ||
        'Erro ao salvar pessoa',
        'erro'
      )
    } finally {
      setSalvandoPessoa(false)
    }
  }

  async function salvarSenhaPessoa() {
    if (!novaSenha || novaSenha.length < 6) {
      addToast(
        'A senha deve ter pelo menos 6 caracteres',
        'erro'
      )
      return
    }

    try {
      await api.patch(
        `/super-admin/instituicoes/${modalPessoas.id}/pessoas/${senhaEditando.id}/senha`,
        {
          nova_senha: novaSenha
        }
      )

      addToast(
        'Senha atualizada com sucesso',
        'sucesso'
      )

      setSenhaEditando(null)
      setNovaSenha('')
    } catch (error) {
      console.error(
        'Erro ao alterar senha:',
        error
      )

      addToast(
        error.response?.data?.erro ||
        'Erro ao alterar senha',
        'erro'
      )
    }
  }

  async function alterarStatusPessoa(pessoa) {
    try {
      await api.patch(
        `/super-admin/instituicoes/${modalPessoas.id}/pessoas/${pessoa.id}/status`,
        {
          ativo: !pessoa.ativo
        }
      )

      addToast(
        pessoa.ativo
          ? 'Pessoa desativada'
          : 'Pessoa ativada',
        'sucesso'
      )

      await abrirPessoas(modalPessoas)
    } catch (error) {
      console.error(
        'Erro ao alterar status:',
        error
      )

      addToast(
        error.response?.data?.erro ||
        'Erro ao alterar status',
        'erro'
      )
    }
  }

  // ============================================================
  // CRIAR INSTITUIÇÃO
  // ============================================================

  async function handleSubmit(e) {
    e.preventDefault()

    setErro('')
    setSalvando(true)

    try {
      await api.post(
        '/super-admin/instituicoes',
        form
      )

      addToast(
        'Escola criada com sucesso!',
        'sucesso'
      )

      setModalAberto(false)

      setForm({
        nome: '',
        email: '',
        cnpj: '',
        telefone: '',
        admin_nome: '',
        admin_email: '',
        admin_senha: ''
      })

      await carregarInstituicoes()

    } catch (error) {
      setErro(
        error.response?.data?.erro ||
        'Erro ao criar escola'
      )
    } finally {
      setSalvando(false)
    }
  }



  // ============================================================
  // STATUS DA INSTITUIÇÃO
  // ============================================================

  // ============================================================
  // EDITAR INSTITUIÇÃO + CONFIGURAÇÃO DOS SETORES
  // ============================================================

  async function handleEditar(e) {
    e.preventDefault()

    setErro('')
    setSalvando(true)

    try {
      /*
       * A instituição e as configurações são salvas
       * junto com cada setor.
       *
       * Não fazemos mais uma requisição inicial sem setor_id,
       * pois o backend exige setor_id quando estamos configurando
       * menus e cards.
       */

      const setoresInstituicao =
        modalEditando?.setores || []

      const setoresAtivos =
        setoresInstituicao.filter(setor => setor.ativo)

      // --------------------------------------------------------
      // VERIFICAR SE EXISTE PELO MENOS UM SETOR ATIVO
      // --------------------------------------------------------

      if (setoresAtivos.length === 0) {
        // Caso não exista setor ativo, atualiza apenas
        // os dados básicos da instituição.
        await api.put(
          `/super-admin/instituicoes/${modalEditando.id}`,
          {
            ...formEdit
          }
        )
      } else {

        // ------------------------------------------------------
        // SALVAR CADA SETOR
        // ------------------------------------------------------

        for (const setor of setoresAtivos) {

          const configuracao =
            configuracoesSetores[setor.id] || {
              menus: [],
              cards: []
            }

          await api.put(
            `/super-admin/instituicoes/${modalEditando.id}`,
            {
              ...formEdit,

              setor_id: setor.id,

              menus: Array.isArray(configuracao.menus)
                ? configuracao.menus
                : [],

              cards: Array.isArray(configuracao.cards)
                ? configuracao.cards
                : []
            }
          )
        }
      }

      // --------------------------------------------------------
      // SUCESSO
      // --------------------------------------------------------

      addToast(
        'Escola e configurações dos setores salvas com sucesso!',
        'sucesso'
      )

      setModalEditando(null)
      setSetorConfigurando(null)
      setConfiguracoesSetores({})

      await carregarInstituicoes()

    } catch (error) {

      console.error(
        'Erro ao salvar instituição:',
        error.response?.data || error
      )

      setErro(
        error.response?.data?.erro ||
        'Erro ao salvar configurações'
      )

    } finally {
      setSalvando(false)
    }
  }

  // ============================================================
  // ACESSAR ESCOLA
  // ============================================================

  async function acessarEscola(inst) {
    try {
      setModalSetores(inst)
      setSetores([])
      setCarregandoSetores(true)

      const { data } = await api.post(
        `/super-admin/instituicoes/${inst.id}/acessar`
      )

      if (data.selecionar_setor) {
        setSetores(data.setores || [])
      }

    } catch (error) {
      setModalSetores(null)

      addToast(
        error.response?.data?.erro ||
        'Erro ao carregar setores',
        'erro'
      )
    } finally {
      setCarregandoSetores(false)
    }
  }

  async function acessarSetor(setor) {
    if (!modalSetores) {
      return
    }

    try {
      setAcessandoSetor(true)

      const { data } = await api.post(
        `/super-admin/instituicoes/${modalSetores.id}/acessar`,
        {
          setor_id: setor.id
        }
      )

      localStorage.setItem(
        'token_super_admin',
        localStorage.getItem('token')
      )

      localStorage.setItem(
        'token',
        data.token
      )

      localStorage.removeItem('usuario')
      localStorage.removeItem('usuario_super_admin')

      setModalSetores(null)

      navigate('/dashboard')

      addToast(
        `Acessando ${setor.nome}`,
        'sucesso'
      )

    } catch (error) {
      addToast(
        error.response?.data?.erro ||
        'Erro ao acessar setor',
        'erro'
      )
    } finally {
      setAcessandoSetor(false)
    }
  }

  // ============================================================
  // EDITAR ESCOLA
  // ============================================================

  function abrirEditar(inst) {
    setModalEditando(inst)

    setFormEdit({
      nome: inst.nome,
      email: inst.email || '',
      cnpj: inst.cnpj || '',
      telefone: inst.telefone || ''
    })

    const configuracoes = {}

    if (Array.isArray(inst.setores)) {
      inst.setores.forEach(setor => {
        configuracoes[setor.id] = {
          menus: Array.isArray(setor.menus)
            ? [...setor.menus]
            : [],

          cards: Array.isArray(setor.cards)
            ? [...setor.cards]
            : []
        }
      })
    }

    setConfiguracoesSetores(configuracoes)

    const primeiroSetor =
      Array.isArray(inst.setores)
        ? inst.setores.find(
          setor => setor.ativo
        )
        : null

    setSetorConfigurando(
      primeiroSetor || null
    )

    setErro('')
  }

  function selecionarSetorConfiguracao(setor) {
    setSetorConfigurando(setor)
  }

  function toggleMenu(menu) {
    if (!setorConfigurando) {
      return
    }

    setConfiguracoesSetores(prev => {
      const atual =
        prev[setorConfigurando.id] || {
          menus: [],
          cards: []
        }

      const menus =
        atual.menus.includes(menu)
          ? atual.menus.filter(
            item => item !== menu
          )
          : [
            ...atual.menus,
            menu
          ]

      return {
        ...prev,

        [setorConfigurando.id]: {
          ...atual,
          menus
        }
      }
    })
  }

  function toggleCard(card) {
    if (!setorConfigurando) {
      return
    }

    setConfiguracoesSetores(prev => {
      const atual =
        prev[setorConfigurando.id] || {
          menus: [],
          cards: []
        }

      const cards =
        atual.cards.includes(card)
          ? atual.cards.filter(
            item => item !== card
          )
          : [
            ...atual.cards,
            card
          ]

      return {
        ...prev,

        [setorConfigurando.id]: {
          ...atual,
          cards
        }
      }
    })
  }

  // ============================================================
  // CRUD DE SETORES
  // ============================================================

  async function abrirGerenciarSetores(inst) {
    setModalGerenciarSetores(inst)
    setCarregandoGerenciamentoSetores(true)

    try {
      const { data } = await api.get(
        `/super-admin/instituicoes/${inst.id}/setores`
      )

      setSetoresGerenciamento(
        Array.isArray(data)
          ? data
          : []
      )

    } catch (error) {
      addToast(
        error.response?.data?.erro ||
        'Erro ao carregar setores',
        'erro'
      )
    } finally {
      setCarregandoGerenciamentoSetores(false)
    }
  }

  function abrirNovoSetor() {
    setSetorEditando(null)
    setNomeSetor('')
    setModalNovoSetor(true)
  }

  function abrirEditarSetor(setor) {
    setSetorEditando(setor)
    setNomeSetor(setor.nome)
    setModalNovoSetor(true)
  }

  async function salvarSetor(e) {
    e.preventDefault()

    if (!nomeSetor.trim()) {
      addToast(
        'Informe o nome do setor',
        'erro'
      )
      return
    }

    if (!modalGerenciarSetores) {
      return
    }

    setSalvandoSetor(true)

    try {
      if (setorEditando) {
        await api.put(
          `/super-admin/instituicoes/${modalGerenciarSetores.id}/setores/${setorEditando.id}`,
          {
            nome: nomeSetor.trim()
          }
        )

        addToast(
          'Setor atualizado com sucesso!',
          'sucesso'
        )

      } else {
        await api.post(
          `/super-admin/instituicoes/${modalGerenciarSetores.id}/setores`,
          {
            nome: nomeSetor.trim()
          }
        )

        addToast(
          'Setor criado com sucesso!',
          'sucesso'
        )
      }

      setModalNovoSetor(false)
      setSetorEditando(null)
      setNomeSetor('')

      await recarregarSetoresGerenciamento()
      await carregarInstituicoes()

    } catch (error) {
      addToast(
        error.response?.data?.erro ||
        'Erro ao salvar setor',
        'erro'
      )
    } finally {
      setSalvandoSetor(false)
    }
  }

  async function recarregarSetoresGerenciamento() {
    if (!modalGerenciarSetores) {
      return
    }

    const { data } = await api.get(
      `/super-admin/instituicoes/${modalGerenciarSetores.id}/setores`
    )

    setSetoresGerenciamento(
      Array.isArray(data)
        ? data
        : []
    )
  }

  async function alterarStatusSetor(setor) {
    if (!modalGerenciarSetores) {
      return
    }

    try {
      await api.patch(
        `/super-admin/instituicoes/${modalGerenciarSetores.id}/setores/${setor.id}/status`,
        {
          ativo: !setor.ativo
        }
      )

      addToast(
        setor.ativo
          ? 'Setor desativado'
          : 'Setor reativado',
        setor.ativo
          ? 'aviso'
          : 'sucesso'
      )

      await recarregarSetoresGerenciamento()
      await carregarInstituicoes()

    } catch (error) {
      addToast(
        error.response?.data?.erro ||
        'Erro ao alterar status do setor',
        'erro'
      )
    }
  }

  // ============================================================
  // FORMULÁRIOS
  // ============================================================

  function handleChange(e) {
    const {
      name,
      value
    } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  function handleChangeEdit(e) {
    const {
      name,
      value
    } = e.target

    setFormEdit(prev => ({
      ...prev,
      [name]: value
    }))
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  // ============================================================
  // ESTILOS
  // ============================================================

  const labelStyle = {
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#6b6f85',
    textTransform: 'uppercase',
    letterSpacing: '.4px',
    display: 'block',
    marginBottom: '4px'
  }

  const secaoStyle = {
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#12141c',
    textTransform: 'uppercase',
    letterSpacing: '.5px',
    marginTop: '4px'
  }

  function labelPerfil(perfil) {
    const mapa = {
      admin: 'Admin',
      operador: 'Operador',
      solicitante: 'Solicitante'
    }

    return mapa[perfil] || perfil
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.page}>

      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className={styles.header}>
        <div className={styles.headerLogo}>
          <div className={styles.logoIcon}>
            SA
          </div>

          <div>
            <span className={styles.logoTitle}>
              Super Admin
            </span>

            <span className={styles.logoSub}>
              Gestão de escolas
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

      {/* ========================================================
          MAIN
      ======================================================== */}

      <main className={styles.main}>

        <div className={styles.topBar}>
          <div>
            <h1 className={styles.titulo}>
              Escolas cadastradas
            </h1>

            <p className={styles.subtitulo}>
              {instituicoes.length} escola(s)
            </p>
          </div>

          <button
            className={styles.btnNova}
            onClick={() => {
              setModalAberto(true)
              setErro('')
            }}
          >
            + Nova Escola
          </button>
        </div>

        {carregando ? (

          <div className={styles.vazio}>
            Carregando...
          </div>

        ) : instituicoes.length === 0 ? (

          <div className={styles.vazio}>
            Nenhuma escola cadastrada.
          </div>

        ) : (

          <div className={styles.grid}>

            {instituicoes.map(inst => (

              <div
                key={inst.id}
                className={`${styles.card} ${!inst.ativo
                    ? styles.cardInativo
                    : ''
                  }`}
              >

                <div className={styles.cardHeader}>

                  <h3 className={styles.cardNome}>
                    {inst.nome}
                  </h3>

                  <span
                    className={`${styles.badge} ${inst.ativo
                        ? styles.badgeAtivo
                        : styles.badgeInativo
                      }`}
                  >
                    {inst.ativo
                      ? 'Ativa'
                      : 'Inativa'}
                  </span>

                </div>

                <div className={styles.cardInfo}>

                  {inst.email && (
                    <p>
                      <Mail size={13} />
                      {inst.email}
                    </p>
                  )}

                  {inst.telefone && (
                    <p>
                      <Phone size={13} />
                      {inst.telefone}
                    </p>
                  )}

                  {inst.cnpj && (
                    <p>
                      <Building2 size={13} />
                      {inst.cnpj}
                    </p>
                  )}

                  <p>
                    <Calendar size={13} />

                    {new Date(
                      inst.created_at
                    ).toLocaleDateString(
                      'pt-BR'
                    )}
                  </p>

                </div>

               <div className={styles.cardStats}>

  <div className={styles.stat}>
    <span className={styles.statNum}>
      {inst.total_pessoas || 0}
    </span>

    <span className={styles.statLabel}>
      Pessoas
    </span>
  </div>

                  <div className={styles.stat}>
                    <span className={styles.statNum}>
                      {inst.total_produtos}
                    </span>

                    <span className={styles.statLabel}>
                      Produtos
                    </span>
                  </div>

                </div>

                <div className={styles.cardAcoes}>

                  <button
                    onClick={() => abrirEditar(inst)}
                    className={styles.btnEditar}
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => abrirPessoas(inst)}
                    className={styles.btnPessoas}
                  >
                    Pessoas
                  </button>

                  <button
                    onClick={() =>
                      abrirGerenciarSetores(inst)
                    }
                    className={styles.btnUsuarios}
                  >
                    Setores
                  </button>

                  {inst.ativo && (
                    <button
                      onClick={() =>
                        acessarEscola(inst)
                      }
                      className={styles.btnAcessar}
                    >
                      Acessar
                    </button>
                  )}

                  <button
                    onClick={() =>
                      toggleAtivo(inst)
                    }
                    className={
                      inst.ativo
                        ? styles.btnDesativar
                        : styles.btnAtivar
                    }
                  >
                    {inst.ativo
                      ? 'Desativar'
                      : 'Reativar'}
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>

      {/* ========================================================
          MODAL NOVA ESCOLA
      ======================================================== */}

      {modalAberto && (

        <div
          className={styles.overlay}
          onClick={() =>
            setModalAberto(false)
          }
        >

          <div
            className={styles.modal}
            onClick={e =>
              e.stopPropagation()
            }
          >

            <div className={styles.modalHeader}>

              <h2>
                Nova Escola
              </h2>

              <button
                className={styles.btnFechar}
                onClick={() =>
                  setModalAberto(false)
                }
              >
                <X size={15} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className={styles.modalForm}
            >

              {erro && (
                <div className={styles.erro}>
                  {erro}
                </div>
              )}

              <p style={secaoStyle}>
                Dados da escola
              </p>

              <div className={styles.campo}>
                <label style={labelStyle}>
                  Nome da escola *
                </label>

                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Ex: Colégio Teutônia"
                  className={styles.input}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px'
                }}
              >

                <div
                  className={styles.campo}
                  style={{ flex: 1 }}
                >
                  <label style={labelStyle}>
                    E-mail
                  </label>

                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="contato@escola.com"
                    className={styles.input}
                  />
                </div>

                <div
                  className={styles.campo}
                  style={{ flex: 1 }}
                >
                  <label style={labelStyle}>
                    Telefone
                  </label>

                  <input
                    name="telefone"
                    value={form.telefone}
                    onChange={handleChange}
                    placeholder="(51) 99999-9999"
                    className={styles.input}
                  />
                </div>

              </div>

              <div className={styles.campo}>
                <label style={labelStyle}>
                  CNPJ
                </label>

                <input
                  name="cnpj"
                  value={form.cnpj}
                  onChange={handleChange}
                  placeholder="00.000.000/0001-00"
                  className={styles.input}
                />
              </div>




              <div className={styles.modalAcoes}>

                <button
                  type="button"
                  onClick={() =>
                    setModalAberto(false)
                  }
                  className={styles.btnCancelar}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className={styles.btnSalvar}
                >
                  {salvando
                    ? 'Criando...'
                    : 'Criar escola'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}


      {/* ========================================================
          MODAL EDITAR ESCOLA
      ======================================================== */}

      {modalEditando && (

        <div
          className={styles.overlay}
          onClick={() =>
            setModalEditando(null)
          }
        >

          <div
            className={styles.modal}
            onClick={e =>
              e.stopPropagation()
            }
          >

            <div className={styles.modalHeader}>

              <h2>
                Editar Escola
              </h2>

              <button
                className={styles.btnFechar}
                onClick={() =>
                  setModalEditando(null)
                }
              >
                <X size={15} />
              </button>

            </div>

            <form
              onSubmit={handleEditar}
              className={styles.modalForm}
            >

              {erro && (
                <div className={styles.erro}>
                  {erro}
                </div>
              )}

              <div className={styles.campo}>

                <label style={labelStyle}>
                  Nome da escola *
                </label>

                <input
                  name="nome"
                  value={formEdit.nome}
                  onChange={handleChangeEdit}
                  placeholder="Ex: Colégio Teutônia"
                  className={styles.input}
                />

              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px'
                }}
              >

                <div
                  className={styles.campo}
                  style={{ flex: 1 }}
                >

                  <label style={labelStyle}>
                    E-mail
                  </label>

                  <input
                    name="email"
                    value={formEdit.email}
                    onChange={handleChangeEdit}
                    placeholder="contato@escola.com"
                    className={styles.input}
                  />

                </div>

                <div
                  className={styles.campo}
                  style={{ flex: 1 }}
                >

                  <label style={labelStyle}>
                    Telefone
                  </label>

                  <input
                    name="telefone"
                    value={formEdit.telefone}
                    onChange={handleChangeEdit}
                    placeholder="(51) 99999-9999"
                    className={styles.input}
                  />

                </div>

              </div>

              <div className={styles.campo}>

                <label style={labelStyle}>
                  CNPJ
                </label>

                <input
                  name="cnpj"
                  value={formEdit.cnpj}
                  onChange={handleChangeEdit}
                  placeholder="00.000.000/0001-00"
                  className={styles.input}
                />

              </div>

              {/* =================================================
                  CONFIGURAÇÃO POR SETOR
              ================================================= */}

              <div
                className={styles.campo}
                style={{
                  marginTop: '18px'
                }}
              >

                <label style={labelStyle}>
                  Configuração por setor
                </label>

                <select
                  value={
                    setorConfigurando?.id || ''
                  }
                  onChange={e => {

                    const setor =
                      modalEditando?.setores?.find(
                        s =>
                          s.id === e.target.value
                      )

                    if (setor) {
                      selecionarSetorConfiguracao(
                        setor
                      )
                    }

                  }}
                  className={styles.input}
                  style={{
                    marginTop: '6px'
                  }}
                >

                  <option value="">
                    Selecione um setor
                  </option>

                  {(modalEditando?.setores || [])
                    .filter(
                      setor => setor.ativo
                    )
                    .map(setor => (

                      <option
                        key={setor.id}
                        value={setor.id}
                      >
                        {setor.nome}
                      </option>

                    ))}

                </select>

              </div>

              {/* =================================================
                  MENUS
              ================================================= */}

              {setorConfigurando && (

                <div
                  className={styles.campo}
                  style={{
                    marginTop: '18px'
                  }}
                >

                  <label style={labelStyle}>
                    Menus disponíveis —{' '}
                    {setorConfigurando.nome}
                  </label>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '1fr 1fr',
                      gap: '8px',
                      marginTop: '8px'
                    }}
                  >

                    {menusDisponiveis.map(
                      menu => (

                        <label
                          key={menu.valor}
                          style={{
                            display: 'flex',
                            alignItems:
                              'center',
                            gap: '8px',
                            padding:
                              '8px 10px',
                            border:
                              '1px solid #e5e7eb',
                            borderRadius:
                              '8px',
                            cursor:
                              'pointer'
                          }}
                        >

                          <input
                            type="checkbox"
                            checked={
                              (
                                configuracoesSetores[
                                  setorConfigurando.id
                                ]?.menus || []
                              ).includes(
                                menu.valor
                              )
                            }
                            onChange={() =>
                              toggleMenu(
                                menu.valor
                              )
                            }
                          />

                          <span>
                            {menu.nome}
                          </span>

                        </label>

                      )
                    )}

                  </div>

                </div>

              )}

              {/* =================================================
                  CARDS
              ================================================= */}

              {setorConfigurando && (

                <div
                  className={styles.campo}
                  style={{
                    marginTop: '18px'
                  }}
                >

                  <label style={labelStyle}>
                    Cards do Dashboard —{' '}
                    {setorConfigurando.nome}
                  </label>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '1fr 1fr',
                      gap: '8px',
                      marginTop: '8px'
                    }}
                  >

                    {cardsDisponiveis.map(
                      card => (

                        <label
                          key={card.valor}
                          style={{
                            display: 'flex',
                            alignItems:
                              'center',
                            gap: '8px',
                            padding:
                              '8px 10px',
                            border:
                              '1px solid #e5e7eb',
                            borderRadius:
                              '8px',
                            cursor:
                              'pointer'
                          }}
                        >

                          <input
                            type="checkbox"
                            checked={
                              (
                                configuracoesSetores[
                                  setorConfigurando.id
                                ]?.cards || []
                              ).includes(
                                card.valor
                              )
                            }
                            onChange={() =>
                              toggleCard(
                                card.valor
                              )
                            }
                          />

                          <span>
                            {card.nome}
                          </span>

                        </label>

                      )
                    )}

                  </div>

                </div>

              )}

              <div className={styles.modalAcoes}>

                <button
                  type="button"
                  onClick={() =>
                    setModalEditando(null)
                  }
                  className={styles.btnCancelar}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className={styles.btnSalvar}
                >
                  {salvando
                    ? 'Salvando...'
                    : 'Salvar alterações'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ========================================================
          MODAL USUÁRIOS
      ======================================================== */}

      {modalPessoas && (
        <div
          className={styles.modalOverlay}
          onClick={() => setModalPessoas(null)}
        >
          <div
            className={styles.modal}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2>Pessoas</h2>

                <p>
                  {modalPessoas.nome}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalPessoas(null)}
                className={styles.btnFechar}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}
              >
                <div>
                  <strong>
                    {pessoas.length}
                  </strong>{' '}
                  pessoa(s) cadastrada(s)
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}
                >
                  <button
                    type="button"
                    onClick={abrirImportarCSV}
                    className={styles.btnPrimario}
                  >
                    Importar CSV
                  </button>

                  <button
                    type="button"
                    onClick={abrirNovaPessoa}
                    className={styles.btnPrimario}
                  >
                    + Nova pessoa
                  </button>
                </div>
              </div>

              {carregandoPessoas ? (
                <div>
                  Carregando...
                </div>
              ) : pessoas.length === 0 ? (
                <div>
                  Nenhuma pessoa cadastrada.
                </div>
              ) : (
                <div className={styles.tabela}>
                  <table>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Matrícula</th>
                        <th>E-mail</th>
                        <th>Cargo</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pessoas.map(pessoa => (
                        <tr key={pessoa.id}>
                          <td>
                            {pessoa.nome_completo}
                          </td>

                          <td>
                            {pessoa.matricula || '—'}
                          </td>

                          <td>
                            {pessoa.email || '—'}
                          </td>

                          <td>
                            {pessoa.cargo || '—'}
                          </td>

                          <td>
                            <span
                              className={
                                pessoa.ativo
                                  ? styles.badgeAtivo
                                  : styles.badgeInativo
                              }
                            >
                              {pessoa.ativo
                                ? 'Ativo'
                                : 'Inativo'}
                            </span>
                          </td>

                          <td>
                            <div
                              style={{
                                display: 'flex',
                                gap: '8px'
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  abrirEditarPessoa(
                                    pessoa
                                  )
                                }
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSenhaEditando(
                                    pessoa
                                  )
                                  setNovaSenha('')
                                }}
                              >
                                Senha
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  alterarStatusPessoa(
                                    pessoa
                                  )
                                }
                              >
                                {pessoa.ativo
                                  ? 'Desativar'
                                  : 'Ativar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modalImportarCSV && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            if (!importandoCSV) {
              setModalImportarCSV(false)
            }
          }}
        >
          <div
            className={styles.modal}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '560px' }}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2>Importar pessoas via CSV</h2>
                <p>{modalPessoas?.nome}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!importandoCSV) {
                    setModalImportarCSV(false)
                  }
                }}
                className={styles.btnFechar}
                disabled={importandoCSV}
              >
                ×
              </button>
            </div>

            {!resultadoImportacao ? (
              <form
                onSubmit={importarCSV}
                className={styles.modalBody}
              >
                <div className={styles.campo}>
                  <label>Arquivo CSV *</label>

                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={e =>
                      setArquivoCSV(
                        e.target.files?.[0] || null
                      )
                    }
                    disabled={importandoCSV}
                    className={styles.input}
                  />

                  <small>
                    Formato: nome_completo;matricula;email;cargo;telefone
                  </small>

                  {arquivoCSV && (
                    <small
                      style={{
                        display: 'block',
                        marginTop: '6px'
                      }}
                    >
                      Arquivo: <strong>{arquivoCSV.name}</strong>
                    </small>
                  )}
                </div>

                <div className={styles.campo}>
                  <label>Senha temporária *</label>

                  <input
                    type="password"
                    value={senhaTemporaria}
                    onChange={e =>
                      setSenhaTemporaria(e.target.value)
                    }
                    placeholder="Digite a senha temporária"
                    minLength={6}
                    required
                    disabled={importandoCSV}
                    className={styles.input}
                  />

                  <small>
                    Será usada pelas pessoas importadas no primeiro acesso.
                  </small>
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={exigirTrocaSenha}
                    onChange={e =>
                      setExigirTrocaSenha(e.target.checked)
                    }
                    disabled={importandoCSV}
                  />

                  <span>
                    <strong>
                      Exigir troca de senha no primeiro acesso
                    </strong>
                    <small
                      style={{
                        display: 'block',
                        marginTop: '3px',
                        color: '#6b6f85'
                      }}
                    >
                      Recomendado para senhas temporárias.
                    </small>
                  </span>
                </label>

                <div
                  style={{
                    marginTop: '4px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#f7f8fa',
                    border: '1px solid #e8e9ee',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    color: '#5d6175'
                  }}
                >
                  <strong style={{ color: '#12141c' }}>
                    Importante:
                  </strong>{' '}
                  o CSV não deve conter senha nem setor.
                  Os acessos aos setores serão configurados
                  posteriormente em Usuários.
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() => setModalImportarCSV(false)}
                    className={styles.btnCancelar}
                    disabled={importandoCSV}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className={styles.btnPrimario}
                    disabled={importandoCSV}
                  >
                    {importandoCSV
                      ? 'Importando...'
                      : 'Importar pessoas'}
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.modalBody}>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '10px 0 18px'
                  }}
                >
                  <h3
                    style={{
                      margin: '0 0 6px',
                      fontSize: '18px',
                      color: '#12141c'
                    }}
                  >
                    Importação concluída
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: '#6b6f85',
                      fontSize: '13px'
                    }}
                  >
                    O arquivo foi processado.
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px'
                  }}
                >
                  {[
                    ['total', 'Processadas'],
                    ['importadas', 'Importadas'],
                    ['ignoradas', 'Ignoradas']
                  ].map(([campo, label]) => (
                    <div
                      key={campo}
                      style={{
                        padding: '14px',
                        border: '1px solid #e8e9ee',
                        borderRadius: '9px',
                        textAlign: 'center'
                      }}
                    >
                      <strong
                        style={{
                          display: 'block',
                          fontSize: '20px',
                          color: '#12141c'
                        }}
                      >
                        {resultadoImportacao[campo] || 0}
                      </strong>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#6b6f85'
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {Array.isArray(resultadoImportacao.duplicadas) &&
                  resultadoImportacao.duplicadas.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <strong
                        style={{
                          fontSize: '12px',
                          color: '#12141c'
                        }}
                      >
                        Registros duplicados
                      </strong>

                      <div
                        style={{
                          marginTop: '8px',
                          maxHeight: '140px',
                          overflowY: 'auto',
                          border: '1px solid #e8e9ee',
                          borderRadius: '8px'
                        }}
                      >
                        {resultadoImportacao.duplicadas.map(
                          (item, index) => (
                            <div
                              key={index}
                              style={{
                                padding: '8px 10px',
                                borderBottom:
                                  index <
                                  resultadoImportacao.duplicadas.length - 1
                                    ? '1px solid #eee'
                                    : 'none',
                                fontSize: '11px'
                              }}
                            >
                              Linha {item.linha}: {item.nome} — {item.motivo}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {Array.isArray(resultadoImportacao.erros) &&
                  resultadoImportacao.erros.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <strong
                        style={{
                          fontSize: '12px',
                          color: '#12141c'
                        }}
                      >
                        Registros com erro
                      </strong>

                      <div
                        style={{
                          marginTop: '8px',
                          maxHeight: '140px',
                          overflowY: 'auto',
                          border: '1px solid #e8e9ee',
                          borderRadius: '8px'
                        }}
                      >
                        {resultadoImportacao.erros.map(
                          (item, index) => (
                            <div
                              key={index}
                              style={{
                                padding: '8px 10px',
                                borderBottom:
                                  index <
                                  resultadoImportacao.erros.length - 1
                                    ? '1px solid #eee'
                                    : 'none',
                                fontSize: '11px'
                              }}
                            >
                              Linha {item.linha}: {item.motivo}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() => setModalImportarCSV(false)}
                    className={styles.btnPrimario}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {modalPessoa && (
        <div
          className={styles.modalOverlay}
          onClick={() => setModalPessoa(null)}
        >
          <div
            className={styles.modal}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2>
                  {modalPessoa === 'nova'
                    ? 'Nova pessoa'
                    : 'Editar pessoa'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setModalPessoa(null)}
                className={styles.btnFechar}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={salvarPessoa}
              className={styles.modalBody}
            >
              <div className={styles.campo}>
                <label>Nome completo *</label>

                <input
                  type="text"
                  name="nome_completo"
                  value={formPessoa.nome_completo}
                  onChange={handleChangePessoa}
                  required
                />
              </div>

              <div className={styles.grid2}>
                <div className={styles.campo}>
                  <label>Matrícula</label>

                  <input
                    type="text"
                    name="matricula"
                    value={formPessoa.matricula}
                    onChange={handleChangePessoa}
                  />
                </div>

                <div className={styles.campo}>
                  <label>E-mail</label>

                  <input
                    type="email"
                    name="email"
                    value={formPessoa.email}
                    onChange={handleChangePessoa}
                  />
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.campo}>
                  <label>Cargo</label>

                  <input
                    type="text"
                    name="cargo"
                    value={formPessoa.cargo}
                    onChange={handleChangePessoa}
                  />
                </div>

                <div className={styles.campo}>
                  <label>Telefone</label>

                  <input
                    type="text"
                    name="telefone"
                    value={formPessoa.telefone}
                    onChange={handleChangePessoa}
                  />
                </div>
              </div>

              {modalPessoa === 'nova' && (
                <div className={styles.campo}>
                  <label>Senha *</label>

                  <input
                    type="password"
                    name="senha"
                    value={formPessoa.senha}
                    onChange={handleChangePessoa}
                    minLength={6}
                    required
                  />

                  <small>
                    A senha deve possuir pelo menos
                    6 caracteres.
                  </small>
                </div>
              )}

              {modalPessoa !== 'nova' && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={formPessoa.ativo}
                    onChange={handleChangePessoa}
                  />

                  Pessoa ativa
                </label>
              )}

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() =>
                    setModalPessoa(null)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvandoPessoa}
                  className={styles.btnPrimario}
                >
                  {salvandoPessoa
                    ? 'Salvando...'
                    : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {senhaEditando && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setSenhaEditando(null)
            setNovaSenha('')
          }}
        >
          <div
            className={styles.modal}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2>Alterar senha</h2>

                <p>
                  {senhaEditando.nome_completo}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSenhaEditando(null)
                  setNovaSenha('')
                }}
                className={styles.btnFechar}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.campo}>
                <label>Nova senha</label>

                <input
                  type="password"
                  value={novaSenha}
                  onChange={e =>
                    setNovaSenha(e.target.value)
                  }
                  placeholder="Digite a nova senha"
                  minLength={6}
                />

                <small>
                  A senha deve possuir pelo menos
                  6 caracteres.
                </small>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => {
                    setSenhaEditando(null)
                    setNovaSenha('')
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={salvarSenhaPessoa}
                  className={styles.btnPrimario}
                >
                  Salvar senha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================
          MODAL GERENCIAR SETORES
      ======================================================== */}

      {modalGerenciarSetores && (

        <div
          className={styles.overlay}
          onClick={() =>
            setModalGerenciarSetores(null)
          }
        >

          <div
            className={styles.modal}
            style={{
              maxWidth: '620px'
            }}
            onClick={e =>
              e.stopPropagation()
            }
          >

            <div className={styles.modalHeader}>

              <div>

                <h2>
                  Setores
                </h2>

                <p
                  style={{
                    margin:
                      '4px 0 0',
                    fontSize:
                      '12px',
                    color:
                      '#6b6f85'
                  }}
                >
                  {modalGerenciarSetores.nome}
                </p>

              </div>

              <button
                className={
                  styles.btnFechar
                }
                onClick={() =>
                  setModalGerenciarSetores(
                    null
                  )
                }
              >
                <X size={15} />
              </button>

            </div>

            <div
              style={{
                padding:
                  '20px 24px',
                maxHeight:
                  '65vh',
                overflowY:
                  'auto'
              }}
            >

              <div
                style={{
                  display:
                    'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'center',
                  marginBottom:
                    '16px'
                }}
              >

                <div>

                  <strong
                    style={{
                      fontSize:
                        '14px',
                      color:
                        '#12141c'
                    }}
                  >
                    Setores da instituição
                  </strong>

                  <p
                    style={{
                      margin:
                        '3px 0 0',
                      fontSize:
                        '12px',
                      color:
                        '#6b6f85'
                    }}
                  >
                    Gerencie os setores que utilizarão o sistema.
                  </p>

                </div>

                <button
                  className={
                    styles.btnNova
                  }
                  onClick={
                    abrirNovoSetor
                  }
                >
                  + Novo setor
                </button>

              </div>

              {carregandoGerenciamentoSetores ? (

                <div
                  className={
                    styles.vazio
                  }
                >
                  Carregando setores...
                </div>

              ) : setoresGerenciamento.length === 0 ? (

                <div
                  className={
                    styles.vazio
                  }
                >
                  Nenhum setor cadastrado.
                </div>

              ) : (

                <div
                  style={{
                    display:
                      'flex',
                    flexDirection:
                      'column',
                    gap: '10px'
                  }}
                >

                  {setoresGerenciamento.map(
                    setor => (

                      <div
                        key={setor.id}
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'space-between',
                          gap:
                            '12px',
                          padding:
                            '14px 16px',
                          border:
                            '1px solid #e8e9ee',
                          borderRadius:
                            '10px',
                          background:
                            setor.ativo
                              ? '#fff'
                              : '#f8f8fa'
                        }}
                      >

                        <div>

                          <strong
                            style={{
                              display:
                                'block',
                              fontSize:
                                '13.5px',
                              color:
                                '#12141c'
                            }}
                          >
                            {setor.nome}
                          </strong>

                          <span
                            style={{
                              display:
                                'inline-block',
                              marginTop:
                                '5px',
                              padding:
                                '3px 8px',
                              borderRadius:
                                '6px',
                              fontSize:
                                '10px',
                              fontWeight:
                                '600',
                              textTransform:
                                'uppercase',
                              background:
                                setor.ativo
                                  ? '#eefcf3'
                                  : '#fdf2f1',
                              color:
                                setor.ativo
                                  ? '#0f9d58'
                                  : '#c0362c'
                            }}
                          >
                            {setor.ativo
                              ? 'Ativo'
                              : 'Inativo'}
                          </span>

                        </div>

                        <div
                          style={{
                            display:
                              'flex',
                            gap: '7px'
                          }}
                        >

                          <button
                            onClick={() =>
                              abrirEditarSetor(
                                setor
                              )
                            }
                            style={{
                              padding:
                                '7px 12px',
                              border:
                                '1px solid #e1e2e8',
                              borderRadius:
                                '7px',
                              background:
                                '#fff',
                              color:
                                '#4b4f63',
                              fontSize:
                                '12px',
                              fontWeight:
                                '600',
                              cursor:
                                'pointer'
                            }}
                          >
                            Editar
                          </button>

                          <button
                            onClick={() =>
                              alterarStatusSetor(
                                setor
                              )
                            }
                            style={{
                              padding:
                                '7px 12px',
                              border:
                                'none',
                              borderRadius:
                                '7px',
                              background:
                                setor.ativo
                                  ? '#fdf2f1'
                                  : '#eefcf3',
                              color:
                                setor.ativo
                                  ? '#c0362c'
                                  : '#0f9d58',
                              fontSize:
                                '12px',
                              fontWeight:
                                '600',
                              cursor:
                                'pointer'
                            }}
                          >
                            {setor.ativo
                              ? 'Desativar'
                              : 'Reativar'}
                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

            <div
              style={{
                padding:
                  '12px 24px',
                borderTop:
                  '1px solid #e8e9ee'
              }}
            >

              <button
                onClick={() =>
                  setModalGerenciarSetores(
                    null
                  )
                }
                className={
                  styles.btnCancelar
                }
                style={{
                  width:
                    '100%'
                }}
              >
                Fechar
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ========================================================
          MODAL NOVO / EDITAR SETOR
      ======================================================== */}

      {modalNovoSetor && (

        <div
          className={styles.overlay}
          onClick={() => {

            if (!salvandoSetor) {
              setModalNovoSetor(false)
            }

          }}
        >

          <div
            className={styles.modal}
            style={{
              maxWidth:
                '450px'
            }}
            onClick={e =>
              e.stopPropagation()
            }
          >

            <div
              className={
                styles.modalHeader
              }
            >

              <h2>
                {setorEditando
                  ? 'Editar setor'
                  : 'Novo setor'}
              </h2>

              <button
                className={
                  styles.btnFechar
                }
                onClick={() =>
                  setModalNovoSetor(
                    false
                  )
                }
                disabled={
                  salvandoSetor
                }
              >
                <X size={15} />
              </button>

            </div>

            <form
              onSubmit={
                salvarSetor
              }
              className={
                styles.modalForm
              }
            >

              <div
                className={
                  styles.campo
                }
              >

                <label
                  style={
                    labelStyle
                  }
                >
                  Nome do setor *
                </label>

                <input
                  autoFocus
                  value={
                    nomeSetor
                  }
                  onChange={e =>
                    setNomeSetor(
                      e.target.value
                    )
                  }
                  placeholder="Ex: Tecnologia da Informação"
                  className={
                    styles.input
                  }
                />

              </div>

              <div
                className={
                  styles.modalAcoes
                }
              >

                <button
                  type="button"
                  onClick={() =>
                    setModalNovoSetor(
                      false
                    )
                  }
                  className={
                    styles.btnCancelar
                  }
                  disabled={
                    salvandoSetor
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    salvandoSetor
                  }
                  className={
                    styles.btnSalvar
                  }
                >
                  {salvandoSetor
                    ? 'Salvando...'
                    : setorEditando
                      ? 'Salvar alterações'
                      : 'Criar setor'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ========================================================
          MODAL ACESSAR SETOR
      ======================================================== */}

      {modalSetores && (

        <div
          className={styles.overlay}
          onClick={() => {

            if (!acessandoSetor) {
              setModalSetores(
                null
              )
            }

          }}
        >

          <div
            className={styles.modal}
            style={{
              maxWidth:
                '500px'
            }}
            onClick={e =>
              e.stopPropagation()
            }
          >

            <div
              className={
                styles.modalHeader
              }
            >

              <div>

                <h2>
                  Selecionar setor
                </h2>

                <p
                  style={{
                    margin:
                      '4px 0 0',
                    fontSize:
                      '12px',
                    color:
                      '#6b6f85'
                  }}
                >
                  {
                    modalSetores.nome
                  }
                </p>

              </div>

              <button
                className={
                  styles.btnFechar
                }
                onClick={() =>
                  setModalSetores(
                    null
                  )
                }
                disabled={
                  acessandoSetor
                }
              >
                <X size={15} />
              </button>

            </div>

            <div
              style={{
                padding:
                  '20px 24px'
              }}
            >

              <p
                style={{
                  margin:
                    '0 0 14px',
                  fontSize:
                    '13px',
                  color:
                    '#4b4f63'
                }}
              >
                Escolha o setor que deseja acessar:
              </p>

              {carregandoSetores ? (

                <div
                  style={{
                    textAlign:
                      'center',
                    padding:
                      '30px',
                    color:
                      '#6b6f85',
                    fontSize:
                      '13px'
                  }}
                >
                  Carregando setores...
                </div>

              ) : setores.length === 0 ? (

                <div
                  style={{
                    textAlign:
                      'center',
                    padding:
                      '30px',
                    color:
                      '#6b6f85',
                    fontSize:
                      '13px'
                  }}
                >
                  Nenhum setor ativo encontrado.
                </div>

              ) : (

                <div
                  style={{
                    display:
                      'flex',
                    flexDirection:
                      'column',
                    gap:
                      '10px'
                  }}
                >

                  {setores.map(
                    setor => (

                      <button
                        key={
                          setor.id
                        }
                        onClick={() =>
                          acessarSetor(
                            setor
                          )
                        }
                        disabled={
                          acessandoSetor
                        }
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap:
                            '12px',
                          width:
                            '100%',
                          padding:
                            '14px 16px',
                          background:
                            '#fff',
                          border:
                            '1px solid #e5e7eb',
                          borderRadius:
                            '10px',
                          cursor:
                            acessandoSetor
                              ? 'default'
                              : 'pointer',
                          textAlign:
                            'left',
                          transition:
                            'all .15s'
                        }}
                      >

                        <div
                          style={{
                            width:
                              '38px',
                            height:
                              '38px',
                            borderRadius:
                              '9px',
                            background:
                              '#f0efff',
                            color:
                              '#4f46e5',
                            display:
                              'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'center',
                            flexShrink:
                              0
                          }}
                        >
                          <Layers
                            size={18}
                          />
                        </div>

                        <div>

                          <strong
                            style={{
                              display:
                                'block',
                              fontSize:
                                '13.5px',
                              color:
                                '#12141c'
                            }}
                          >
                            {
                              setor.nome
                            }
                          </strong>

                          <span
                            style={{
                              display:
                                'block',
                              marginTop:
                                '2px',
                              fontSize:
                                '11.5px',
                              color:
                                '#6b6f85'
                            }}
                          >
                            Acessar sistema deste setor
                          </span>

                        </div>

                      </button>

                    )
                  )}

                </div>

              )}

            </div>

            <div
              style={{
                padding:
                  '12px 24px',
                borderTop:
                  '1px solid #e8e9ee'
              }}
            >

              <button
                onClick={() =>
                  setModalSetores(
                    null
                  )
                }
                disabled={
                  acessandoSetor
                }
                className={
                  styles.btnCancelar
                }
                style={{
                  width:
                    '100%'
                }}
              >
                Cancelar
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default SuperAdmin