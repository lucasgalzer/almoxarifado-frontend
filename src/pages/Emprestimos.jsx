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

function hojeISO() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function obterNomePeriodo(periodo) {
  if (!periodo) return '—'

  if (periodo.nome && periodo.horario) {
    return `${periodo.nome} — ${String(periodo.horario).slice(0, 5)}`
  }

  if (periodo.nome) return periodo.nome

  if (periodo.horario) {
    return String(periodo.horario).slice(0, 5)
  }

  return '—'
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
  const [periodos, setPeriodos] = useState([])

  const [carregando, setCarregando] = useState(true)
  const [carregandoDados, setCarregandoDados] = useState(false)

  const [filtroStatus, setFiltroStatus] = useState('ativo')
  const [filtroPessoa, setFiltroPessoa] = useState('')
  const [busca, setBusca] = useState('')

  const [emprestimoExpandido, setEmprestimoExpandido] = useState(null)

  const [modalNovo, setModalNovo] = useState(false)
  const [modalDevolucao, setModalDevolucao] = useState(false)
  const [emprestimoSelecionado, setEmprestimoSelecionado] = useState(null)

  const [codigoDevolucao, setCodigoDevolucao] = useState('')
  const [devolvendo, setDevolvendo] = useState(false)

  const inputDevolucaoRef = useRef(null)

  const [form, setForm] = useState({
    pessoa_id: '',
    data_retirada: hojeISO(),
    periodo_retirada_id: '',
    data_devolucao_prevista: '',
    periodo_devolucao_prevista_id: '',
    observacoes: '',
  })

  const [codigoProduto, setCodigoProduto] = useState('')
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [quantidadeProduto, setQuantidadeProduto] = useState(1)
  const [itensForm, setItensForm] = useState([])

  const [salvando, setSalvando] = useState(false)
  const [buscandoProduto, setBuscandoProduto] = useState(false)
  const [verificandoDisponibilidade, setVerificandoDisponibilidade] = useState(false)
  const [disponibilidade, setDisponibilidade] = useState(null)

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

  useEffect(() => {
    const periodoCompleto =
      form.data_retirada &&
      form.periodo_retirada_id &&
      form.data_devolucao_prevista &&
      form.periodo_devolucao_prevista_id

    if (!modalNovo || !itensForm.length || !periodoCompleto) {
      setDisponibilidade(null)
      setVerificandoDisponibilidade(false)
      return
    }

    let ativo = true
    const timer = setTimeout(async () => {
      setVerificandoDisponibilidade(true)
      setDisponibilidade(null)

      try {
        const { data } = await api.post('/emprestimos/disponibilidade', {
          itens: itensForm.map(item => ({
            produto_id: item.produto_id,
            quantidade: item.quantidade
          })),
          data_retirada: form.data_retirada,
          periodo_retirada_id: form.periodo_retirada_id,
          data_devolucao_prevista: form.data_devolucao_prevista,
          periodo_devolucao_prevista_id: form.periodo_devolucao_prevista_id
        })
        if (ativo) setDisponibilidade(data)
      } catch (error) {
        if (ativo) {
          setDisponibilidade({
            disponivel: false,
            erro: error.response?.data?.erro || 'Não foi possível verificar a disponibilidade.'
          })
        }
      } finally {
        if (ativo) setVerificandoDisponibilidade(false)
      }
    }, 250)

    return () => {
      ativo = false
      clearTimeout(timer)
    }
  }, [
    modalNovo,
    itensForm,
    form.data_retirada,
    form.periodo_retirada_id,
    form.data_devolucao_prevista,
    form.periodo_devolucao_prevista_id
  ])

  async function carregarDadosIniciais() {
    try {
      setCarregandoDados(true)

      const [pessoasResponse, produtosResponse, periodosResponse] =
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

          api.get('/periodos-aula'),
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

      setPeriodos(
        Array.isArray(periodosResponse.data)
          ? periodosResponse.data
          : periodosResponse.data?.dados || []
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
        const nome = String(produto.nome || '').toLowerCase()

        return (
          codigo.includes(buscaNormalizada) ||
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

  function limparFormulario() {
    setForm({
      pessoa_id: '',
      data_retirada: hojeISO(),
      periodo_retirada_id: '',
      data_devolucao_prevista: '',
      periodo_devolucao_prevista_id: '',
      observacoes: '',
    })

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
    setProdutoSelecionado(produto)
    setCodigoProduto(produto.codigo_interno || '')
    setQuantidadeProduto(1)
  }

  function removerItemForm(produtoId) {
    setItensForm(prev =>
      prev.filter(item => item.produto_id !== produtoId)
    )
  }

  function adicionarProduto() {
    if (!produtoSelecionado) {
      addToast('Selecione um produto primeiro', 'erro')
      return
    }

    if (produtoSelecionado.status !== 'disponivel') {
      addToast(
        `O produto está ${produtoSelecionado.status}`,
        'erro'
      )
      return
    }

    const tipoControle =
      produtoSelecionado.categoria_tipo_controle ||
      produtoSelecionado.tipo_controle ||
      'quantidade'

    const individual = tipoControle === 'individual'

    const quantidade = individual
      ? 1
      : Number(quantidadeProduto)

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      addToast('Informe uma quantidade válida', 'erro')
      return
    }

    if (
      !individual &&
      Number(produtoSelecionado.quantidade_atual || 0) < quantidade
    ) {
      addToast(
        `Estoque insuficiente. Disponível: ${produtoSelecionado.quantidade_atual || 0}`,
        'erro'
      )
      return
    }

    const existente = itensForm.find(
      item => item.produto_id === produtoSelecionado.id
    )

    if (existente) {
      if (individual) {
        addToast('Este equipamento já foi adicionado', 'erro')
        return
      }

      setItensForm(prev =>
        prev.map(item =>
          item.produto_id === produtoSelecionado.id
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
          produto_id: produtoSelecionado.id,
          produto_nome: produtoSelecionado.nome,
          codigo_interno: produtoSelecionado.codigo_interno,
          quantidade,
          individual,
        },
      ])
    }

    setProdutoSelecionado(null)
    setCodigoProduto('')
    setQuantidadeProduto(1)
  }

  async function buscarProdutoPorCodigo() {
    const codigo = codigoProduto.trim()

    if (!codigo || buscandoProduto) return

    const encontrado = produtos.find(
      produto =>
        String(produto.codigo_interno || '').toLowerCase() ===
        codigo.toLowerCase()
    )

    if (!encontrado) {
      addToast(`Produto "${codigo}" não encontrado`, 'erro')
      return
    }

    selecionarProduto(encontrado)
  }

  async function salvarEmprestimo(event) {
    event.preventDefault()

    if (salvando) return

    if (!form.pessoa_id) {
      addToast('Selecione a pessoa que receberá o empréstimo', 'erro')
      return
    }

    if (!form.data_retirada) {
      addToast('Informe a data da retirada', 'erro')
      return
    }

    if (!form.periodo_retirada_id) {
      addToast('Selecione o período da retirada', 'erro')
      return
    }

    if (itensForm.length === 0) {
      addToast('Adicione pelo menos um produto', 'erro')
      return
    }

    if (!form.data_devolucao_prevista || !form.periodo_devolucao_prevista_id) {
      addToast('Informe a data e o período previstos para devolução para verificar a disponibilidade.', 'erro')
      return
    }

    if (form.data_devolucao_prevista < form.data_retirada) {
      addToast('A devolução não pode ocorrer antes da retirada.', 'erro')
      return
    }

    const ordemRetirada = periodos.find(p => String(p.id) === String(form.periodo_retirada_id))?.ordem
    const ordemDevolucao = periodos.find(p => String(p.id) === String(form.periodo_devolucao_prevista_id))?.ordem
    if (form.data_devolucao_prevista === form.data_retirada && Number(ordemDevolucao) <= Number(ordemRetirada)) {
      addToast('O período de devolução deve ser posterior ao período de retirada.', 'erro')
      return
    }

    if (verificandoDisponibilidade || !disponibilidade) {
      addToast('Aguarde a verificação de disponibilidade antes de registrar.', 'erro')
      return
    }

    if (!disponibilidade.disponivel) {
      addToast(disponibilidade.erro || (disponibilidade.resultados || []).filter(item => !item.disponivel).map(item => item.detalhe || item.mensagem || item.produto).join(' ') || 'Há equipamentos indisponíveis no período selecionado.', 'erro')
      return
    }

    setSalvando(true)

    try {
      const payload = {
        pessoa_id: form.pessoa_id,
        data_retirada: form.data_retirada,
        periodo_retirada_id: form.periodo_retirada_id,
        data_devolucao_prevista:
          form.data_devolucao_prevista || null,
        periodo_devolucao_prevista_id:
          form.periodo_devolucao_prevista_id || null,
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
      const { data } = await api.post(
        `/emprestimos/devolver/codigo/${encodeURIComponent(codigo)}`
      )

      tocarSom('devolucao')

      addToast(
        `${data.mensagem || 'Produto devolvido'}${
          data.pessoa ? ` — ${data.pessoa}` : ''
        }`,
        'sucesso'
      )

      setCodigoDevolucao('')

      await carregarEmprestimos()

      setTimeout(() => {
        inputDevolucaoRef.current?.focus()
      }, 100)
    } catch (error) {
      console.error(error)

      addToast(
        error.response?.data?.erro ||
          'Não foi possível realizar a devolução',
        'erro'
      )

      setCodigoDevolucao('')

      setTimeout(() => {
        inputDevolucaoRef.current?.focus()
      }, 100)
    } finally {
      setDevolvendo(false)
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
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>
            Empréstimos
          </h1>

          <p className={styles.subtitulo}>
            {emprestimosFiltrados.length}{' '}
            empréstimo(s) encontrado(s)
          </p>
        </div>

        <button
          type="button"
          className={styles.btnNovo}
          onClick={abrirModalNovo}
        >
          + Novo empréstimo
        </button>
      </div>

      <div className={styles.acoesRapidas}>
        <form
          onSubmit={handleDevolverPorCodigo}
          className={styles.formDevolucao}
        >
          <input
            ref={inputDevolucaoRef}
            value={codigoDevolucao}
            onChange={event =>
              setCodigoDevolucao(event.target.value)
            }
            placeholder="Escaneie o código para devolver..."
            className={styles.inputCodigo}
            disabled={devolvendo}
          />

          <button
            type="submit"
            className={styles.btnDevolverRapido}
            disabled={
              devolvendo ||
              !codigoDevolucao.trim()
            }
          >
            {devolvendo
              ? 'Devolvendo...'
              : 'Devolver'}
          </button>
        </form>
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
                <th>Retirada</th>
                <th>Devolução prevista</th>
                <th>Itens</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {emprestimosFiltrados.map(emprestimo => {
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
                          ? styles.linhaExpandida
                          : ''
                      }
                      onClick={() =>
                        setEmprestimoExpandido(
                          expandido
                            ? null
                            : emprestimo.id
                        )
                      }
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
                        <strong>
                          {formatarData(
                            emprestimo.data_retirada
                          )}
                        </strong>

                        <small>
                          {obterNomePeriodo(
                            emprestimo.periodo_retirada
                          ) ||
                            emprestimo.periodo_retirada_nome ||
                            '—'}
                        </small>
                      </td>

                      <td>
                        {emprestimo.data_devolucao_prevista ? (
                          <>
                            <strong>
                              {formatarData(
                                emprestimo.data_devolucao_prevista
                              )}
                            </strong>

                            <small>
                              {obterNomePeriodo(
                                emprestimo.periodo_devolucao_prevista
                              ) ||
                                emprestimo.periodo_devolucao_prevista_nome ||
                                '—'}
                            </small>
                          </>
                        ) : (
                          <span className={styles.semPrazo}>
                            Sem prazo
                          </span>
                        )}
                      </td>

                      <td>
                        <strong>
                          {quantidadeAberta}
                        </strong>

                        <small>
                          de {quantidadeTotal}{' '}
                          em aberto
                        </small>
                      </td>

                      <td>
                        <span
                          className={`${styles.badge} ${
                            styles[
                              `badge_${emprestimo.status}`
                            ] || ''
                          }`}
                        >
                          {obterStatusLabel(
                            emprestimo.status
                          )}
                        </span>
                      </td>

                      <td
                        onClick={event =>
                          event.stopPropagation()
                        }
                      >
                        <div
                          className={
                            styles.acoesTabela
                          }
                        >
                          {(emprestimo.status ===
                            'ativo' ||
                            emprestimo.status ===
                              'parcialmente_devolvido') && (
                            <button
                              type="button"
                              onClick={() =>
                                abrirDevolucao(
                                  emprestimo
                                )
                              }
                              className={
                                styles.btnAcao
                              }
                            >
                              Devolver
                            </button>
                          )}

                          {(emprestimo.status ===
                            'ativo' ||
                            emprestimo.status ===
                              'parcialmente_devolvido') && (
                            <button
                              type="button"
                              onClick={() =>
                                cancelarEmprestimo(
                                  emprestimo
                                )
                              }
                              className={
                                styles.btnAcaoSecundaria
                              }
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expandido && (
                      <tr>
                        <td
                          colSpan="6"
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
                                  <strong>
                                    Observações:
                                  </strong>{' '}
                                  {
                                    emprestimo.observacoes
                                  }
                                </p>
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

      {modalNovo && (
        <div className={styles.overlay}>
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
              <div className={styles.grid2}>
                <label>
                  Pessoa
                  <select
                    value={form.pessoa_id}
                    onChange={event =>
                      setForm(prev => ({
                        ...prev,
                        pessoa_id:
                          event.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">
                      Selecione uma pessoa
                    </option>

                    {pessoasOptions.map(
                      pessoa => (
                        <option
                          key={pessoa.value}
                          value={pessoa.value}
                        >
                          {pessoa.label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Data da retirada
                  <input
                    type="date"
                    value={form.data_retirada}
                    onChange={event =>
                      setForm(prev => ({
                        ...prev,
                        data_retirada:
                          event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>

              <div className={styles.grid2}>
                <label>
                  Período da retirada
                  <select
                    value={
                      form.periodo_retirada_id
                    }
                    onChange={event =>
                      setForm(prev => ({
                        ...prev,
                        periodo_retirada_id:
                          event.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">
                      Selecione o período
                    </option>

                    {periodos.map(periodo => (
                      <option
                        key={periodo.id}
                        value={periodo.id}
                      >
                        {obterNomePeriodo(
                          periodo
                        )}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Data prevista para devolução
                  <input
                    type="date"
                    value={
                      form.data_devolucao_prevista
                    }
                    min={form.data_retirada}
                    onChange={event =>
                      setForm(prev => ({
                        ...prev,
                        data_devolucao_prevista:
                          event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className={styles.grid2}>
                <label>
                  Período previsto para devolução
                  <select
                    value={
                      form.periodo_devolucao_prevista_id
                    }
                    onChange={event =>
                      setForm(prev => ({
                        ...prev,
                        periodo_devolucao_prevista_id:
                          event.target.value,
                      }))
                    }
                    disabled={
                      !form.data_devolucao_prevista
                    }
                  >
                    <option value="">
                      Selecione o período
                    </option>

                    {periodos.map(periodo => (
                      <option
                        key={periodo.id}
                        value={periodo.id}
                      >
                        {obterNomePeriodo(
                          periodo
                        )}
                      </option>
                    ))}
                  </select>
                </label>

                <div />
              </div>


              {itensForm.length > 0 &&
                form.data_retirada &&
                form.periodo_retirada_id &&
                form.data_devolucao_prevista &&
                form.periodo_devolucao_prevista_id && (
                  <div
                    role="status"
                    style={{
                      margin: '12px 0',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1px solid ${verificandoDisponibilidade ? '#93c5fd' : disponibilidade?.disponivel ? '#86efac' : '#fca5a5'}`,
                      background: verificandoDisponibilidade ? '#eff6ff' : disponibilidade?.disponivel ? '#f0fdf4' : '#fef2f2',
                      color: verificandoDisponibilidade ? '#1d4ed8' : disponibilidade?.disponivel ? '#166534' : '#991b1b',
                      fontSize: 13
                    }}
                  >
                    {verificandoDisponibilidade
                      ? 'Verificando disponibilidade para todas as datas e períodos...'
                      : disponibilidade?.erro
                        ? disponibilidade.erro
                        : disponibilidade?.disponivel
                          ? 'Disponibilidade confirmada para o período selecionado.'
                          : disponibilidade
                            ? (disponibilidade.resultados || [])
                                .filter(item => !item.disponivel)
                                .map(item => `${item.produto || item.codigo_interno || 'Produto'}: ${item.detalhe || item.mensagem || 'indisponível no período'}`)
                                .join(' ')
                            : 'Aguardando verificação de disponibilidade...'}
                  </div>
                )}

              <div className={styles.secaoProduto}>
                <div className={styles.secaoTitulo}>
                  <strong>
                    Produtos / equipamentos
                  </strong>

                  <span>
                    Use o código interno ou nome.
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
                    placeholder="Código do produto..."
                    disabled={buscandoProduto}
                  />

                  <button
                    type="button"
                    onClick={
                      buscarProdutoPorCodigo
                    }
                    disabled={
                      buscandoProduto ||
                      !codigoProduto.trim()
                    }
                  >
                    Buscar
                  </button>
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

                {produtoSelecionado && (
                  <div
                    className={
                      styles.produtoSelecionado
                    }
                  >
                    <div>
                      <strong>
                        {produtoSelecionado.nome}
                      </strong>

                      <span>
                        Código:{' '}
                        {
                          produtoSelecionado.codigo_interno
                        }
                      </span>

                      <span>
                        Estoque:{' '}
                        {
                          produtoSelecionado.quantidade_atual ??
                          0
                        }
                      </span>
                    </div>

                    <div
                      className={
                        styles.produtoAcao
                      }
                    >
                      {!(
                        produtoSelecionado.categoria_tipo_controle ===
                          'individual' ||
                        produtoSelecionado.tipo_controle ===
                          'individual'
                      ) && (
                        <input
                          type="number"
                          min="1"
                          value={
                            quantidadeProduto
                          }
                          onChange={event =>
                            setQuantidadeProduto(
                              event.target.value
                            )
                          }
                        />
                      )}

                      <button
                        type="button"
                        onClick={
                          adicionarProduto
                        }
                      >
                        Adicionar
                      </button>
                    </div>
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