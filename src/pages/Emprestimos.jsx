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

  const [emprestimoExpandido, setEmprestimoExpandido] = useState(null)

  const [modalNovo, setModalNovo] = useState(false)
  const [modalDevolucao, setModalDevolucao] = useState(false)
  const [emprestimoSelecionado, setEmprestimoSelecionado] = useState(null)

  const [codigoDevolucao, setCodigoDevolucao] = useState('')
  const [devolvendo, setDevolvendo] = useState(false)

  const inputDevolucaoRef = useRef(null)

  const [form, setForm] = useState({
    pessoa_id: '',
    observacoes: '',
  })

  const [buscaPessoa, setBuscaPessoa] = useState('')
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

    const tipoControle =
      produto.categoria_tipo_controle ||
      produto.tipo_controle ||
      'quantidade'

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
                          {(typeof emprestimo.periodo_retirada === 'string'
                            ? emprestimo.periodo_retirada
                            : emprestimo.periodo_retirada?.nome) ||
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
                              {(typeof emprestimo.periodo_devolucao_prevista === 'string'
                                ? emprestimo.periodo_devolucao_prevista
                                : emprestimo.periodo_devolucao_prevista?.nome) ||
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
              <label className={styles.campoPessoa}>
                Pessoa
                <input
                  type="text"
                  list="pessoas-emprestimo-opcoes"
                  value={buscaPessoa || pessoasOptions.find(pessoa => String(pessoa.value) === String(form.pessoa_id))?.label || ''}
                  onChange={event => {
                    const valor = event.target.value
                    setBuscaPessoa(valor)
                    const pessoa = pessoasOptions.find(
                      item => item.label.toLowerCase() === valor.trim().toLowerCase()
                    )
                    setForm(prev => ({ ...prev, pessoa_id: pessoa ? String(pessoa.value) : '' }))
                  }}
                  placeholder="Pesquise pelo nome da pessoa..."
                  autoComplete="off"
                  required
                />
                <datalist id="pessoas-emprestimo-opcoes">
                  {pessoasOptions.map(pessoa => (
                    <option key={pessoa.value} value={pessoa.label} />
                  ))}
                </datalist>
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