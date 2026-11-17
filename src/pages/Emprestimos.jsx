import React, { useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api'
import { useToast } from '../components/Toast'
import { tocarSom } from '../utils/sons'
import styles from './Emprestimos.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'ativo', label: 'Em aberto' },
  { value: 'parcialmente_devolvido', label: 'Devolução parcial' },
  { value: 'devolvido', label: 'Devolvidos' },
  { value: 'cancelado', label: 'Cancelados' },
]

function formatarData(data) {
  if (!data) return '—'

  const valor = String(data).slice(0, 10)
  const [ano, mes, dia] = valor.split('-')

  if (!ano || !mes || !dia) {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  return `${dia}/${mes}/${ano}`
}

function formatarHora(data) {
  if (!data) return '—'
  const valor = new Date(data)
  if (Number.isNaN(valor.getTime())) return '—'
  return valor.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function obterStatusLabel(status) {
  const mapa = {
    ativo: 'Em aberto',
    parcialmente_devolvido: 'Devolução parcial',
    devolvido: 'Devolvido',
    cancelado: 'Cancelado',
  }

  return mapa[status] || status || '—'
}

function obterStatusItemLabel(status) {
  const mapa = {
    ativo: 'Em aberto',
    parcialmente_devolvido: 'Parcial',
    devolvido: 'Devolvido',
    danificado: 'Danificado',
    perdido: 'Perdido',
    consumido: 'Consumido',
  }

  return mapa[status] || status || '—'
}

function Emprestimos() {
  const { addToast } = useToast()

  const [emprestimos, setEmprestimos] = useState([])
  const [pessoas, setPessoas] = useState([])
  const [produtos, setProdutos] = useState([])

  const [carregando, setCarregando] = useState(true)
  const [carregandoDados, setCarregandoDados] = useState(false)

  const [filtroStatus, setFiltroStatus] = useState('ativo')
  const [filtroPessoa, setFiltroPessoa] = useState('')
  const [busca, setBusca] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 10

  const [emprestimoExpandido, setEmprestimoExpandido] = useState(null)

  const [modalNovo, setModalNovo] = useState(false)
  const [modalDevolucao, setModalDevolucao] = useState(false)
  const [emprestimoSelecionado, setEmprestimoSelecionado] = useState(null)

  const [codigoDevolucao, setCodigoDevolucao] = useState('')
  const [devolvendo, setDevolvendo] = useState(false)
  const [itensCodigoPendentes, setItensCodigoPendentes] = useState([])

  const inputDevolucaoRef = useRef(null)

  const [form, setForm] = useState({
    pessoa_id: '',
    observacoes: '',
  })

  const [buscaPessoa, setBuscaPessoa] = useState('')
  const [mostrarSugestoesPessoa, setMostrarSugestoesPessoa] = useState(false)
  const [indiceSugestaoPessoa, setIndiceSugestaoPessoa] = useState(-1)
  const [codigoProduto, setCodigoProduto] = useState('')
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [quantidadeProduto, setQuantidadeProduto] = useState(1)
  const [itensForm, setItensForm] = useState([])

  const [salvando, setSalvando] = useState(false)
  const [buscandoProduto, setBuscandoProduto] = useState(false)

  const [devolucaoForm, setDevolucaoForm] = useState({
    observacoes: '',
  })

  const [devolucoesItens, setDevolucoesItens] = useState({})

  useEffect(() => {
    carregarDadosIniciais()
  }, [])

  useEffect(() => {
    carregarEmprestimos()
  }, [filtroStatus, filtroPessoa])

  async function carregarDadosIniciais() {
    try {
      setCarregandoDados(true)

      const [pessoasResponse, produtosResponse] =
        await Promise.all([
          api.get('/pessoas', {
            params: {
              ativo: true,
            },
          }),

          api.get('/produtos', {
            params: {
              por_pagina: 'todos',
            },
          }),
        ])

      setPessoas(
        Array.isArray(pessoasResponse.data)
          ? pessoasResponse.data
          : pessoasResponse.data?.dados || []
      )

      setProdutos(
        Array.isArray(produtosResponse.data)
          ? produtosResponse.data
          : produtosResponse.data?.dados || []
      )

    } catch (error) {
      console.error(error)

      addToast(
        error.response?.data?.erro ||
          'Não foi possível carregar os dados dos empréstimos',
        'erro'
      )
    } finally {
      setCarregandoDados(false)
    }
  }

  async function carregarEmprestimos() {
    try {
      setCarregando(true)

      const params = {}

      if (filtroStatus) {
        params.status = filtroStatus
      }

      if (filtroPessoa) {
        params.pessoa_id = filtroPessoa
      }

      const { data } = await api.get('/emprestimos', {
        params,
      })

      setEmprestimos(Array.isArray(data) ? data : data?.dados || [])
    } catch (error) {
      console.error(error)

      addToast(
        error.response?.data?.erro ||
          'Não foi possível carregar os empréstimos',
        'erro'
      )
    } finally {
      setCarregando(false)
    }
  }

  const pessoasOptions = useMemo(() => {
    return pessoas
      .map(pessoa => ({
        value: pessoa.id,
        label: pessoa.nome_completo,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [pessoas])

  const produtosFiltrados = useMemo(() => {
    const buscaNormalizada = codigoProduto.trim().toLowerCase()

    if (!buscaNormalizada) return []

    return produtos
      .filter(produto => {
        const codigo = String(produto.codigo_interno || '').toLowerCase()
        const codigoBarras = String(produto.codigo_barras || produto.codigo_barra || '').toLowerCase()
        const nome = String(produto.nome || '').toLowerCase()

        return (
          codigo.includes(buscaNormalizada) ||
          codigoBarras.includes(buscaNormalizada) ||
          nome.includes(buscaNormalizada)
        )
      })
      .slice(0, 8)
  }, [produtos, codigoProduto])

  const emprestimosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return emprestimos

    return emprestimos.filter(emp => {
      const pessoa = String(emp.pessoa_nome || '').toLowerCase()

      const setor = String(
        emp.pessoa_setor ||
          emp.setor_nome ||
          ''
      ).toLowerCase()

      const itens = Array.isArray(emp.itens)
        ? emp.itens
            .map(item =>
              `${item.produto_nome || ''} ${item.codigo_interno || ''}`
            )
            .join(' ')
            .toLowerCase()
        : ''

      return (
        pessoa.includes(termo) ||
        setor.includes(termo) ||
        itens.includes(termo)
      )
    })
  }, [emprestimos, busca])

  const totalPaginas = Math.max(1, Math.ceil(emprestimosFiltrados.length / itensPorPagina))
  const emprestimosPaginados = emprestimosFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  )
  const primeiroItemPagina = emprestimosFiltrados.length === 0
    ? 0
    : (paginaAtual - 1) * itensPorPagina + 1
  const ultimoItemPagina = Math.min(
    paginaAtual * itensPorPagina,
    emprestimosFiltrados.length
  )

  useEffect(() => {
    setPaginaAtual(1)
    setEmprestimoExpandido(null)
  }, [filtroStatus, filtroPessoa, busca])

  useEffect(() => {
    if (paginaAtual > totalPaginas) setPaginaAtual(totalPaginas)
  }, [paginaAtual, totalPaginas])

  function limparFormulario() {
    setForm({
      pessoa_id: '',
      observacoes: '',
    })

    setBuscaPessoa('')
    setCodigoProduto('')
    setProdutoSelecionado(null)
    setQuantidadeProduto(1)
    setItensForm([])
    setSalvando(false)
  }

  function abrirModalNovo() {
    limparFormulario()
    setModalNovo(true)
  }

  function fecharModalNovo() {
    if (salvando) return

    setModalNovo(false)
    limparFormulario()
  }

  function selecionarProduto(produto) {
    adicionarProduto(produto, 1)
  }

  function removerItemForm(produtoId) {
    setItensForm(prev =>
      prev.filter(item => item.produto_id !== produtoId)
    )
  }

  function adicionarProduto(produtoDireto = null, quantidadeDireta = null) {
    const produto = produtoDireto || produtoSelecionado

    if (!produto) {
      addToast('Selecione um produto primeiro', 'erro')
      return
    }

    if (produto.status !== 'disponivel') {
      addToast(
        `O produto está ${produto.status}`,
        'erro'
      )
      return
    }

    const tipoControle = String(
      produto.categoria_tipo_controle ||
      produto.tipo_controle ||
      'quantidade'
    ).trim().toLowerCase()

    // A categoria define o controle: individual bloqueia duplicidade;
    // quantidade permite somar unidades do estoque, inclusive reutilizáveis.
    const individual = tipoControle === 'individual'

    const quantidade = individual
      ? 1
      : Number(quantidadeDireta ?? quantidadeProduto)

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      addToast('Informe uma quantidade válida', 'erro')
      return
    }

    if (
      !individual &&
      Number(produto.quantidade_atual || 0) < quantidade
    ) {
      addToast(
        `Estoque insuficiente. Disponível: ${produto.quantidade_atual || 0}`,
        'erro'
      )
      return
    }

    const existente = itensForm.find(
      item => item.produto_id === produto.id
    )

    if (existente) {
      if (individual) {
        addToast('Este equipamento já foi adicionado', 'erro')
        return
      }

      setItensForm(prev =>
        prev.map(item =>
          item.produto_id === produto.id
            ? {
                ...item,
                quantidade: item.quantidade + quantidade,
              }
            : item
        )
      )
    } else {
      setItensForm(prev => [
        ...prev,
        {
          produto_id: produto.id,
          produto_nome: produto.nome,
          codigo_interno: produto.codigo_interno,
          quantidade,
          individual,
        },
      ])
    }

    // Toca o áudio de confirmação após adicionar ou incrementar o produto.
    tocarSom('emprestimo')

    setProdutoSelecionado(null)
    setCodigoProduto('')
    setQuantidadeProduto(1)
    if (produtoDireto) {
      addToast(`${produto.nome} adicionado ao empréstimo`, 'sucesso')
    }
  }

  async function buscarProdutoPorCodigo() {
    const codigo = codigoProduto.trim()

    if (!codigo || buscandoProduto) return

    const encontrado = produtos.find(
      produto =>
        [
          produto.codigo_interno,
          produto.codigo_barras,
          produto.codigo_barra,
        ].some(valor => String(valor || '').toLowerCase() === codigo.toLowerCase())
    )

    if (!encontrado) {
      addToast(`Produto "${codigo}" não encontrado`, 'erro')
      return
    }

    adicionarProduto(encontrado, 1)
  }

  async function salvarEmprestimo(event) {
    event.preventDefault()

    if (salvando) return

    if (!form.pessoa_id) {
      addToast('Selecione a pessoa que receberá o empréstimo', 'erro')
      return
    }

    if (itensForm.length === 0) {
      addToast('Adicione pelo menos um produto', 'erro')
      return
    }

    setSalvando(true)

    try {
      const payload = {
        pessoa_id: form.pessoa_id,
        observacoes: form.observacoes || null,

        itens: itensForm.map(item => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
        })),
      }

      const { data } = await api.post(
        '/emprestimos',
        payload
      )

      addToast(
        data?.mensagem ||
          'Empréstimo registrado com sucesso',
        'sucesso'
      )

      tocarSom('sucesso')

      setModalNovo(false)
      limparFormulario()

      await carregarEmprestimos()
    } catch (error) {
      console.error(error)

      addToast(
        error.response?.data?.erro ||
          'Não foi possível registrar o empréstimo',
        'erro'
      )
    } finally {
      setSalvando(false)
    }
  }

  async function handleDevolverPorCodigo(event) {
    event.preventDefault()

    const codigo = codigoDevolucao.trim()

    if (!codigo || devolvendo) return

    setDevolvendo(true)

    try {
      const normalizar = valor => String(valor || '').trim().toLowerCase()
      const produto = produtos.find(item =>
        [
          item.codigo_interno,
          item.codigo_barras,
          item.codigo_barra,
        ].some(valor => normalizar(valor) === normalizar(codigo))
      )

      if (!produto) {
        addToast(`Produto "${codigo}" não encontrado`, 'erro')
        return
      }

      const tipoControle = String(
        produto.categoria_tipo_controle ||
        produto.tipo_controle ||
        'quantidade'
      ).trim().toLowerCase()

      // Equipamentos individuais continuam sendo identificados diretamente
      // pelo código físico no backend.
      if (tipoControle === 'individual') {
        const { data } = await api.post(
          `/emprestimos/devolver/codigo/${encodeURIComponent(produto.codigo_interno || codigo)}`
        )

        tocarSom('devolucao')
        addToast(
          `${data.mensagem || 'Produto devolvido'}${data.pessoa ? ` — ${data.pessoa}` : ''}`,
          'sucesso'
        )
        setCodigoDevolucao('')
        await carregarEmprestimos()
        return
      }

      // Para controle por quantidade, busca os empréstimos abertos e
      // identifica o item_id exato que deve receber a devolução.
      const { data: dadosEmprestimos } = await api.get('/emprestimos')
      const listaEmprestimos = Array.isArray(dadosEmprestimos)
        ? dadosEmprestimos
        : dadosEmprestimos?.dados || []

      const candidatos = listaEmprestimos.flatMap(emprestimo => {
        if (!['ativo', 'parcialmente_devolvido'].includes(emprestimo.status)) {
          return []
        }

        return (Array.isArray(emprestimo.itens) ? emprestimo.itens : [])
          .filter(item =>
            String(item.produto_id) === String(produto.id) &&
            Number(item.quantidade || 0) - Number(item.quantidade_devolvida || 0) > 0
          )
          .map(item => ({
            emprestimoId: emprestimo.id,
            pessoaNome: emprestimo.pessoa_nome || 'Pessoa não identificada',
            item,
          }))
      })

      if (candidatos.length === 0) {
        addToast(`Não há empréstimo em aberto para "${produto.nome}"`, 'erro')
        return
      }

      if (candidatos.length > 1) {
        setItensCodigoPendentes(candidatos)
        setCodigoDevolucao('')
        return
      }

      await registrarDevolucaoPorCodigo(candidatos[0])
    } catch (error) {
      console.error(error)
      addToast(
        error.response?.data?.erro || 'Não foi possível realizar a devolução',
        'erro'
      )
    } finally {
      setDevolvendo(false)
      setTimeout(() => inputDevolucaoRef.current?.focus(), 100)
    }
  }

  async function registrarDevolucaoPorCodigo(candidato) {
    if (!candidato?.emprestimoId || !candidato?.item?.id) return

    setDevolvendo(true)

    try {
      const { data } = await api.post(
        `/emprestimos/${candidato.emprestimoId}/devolver`,
        {
          item_id: candidato.item.id,
          quantidade: 1,
          condicao: 'normal',
        }
      )

      tocarSom('devolucao')
      addToast(
        `${data?.mensagem || 'Devolução registrada'} — ${candidato.pessoaNome}`,
        'sucesso'
      )
      setItensCodigoPendentes([])
      setCodigoDevolucao('')
      await carregarEmprestimos()
    } catch (error) {
      console.error(error)
      addToast(
        error.response?.data?.erro || 'Não foi possível realizar a devolução',
        'erro'
      )
    } finally {
      setDevolvendo(false)
      setTimeout(() => inputDevolucaoRef.current?.focus(), 100)
    }
  }


  function abrirDevolucao(emprestimo) {
    setEmprestimoSelecionado(emprestimo)

    const valores = {}

    if (Array.isArray(emprestimo.itens)) {
      emprestimo.itens.forEach(item => {
        const restante =
          Number(item.quantidade || 0) -
          Number(item.quantidade_devolvida || 0)

        valores[item.id] = Math.max(restante, 0)
      })
    }

    setDevolucoesItens(valores)

    setDevolucaoForm({
      observacoes: '',
    })

    setModalDevolucao(true)
  }

  function fecharDevolucao() {
    if (devolvendo) return

    setModalDevolucao(false)
    setEmprestimoSelecionado(null)
    setDevolucoesItens({})
    setDevolucaoForm({
      observacoes: '',
    })
  }

  function alterarQuantidadeDevolucao(item, valor) {
    const restante =
      Number(item.quantidade || 0) -
      Number(item.quantidade_devolvida || 0)

    let quantidade = Number(valor)

    if (Number.isNaN(quantidade)) {
      quantidade = 0
    }

    quantidade = Math.max(
      0,
      Math.min(restante, quantidade)
    )

    setDevolucoesItens(prev => ({
      ...prev,
      [item.id]: quantidade,
    }))
  }

  async function confirmarDevolucao() {
    if (!emprestimoSelecionado || devolvendo) return

    const itens = Array.isArray(
      emprestimoSelecionado.itens
    )
      ? emprestimoSelecionado.itens
      : []

    const itensParaDevolver = itens
      .map(item => ({
        item_id: item.id,
        quantidade: Number(
          devolucoesItens[item.id] || 0
        ),
      }))
      .filter(item => item.quantidade > 0)

    if (itensParaDevolver.length === 0) {
      addToast(
        'Informe pelo menos uma quantidade para devolver',
        'erro'
      )
      return
    }

    setDevolvendo(true)

    try {
      const resultados = []

      for (const item of itensParaDevolver) {
        const quantidade =
          item.quantidade

        const response = await api.post(
          `/emprestimos/${emprestimoSelecionado.id}/devolver`,
          {
            item_id: item.item_id,
            quantidade,
            condicao: 'normal',
            observacoes:
              devolucaoForm.observacoes || null,
          }
        )

        resultados.push(response.data)
      }

      tocarSom('devolucao')

      addToast(
        'Devolução registrada com sucesso',
        'sucesso'
      )

      fecharDevolucao()

      await carregarEmprestimos()
    } catch (error) {
      console.error(error)

      addToast(
        error.response?.data?.erro ||
          'Não foi possível registrar a devolução',
        'erro'
      )
    } finally {
      setDevolvendo(false)
    }
  }

  async function registrarCondicaoItem(
    item,
    condicao
  ) {
    if (!emprestimoSelecionado || devolvendo) {
      return
    }

    const restante =
      Number(item.quantidade || 0) -
      Number(item.quantidade_devolvida || 0)

    if (restante <= 0) {
      addToast(
        'Este item já foi totalmente devolvido',
        'erro'
      )
      return
    }

    setDevolvendo(true)

    try {
      const { data } = await api.post(
        `/emprestimos/${emprestimoSelecionado.id}/devolver`,
        {
          item_id: item.id,
          quantidade: 1,
          condicao,
          observacoes:
            devolucaoForm.observacoes || null,
        }
      )

      addToast(
        data?.mensagem ||
          'Devolução registrada com sucesso',
        'sucesso'
      )

      tocarSom('devolucao')

      fecharDevolucao()
      await carregarEmprestimos()
    } catch (error) {
      console.error(error)

      addToast(
        error.response?.data?.erro ||
          'Não foi possível registrar a devolução',
        'erro'
      )
    } finally {
      setDevolvendo(false)
    }
  }

  async function devolverEmprestimoCompleto(emprestimo) {
    if (!emprestimo || devolvendo) return

    const itensPendentes = (Array.isArray(emprestimo.itens) ? emprestimo.itens : [])
      .map(item => ({
        item_id: item.id,
        quantidade: obterQuantidadeRestante(item),
        produto_nome: item.produto_nome || 'Produto',
      }))
      .filter(item => item.quantidade > 0)

    if (itensPendentes.length === 0) {
      addToast('Este empréstimo não possui itens pendentes de devolução', 'erro')
      return
    }

    const resumo = itensPendentes
      .map(item => `• ${item.produto_nome}: ${item.quantidade}`)
      .join('\\n')

    const confirmar = window.confirm(
      `Confirmar a devolução de todos os itens do empréstimo de ${emprestimo.pessoa_nome || 'esta pessoa'}?\\n\\n${resumo}`
    )

    if (!confirmar) return

    setDevolvendo(true)
    let processados = 0

    try {
      for (const item of itensPendentes) {
        await api.post(`/emprestimos/${emprestimo.id}/devolver`, {
          item_id: item.item_id,
          quantidade: item.quantidade,
          condicao: 'normal',
          observacoes: 'Devolução total do empréstimo',
        })
        processados += 1
      }

      tocarSom('devolucao')
      addToast('Todos os itens foram devolvidos com sucesso', 'sucesso')
      setEmprestimoExpandido(null)
      await carregarEmprestimos()
    } catch (error) {
      console.error(error)
      addToast(
        processados > 0
          ? `Devolução parcialmente registrada (${processados} de ${itensPendentes.length} itens). Atualize a lista e confira os detalhes.`
          : error.response?.data?.erro || 'Não foi possível devolver o empréstimo',
        'erro'
      )
      await carregarEmprestimos()
    } finally {
      setDevolvendo(false)
    }
  }

  async function cancelarEmprestimo(emprestimo) {
    if (!emprestimo) return

    const confirmar = window.confirm(
      `Deseja realmente cancelar o empréstimo de ${emprestimo.pessoa_nome || 'esta pessoa'}?`
    )

    if (!confirmar) return

    try {
      const { data } = await api.patch(
        `/emprestimos/${emprestimo.id}/cancelar`
      )

      addToast(
        data?.mensagem ||
          'Empréstimo cancelado com sucesso',
        'sucesso'
      )

      await carregarEmprestimos()
    } catch (error) {
      console.error(error)

      addToast(
        error.response?.data?.erro ||
          'Não foi possível cancelar o empréstimo',
        'erro'
      )
    }
  }

  function obterQuantidadeRestante(item) {
    return Math.max(
      Number(item.quantidade || 0) -
        Number(item.quantidade_devolvida || 0),
      0
    )
  }

  function obterQuantidadeTotalItens(emprestimo) {
    if (!Array.isArray(emprestimo.itens)) {
      return emprestimo.quantidade_itens || 0
    }

    return emprestimo.itens.reduce(
      (total, item) =>
        total + Number(item.quantidade || 0),
      0
    )
  }

  function obterQuantidadeAberta(emprestimo) {
    if (!Array.isArray(emprestimo.itens)) {
      return emprestimo.quantidade_itens || 0
    }

    return emprestimo.itens.reduce(
      (total, item) =>
        total + obterQuantidadeRestante(item),
      0
    )
  }

  function produtoEhIndividual(item) {
    return (
      item.individual === true ||
      item.tipo_controle === 'individual' ||
      item.categoria_tipo_controle === 'individual'
    )
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.acoesRapidas}>
        <form onSubmit={handleDevolverPorCodigo} className={styles.formDevolucao}>
          <input
            ref={inputDevolucaoRef}
            value={codigoDevolucao}
            onChange={event => setCodigoDevolucao(event.target.value)}
            placeholder="Leia o código de barras para devolver o item..."
            className={styles.inputCodigo}
            disabled={devolvendo}
          />

        </form>
        <button type="button" className={styles.btnNovo} onClick={abrirModalNovo}>
          Inserir empréstimo
        </button>
      </div>

      <section className={styles.painelLista}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.titulo}>Empréstimos pendentes</h1>
            <p className={styles.subtitulo}>
              {emprestimosFiltrados.length} empréstimo(s) encontrado(s)
              <span className={styles.dicaTabela}>Clique sobre um empréstimo para abrir os detalhes.</span>
            </p>
          </div>
        </div>

      <div className={styles.filtros}>
        <select
          value={filtroStatus}
          onChange={event =>
            setFiltroStatus(event.target.value)
          }
          className={styles.select}
        >
          {STATUS_OPTIONS.map(option => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={filtroPessoa}
          onChange={event =>
            setFiltroPessoa(event.target.value)
          }
          className={styles.select}
        >
          <option value="">
            Todas as pessoas
          </option>

          {pessoasOptions.map(option => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <input
          value={busca}
          onChange={event =>
            setBusca(event.target.value)
          }
          placeholder="Pesquisar pessoa, setor ou produto..."
          className={styles.inputBusca}
        />
      </div>

      <div className={styles.tabela}>
        {carregando ? (
          <div className={styles.vazio}>
            Carregando empréstimos...
          </div>
        ) : emprestimosFiltrados.length === 0 ? (
          <div className={styles.vazio}>
            Nenhum empréstimo encontrado.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Solicitante</th>
                <th>Equipamentos</th>
                <th>Horário</th>
                <th>Data</th>
                <th>Autorizante</th>
              </tr>
            </thead>

            <tbody>
              {emprestimosPaginados.map(emprestimo => {
                const expandido =
                  emprestimoExpandido ===
                  emprestimo.id

                const quantidadeTotal =
                  obterQuantidadeTotalItens(
                    emprestimo
                  )

                const quantidadeAberta =
                  obterQuantidadeAberta(
                    emprestimo
                  )

                return (
                  <React.Fragment
                    key={emprestimo.id}
                  >
                    <tr
                      className={
                        expandido
                          ? `${styles.linhaEmprestimo} ${styles.linhaExpandida}`
                          : styles.linhaEmprestimo
                      }
                      onClick={() =>
                        setEmprestimoExpandido(
                          expandido ? null : emprestimo.id
                        )
                      }
                      title="Clique para abrir os detalhes do empréstimo"
                    >
                      <td>
                        <strong>
                          {emprestimo.pessoa_nome ||
                            '—'}
                        </strong>

                        <small>
                          {emprestimo.pessoa_setor ||
                            emprestimo.setor_nome ||
                            ''}
                        </small>
                      </td>

                      <td>
                        <span className={styles.equipamentosResumo}>
                          {Array.isArray(emprestimo.itens) && emprestimo.itens.length > 0
                            ? emprestimo.itens.map(item =>
                                `${item.produto_nome || 'Produto'} (${Number(item.quantidade || 0)})`
                              ).join(' & ')
                            : 'Nenhum equipamento informado'}
                        </span>
                      </td>

                      <td>{formatarHora(emprestimo.created_at)}</td>
                      <td>{formatarData(emprestimo.created_at)}</td>
                      <td>{emprestimo.operador_nome || emprestimo.autorizante_nome || '—'}</td>
                    </tr>

                    {expandido && (
                      <tr>
                        <td
                          colSpan="5"
                          className={
                            styles.linhaDetalhes
                          }
                        >
                          <div
                            className={
                              styles.detalhes
                            }
                          >
                            <div
                              className={
                                styles.detalhesCabecalho
                              }
                            >
                              <div>
                                <strong>
                                  Itens do empréstimo
                                </strong>

                                <span>
                                  {quantidadeTotal}{' '}
                                  unidade(s)
                                </span>
                              </div>

                              {emprestimo.observacoes && (
                                <p>
                                  <strong>Observações:</strong>{' '}
                                  {emprestimo.observacoes}
                                </p>
                              )}
                              {(emprestimo.status === 'ativo' ||
                                emprestimo.status === 'parcialmente_devolvido') && (
                                <button
                                  type="button"
                                  className={styles.btnDevolverTodos}
                                  disabled={devolvendo}
                                  onClick={() => devolverEmprestimoCompleto(emprestimo)}
                                >
                                  {devolvendo ? 'Processando devolução...' : 'Devolver todo o empréstimo agora'}
                                </button>
                              )}
                            </div>

                            <div
                              className={
                                styles.itensGrid
                              }
                            >
                              {Array.isArray(
                                emprestimo.itens
                              ) &&
                                emprestimo.itens.map(
                                  item => {
                                    const restante =
                                      obterQuantidadeRestante(
                                        item
                                      )

                                    return (
                                      <div
                                        key={item.id}
                                        className={
                                          styles.itemCard
                                        }
                                      >
                                        <strong>
                                          {
                                            item.produto_nome
                                          }
                                        </strong>

                                        <span>
                                          Código:{' '}
                                          {
                                            item.codigo_interno
                                          }
                                        </span>

                                        <span>
                                          Quantidade:{' '}
                                          {
                                            item.quantidade
                                          }
                                        </span>

                                        <span>
                                          Devolvida:{' '}
                                          {
                                            item.quantidade_devolvida ||
                                            0
                                          }
                                        </span>

                                        <span>
                                          Restante:{' '}
                                          {restante}
                                        </span>

                                        <span
                                          className={`${styles.badgeItem} ${
                                            styles[
                                              `item_${item.item_status ||
                                                item.status}`
                                            ] || ''
                                          }`}
                                        >
                                          {obterStatusItemLabel(
                                            item.item_status ||
                                              item.status
                                          )}
                                        </span>
                                      </div>
                                    )
                                  }
                                )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {!carregando && emprestimosFiltrados.length > 0 && (
        <div className={styles.paginacao}>
          <span className={styles.infoPaginacao}>
            Mostrando {primeiroItemPagina}–{ultimoItemPagina} de {emprestimosFiltrados.length} empréstimos
          </span>
          <div className={styles.controlesPaginacao}>
            <button
              type="button"
              className={styles.btnPagina}
              onClick={() => setPaginaAtual(pagina => Math.max(1, pagina - 1))}
              disabled={paginaAtual === 1}
            >
              Anterior
            </button>
            <span className={styles.numeroPagina}>
              Página {paginaAtual} de {totalPaginas}
            </span>
            <button
              type="button"
              className={styles.btnPagina}
              onClick={() => setPaginaAtual(pagina => Math.min(totalPaginas, pagina + 1))}
              disabled={paginaAtual === totalPaginas}
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      </section>

      {modalNovo && (
        <div className={styles.overlay} data-modal-open="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Novo empréstimo</h2>
                <p>
                  Registre a retirada de equipamentos
                  ou materiais.
                </p>
              </div>

              <button
                type="button"
                className={styles.btnFechar}
                onClick={fecharModalNovo}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={salvarEmprestimo}
              className={styles.modalBody}
            >
              <label className={styles.campoPessoa}>
                Pessoa
                <div className={styles.autocompletePessoa}>
                  <input
                    type="text"
                    value={buscaPessoa || pessoasOptions.find(pessoa => String(pessoa.value) === String(form.pessoa_id))?.label || ''}
                    onFocus={() => {
                      setIndiceSugestaoPessoa(-1)
                      setMostrarSugestoesPessoa(true)
                    }}
                    onChange={event => {
                      const valor = event.target.value
                      setBuscaPessoa(valor)
                      setIndiceSugestaoPessoa(-1)
                      setMostrarSugestoesPessoa(true)
                      setForm(prev => ({ ...prev, pessoa_id: '' }))
                    }}
                    onKeyDown={event => {
                      const opcoes = pessoasOptions
                        .filter(pessoa => pessoa.label.toLowerCase().includes(buscaPessoa.trim().toLowerCase()))
                        .slice(0, 100)

                      if (event.key === 'ArrowDown' && mostrarSugestoesPessoa && opcoes.length > 0) {
                        event.preventDefault()
                        setIndiceSugestaoPessoa(indice => indice < 0 ? 0 : (indice + 1) % opcoes.length)
                      } else if (event.key === 'ArrowUp' && mostrarSugestoesPessoa && opcoes.length > 0) {
                        event.preventDefault()
                        setIndiceSugestaoPessoa(indice => indice <= 0 ? opcoes.length - 1 : indice - 1)
                      } else if (event.key === 'Enter' && mostrarSugestoesPessoa && opcoes.length > 0) {
                        event.preventDefault()
                        const pessoa = opcoes[indiceSugestaoPessoa < 0 ? 0 : Math.min(indiceSugestaoPessoa, opcoes.length - 1)]
                        setForm(prev => ({ ...prev, pessoa_id: String(pessoa.value) }))
                        setBuscaPessoa(pessoa.label)
                        setMostrarSugestoesPessoa(false)
                        setIndiceSugestaoPessoa(0)
                      } else if (event.key === 'Escape') {
                        setMostrarSugestoesPessoa(false)
                      }
                    }}
                    placeholder="Pesquise pelo nome da pessoa..."
                    autoComplete="off"
                    required
                  />
                  {mostrarSugestoesPessoa && (
                    <div className={styles.listaSugestoesPessoa}>
                      {pessoasOptions
                        .filter(pessoa => pessoa.label.toLowerCase().includes(buscaPessoa.trim().toLowerCase()))
                        .slice(0, 100)
                        .map((pessoa, indice) => (
                          <button
                            type="button"
                            key={pessoa.value}
                            className={styles.opcaoPessoa}
                            aria-selected={indice === indiceSugestaoPessoa}
                            onMouseDown={event => event.preventDefault()}
                            onMouseEnter={() => setIndiceSugestaoPessoa(indice)}
                            onClick={() => {
                              setForm(prev => ({ ...prev, pessoa_id: String(pessoa.value) }))
                              setBuscaPessoa(pessoa.label)
                              setMostrarSugestoesPessoa(false)
                              setIndiceSugestaoPessoa(0)
                            }}
                          >
                            {pessoa.label}
                          </button>
                        ))}
                      {pessoasOptions.filter(pessoa => pessoa.label.toLowerCase().includes(buscaPessoa.trim().toLowerCase())).length === 0 && (
                        <div className={styles.semSugestoesPessoa}>Nenhuma pessoa encontrada.</div>
                      )}
                    </div>
                  )}
                </div>
              </label>

              <div className={styles.secaoProduto}>
                <div className={styles.secaoTitulo}>
                  <strong>
                    Produtos / equipamentos
                  </strong>

                  <span>
                    Pesquise pelo nome, código interno ou código de barras.
                  </span>
                </div>

                <div
                  className={
                    styles.buscaProduto
                  }
                >
                  <input
                    value={codigoProduto}
                    onChange={event =>
                      setCodigoProduto(
                        event.target.value
                      )
                    }
                    onKeyDown={event => {
                      if (
                        event.key === 'Enter'
                      ) {
                        event.preventDefault()
                        buscarProdutoPorCodigo()
                      }
                    }}
                    placeholder="Nome, código interno ou código de barras..."
                    disabled={buscandoProduto}
                  />

                </div>

                {produtosFiltrados.length > 0 &&
                  !produtoSelecionado && (
                    <div
                      className={
                        styles.sugestoesProdutos
                      }
                    >
                      {produtosFiltrados.map(
                        produto => (
                          <button
                            type="button"
                            key={produto.id}
                            onClick={() =>
                              selecionarProduto(
                                produto
                              )
                            }
                          >
                            <strong>
                              {produto.nome}
                            </strong>

                            <span>
                              {
                                produto.codigo_interno
                              }
                              {' — '}
                              {produto.status}
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  )}

                {itensForm.length > 0 && (
                  <div
                    className={
                      styles.itensSelecionados
                    }
                  >
                    {itensForm.map(item => (
                      <div
                        key={item.produto_id}
                        className={
                          styles.itemSelecionado
                        }
                      >
                        <div>
                          <strong>
                            {
                              item.produto_nome
                            }
                          </strong>

                          <span>
                            {item.codigo_interno}
                          </span>
                        </div>

                        <div>
                          <span>
                            Qtd.:{' '}
                            {item.quantidade}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removerItemForm(
                                item.produto_id
                              )
                            }
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label>
                Observações
                <textarea
                  rows="3"
                  value={form.observacoes}
                  onChange={event =>
                    setForm(prev => ({
                      ...prev,
                      observacoes:
                        event.target.value,
                    }))
                  }
                  placeholder="Informações adicionais..."
                />
              </label>

              <div
                className={styles.modalFooter}
              >
                <button
                  type="button"
                  className={
                    styles.btnCancelar
                  }
                  onClick={fecharModalNovo}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={styles.btnSalvar}
                  disabled={
                    salvando ||
                    itensForm.length === 0
                  }
                >
                  {salvando
                    ? 'Registrando...'
                    : 'Registrar empréstimo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {itensCodigoPendentes.length > 0 && (
        <div className={styles.overlay}>
          <div className={`${styles.modal} ${styles.modalDevolucao}`}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Selecionar empréstimo</h2>
                <p>Este produto está em mais de um empréstimo aberto. Selecione a pessoa que está devolvendo.</p>
              </div>
              <button
                type="button"
                className={styles.btnFechar}
                onClick={() => setItensCodigoPendentes([])}
                disabled={devolvendo}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.itensDevolucao}>
                {itensCodigoPendentes.map(candidato => {
                  const restante =
                    Number(candidato.item.quantidade || 0) -
                    Number(candidato.item.quantidade_devolvida || 0)

                  return (
                    <div key={candidato.item.id} className={styles.devolucaoItem}>
                      <div>
                        <strong>{candidato.pessoaNome}</strong>
                        <span>{candidato.item.produto_nome}</span>
                        <small>Quantidade em aberto: {restante}</small>
                      </div>
                      <button
                        type="button"
                        className={styles.btnSalvar}
                        onClick={() => registrarDevolucaoPorCodigo(candidato)}
                        disabled={devolvendo}
                      >
                        {devolvendo ? 'Registrando...' : 'Selecionar e devolver 1'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalDevolucao &&
        emprestimoSelecionado && (
          <div className={styles.overlay}>
            <div
              className={`${styles.modal} ${styles.modalDevolucao}`}
            >
              <div
                className={styles.modalHeader}
              >
                <div>
                  <h2>
                    Devolução
                  </h2>

                  <p>
                    {
                      emprestimoSelecionado.pessoa_nome
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className={styles.btnFechar}
                  onClick={fecharDevolucao}
                >
                  ×
                </button>
              </div>

              <div
                className={styles.modalBody}
              >
                <div
                  className={
                    styles.itensDevolucao
                  }
                >
                  {Array.isArray(
                    emprestimoSelecionado.itens
                  ) &&
                    emprestimoSelecionado.itens.map(
                      item => {
                        const restante =
                          obterQuantidadeRestante(
                            item
                          )

                        if (restante <= 0) {
                          return null
                        }

                        const individual =
                          produtoEhIndividual(
                            item
                          )

                        return (
                          <div
                            key={item.id}
                            className={
                              styles.devolucaoItem
                            }
                          >
                            <div>
                              <strong>
                                {
                                  item.produto_nome
                                }
                              </strong>

                              <span>
                                {
                                  item.codigo_interno
                                }
                              </span>

                              <small>
                                Restante:{' '}
                                {restante}
                              </small>
                            </div>

                            <div
                              className={
                                styles.devolucaoControles
                              }
                            >
                              <input
                                type="number"
                                min="0"
                                max={
                                  restante
                                }
                                value={
                                  devolucoesItens[
                                    item.id
                                  ] ?? 0
                                }
                                onChange={event =>
                                  alterarQuantidadeDevolucao(
                                    item,
                                    event.target
                                      .value
                                  )
                                }
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  registrarCondicaoItem(
                                    item,
                                    'danificado'
                                  )
                                }
                                disabled={
                                  devolvendo
                                }
                              >
                                Danificado
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  registrarCondicaoItem(
                                    item,
                                    'perdido'
                                  )
                                }
                                disabled={
                                  devolvendo
                                }
                              >
                                Perdido
                              </button>
                            </div>
                          </div>
                        )
                      }
                    )}
                </div>

                <label>
                  Observações da devolução
                  <textarea
                    rows="3"
                    value={
                      devolucaoForm.observacoes
                    }
                    onChange={event =>
                      setDevolucaoForm(
                        prev => ({
                          ...prev,
                          observacoes:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Ex.: equipamento devolvido com riscos..."
                  />
                </label>

                <div
                  className={
                    styles.modalFooter
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.btnCancelar
                    }
                    onClick={
                      fecharDevolucao
                    }
                    disabled={devolvendo}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className={
                      styles.btnSalvar
                    }
                    onClick={
                      confirmarDevolucao
                    }
                    disabled={devolvendo}
                  >
                    {devolvendo
                      ? 'Registrando...'
                      : 'Registrar devolução'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

export default Emprestimos