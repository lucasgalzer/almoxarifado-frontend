import { useState, useEffect } from 'react'
import api from '../services/api'
import ModalPessoa from '../components/ModalPessoa'
import ModalImportacaoCSV from '../components/ModalImportacaoCSV'
import ModalHistoricoPessoa from '../components/ModalHistoricoPessoa'
import ModalConfirmacao from '../components/ModalConfirmacao'
import { useToast } from '../components/Toast'
import styles from './Pessoas.module.css'

function Pessoas() {
  const { addToast } = useToast()
  const [pessoas, setPessoas] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroSetor, setFiltroSetor] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState('')
  const [setores, setSetores] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [pessoaSelecionada, setPessoaSelecionada] = useState(null)
  const [modalCSVAberto, setModalCSVAberto] = useState(false)
  const [pessoaHistorico, setPessoaHistorico] = useState(null)
  const [pessoaExcluindo, setPessoaExcluindo] = useState(null)

  useEffect(() => {
    carregarPessoas()
    carregarSetores()
  }, [busca, filtroSetor, filtroAtivo])

  async function carregarPessoas() {
    try {
      setCarregando(true)
      const params = {}
      if (busca) params.busca = busca
      if (filtroSetor) params.setor = filtroSetor
      if (filtroAtivo !== '') params.ativo = filtroAtivo
      const { data } = await api.get('/pessoas', { params })
      setPessoas(data)
    } catch (error) {
      console.error(error)
    } finally {
      setCarregando(false)
    }
  }

  async function carregarSetores() {
    try {
      const { data } = await api.get('/pessoas/setores')
      setSetores(data)
    } catch (error) {
      console.error(error)
    }
  }

  function abrirModalNovo() {
    setPessoaSelecionada(null)
    setModalAberto(true)
  }

  function abrirModalEditar(pessoa) {
    setPessoaSelecionada(pessoa)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setPessoaSelecionada(null)
  }

  function aoSalvar() {
    fecharModal()
    carregarPessoas()
    carregarSetores()
  }

  async function excluirPessoa() {
    try {
      await api.delete(`/pessoas/${pessoaExcluindo.id}`)
      addToast('Pessoa excluída com sucesso', 'sucesso')
      setPessoaExcluindo(null)
      carregarPessoas()
    } catch (error) {
      addToast(error.response?.data?.erro || 'Erro ao excluir', 'erro')
      setPessoaExcluindo(null)
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Pessoas</h1>
          <p className={styles.subtitulo}>{pessoas.length} pessoa(s) encontrada(s)</p>
        </div>
        <div className={styles.acoes}>
          <button className={styles.btnImportar} onClick={() => setModalCSVAberto(true)}>
            Importar CSV
          </button>
          <button className={styles.btnNovo} onClick={abrirModalNovo}>
            + Nova Pessoa
          </button>
        </div>
      </div>

      <div className={styles.filtros}>
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className={styles.inputBusca}
        />
        <select value={filtroSetor} onChange={e => setFiltroSetor(e.target.value)} className={styles.select}>
          <option value="">Todos os setores</option>
          {setores.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filtroAtivo} onChange={e => setFiltroAtivo(e.target.value)} className={styles.select}>
          <option value="">Todos</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
      </div>

      <div className={styles.tabela}>
        {carregando ? (
          <div className={styles.vazio}>Carregando...</div>
        ) : pessoas.length === 0 ? (
          <div className={styles.vazio}>Nenhuma pessoa encontrada.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Matrícula</th>
                <th>Setor</th>
                <th>Cargo</th>
                <th>E-mail</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pessoas.map(pessoa => (
                <tr key={pessoa.id}>
                  <td>{pessoa.nome_completo}</td>
                  <td>{pessoa.matricula || '—'}</td>
                  <td>{pessoa.setor || '—'}</td>
                  <td>{pessoa.cargo || '—'}</td>
                  <td>{pessoa.email || '—'}</td>
                  <td>
                    <span className={`${styles.badge} ${pessoa.ativo ? styles.badgeAtivo : styles.badgeInativo}`}>
                      {pessoa.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className={styles.btnEditar} onClick={() => abrirModalEditar(pessoa)}>
                        Editar
                      </button>
                      <button className={styles.btnHistorico} onClick={() => setPessoaHistorico(pessoa)}>
                        Histórico
                      </button>
                      <button className={styles.btnExcluir} onClick={() => setPessoaExcluindo(pessoa)}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <ModalPessoa
          pessoa={pessoaSelecionada}
          onFechar={fecharModal}
          onSalvar={aoSalvar}
        />
      )}

      {modalCSVAberto && (
        <ModalImportacaoCSV
          tipo="pessoas"
          onFechar={() => setModalCSVAberto(false)}
          onImportado={carregarPessoas}
        />
      )}

      {pessoaHistorico && (
        <ModalHistoricoPessoa
          pessoaId={pessoaHistorico.id}
          onFechar={() => setPessoaHistorico(null)}
        />
      )}

      {pessoaExcluindo && (
        <ModalConfirmacao
          titulo="Excluir pessoa"
          mensagem={`Tem certeza que deseja excluir "${pessoaExcluindo.nome_completo}"? Esta ação não pode ser desfeita.`}
          onConfirmar={excluirPessoa}
          onCancelar={() => setPessoaExcluindo(null)}
        />
      )}
    </div>
  )
}

export default Pessoas