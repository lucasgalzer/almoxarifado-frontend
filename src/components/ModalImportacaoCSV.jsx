import { useEffect, useRef, useState } from 'react'
import api from '../services/api'
import styles from './ModalImportacaoCSV.module.css'

function ModalImportacaoCSV({ tipo, onFechar, onImportado }) {
  const tipoAtual = tipo || 'produtos'
  const ehPessoas = tipoAtual === 'pessoas'
  const [arquivo, setArquivo] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [preview, setPreview] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [modo, setModo] = useState('multiplas')
  const [categoriaId, setCategoriaId] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!ehPessoas) {
      api.get('/categorias')
        .then(({ data }) => setCategorias(Array.isArray(data) ? data : (data.dados || [])))
        .catch(() => setErro('Não foi possível carregar as categorias deste setor.'))
    }
  }, [ehPessoas])

  function handleArquivo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErro('Apenas arquivos .csv são permitidos')
      setArquivo(null)
      return
    }
    setErro('')
    setArquivo(file)
    setResultado(null)
    setPreview(null)
  }

  function criarFormData() {
    const form = new FormData()
    form.append('arquivo', arquivo)
    if (!ehPessoas) {
      form.append('modo', modo)
      if (modo === 'categoria') form.append('categoria_id', categoriaId)
    }
    return form
  }

  async function analisarCSV() {
    if (!arquivo) return setErro('Selecione um arquivo CSV')
    if (!ehPessoas && modo === 'categoria' && !categoriaId) return setErro('Selecione a categoria')
    setCarregando(true)
    setErro('')
    setPreview(null)
    try {
      const { data } = await api.post('/importacao/produtos/preview', criarFormData(), {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setPreview(data)
    } catch (error) {
      setErro(error.response?.data?.erro || 'Não foi possível analisar o CSV')
    } finally {
      setCarregando(false)
    }
  }

  async function confirmarImportacao() {
    if (!arquivo) return
    setCarregando(true)
    setErro('')
    try {
      const endpoint = ehPessoas ? '/importacao/pessoas' : '/importacao/produtos'
      const { data } = await api.post(endpoint, ehPessoas ? (() => {
        const form = new FormData()
        form.append('arquivo', arquivo)
        return form
      })() : criarFormData(), {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResultado(data)
      setPreview(null)
      if (data.importados > 0) await onImportado?.()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao importar arquivo')
      if (error.response?.data?.detalhes_erros) setResultado({
        total: error.response.data.total || 0,
        importados: 0,
        erros: error.response.data.detalhes_erros.length,
        detalhes_erros: error.response.data.detalhes_erros
      })
    } finally {
      setCarregando(false)
    }
  }

  function baixarModelo() {
    const conteudo = ehPessoas
      ? 'nome_completo;matricula;email;cargo;telefone\nMaria Silva;001;maria@escola.com;Coordenadora;(51) 99999-0001'
      : modo === 'categoria'
        ? 'codigo_interno;nome;tipo;unidade_medida;quantidade_atual;quantidade_minima;localizacao_fisica;descricao;observacoes\nP001;Notebook Dell;reutilizavel;un;10;2;Sala TI;Notebook Dell Latitude;'
        : 'codigo_interno;nome;categoria;tipo;unidade_medida;quantidade_atual;quantidade_minima;localizacao_fisica;descricao;observacoes\nP001;Notebook Dell;Informática;reutilizavel;un;10;2;Sala TI;Notebook Dell Latitude;'
    const blob = new Blob(['\\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = ehPessoas ? 'modelo_pessoas.csv' : (modo === 'categoria' ? 'modelo_produtos_categoria_unica.csv' : 'modelo_produtos_multiplas_categorias.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.overlay} data-modal-open="true" onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Importar {ehPessoas ? 'Pessoas' : 'Produtos'} via CSV</h2>
          <button className={styles.btnFechar} onClick={onFechar} type="button">✕</button>
        </div>
        <div className={styles.corpo}>
          <div className={styles.info}>
            <p>O arquivo CSV deve utilizar <strong>ponto e vírgula (;)</strong> como separador.</p>
            {ehPessoas ? (
              <>
                <p><strong>Colunas:</strong> nome_completo;matricula;email;cargo;telefone</p>
                <p>Obrigatória: nome_completo. A pessoa será vinculada à instituição.</p>
              </>
            ) : (
              <>
                <p><strong>Modo de importação</strong></p>
                <select value={modo} onChange={e => { setModo(e.target.value); setPreview(null); setResultado(null) }}>
                  <option value="multiplas">Várias categorias (categoria em cada linha)</option>
                  <option value="categoria">Uma única categoria (selecionar abaixo)</option>
                </select>
                {modo === 'categoria' && (
                  <select value={categoriaId} onChange={e => { setCategoriaId(e.target.value); setPreview(null) }}>
                    <option value="">Selecione a categoria</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                )}
                <p><strong>Colunas padrão:</strong> codigo_interno;nome;{modo === 'multiplas' ? 'categoria;' : ''}tipo;unidade_medida;quantidade_atual;quantidade_minima;localizacao_fisica;descricao;observacoes</p>
                <p>Campos personalizados: use o nome técnico configurado na categoria como cabeçalho (por exemplo, numero_patrimonio).</p>
                <p>Campos obrigatórios e opções serão validados conforme a categoria de cada produto. Categorias disponíveis são limitadas ao setor atual.</p>
              </>
            )}
          </div>

          <button className={styles.btnModelo} onClick={baixarModelo} type="button">⬇ Baixar modelo CSV</button>
          <div className={styles.dropzone} onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleArquivo} style={{ display: 'none' }} />
            {arquivo ? <p className={styles.arquivoNome}>📄 {arquivo.name}</p> : <p>Clique para selecionar o arquivo CSV</p>}
          </div>

          {erro && <div className={styles.erro}>{erro}</div>}

          {preview && (
            <div className={preview.erros ? styles.resultadoAlerta : styles.resultadoSucesso}>
              <p><strong>Análise concluída:</strong> {preview.validos} válido(s) de {preview.total} linha(s); {preview.erros} com erro.</p>
              <div style={{ maxHeight: 220, overflow: 'auto' }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead><tr><th>Linha</th><th>Código</th><th>Produto</th><th>Categoria</th><th>Situação</th></tr></thead>
                  <tbody>{(preview.linhas || []).map(item => (
                    <tr key={item.linha}>
                      <td>{item.linha}</td><td>{item.codigo}</td><td>{item.nome}</td><td>{item.categoria}</td>
                      <td>{item.status === 'válido' ? 'Válido' : (item.erros || []).join('; ')}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              {preview.erros > 0 && <p>Corrija as linhas com erro no arquivo e analise novamente. Somente linhas válidas serão importadas.</p>}
            </div>
          )}

          {resultado && (
            <div className={resultado.erros > 0 ? styles.resultadoAlerta : styles.resultadoSucesso}>
              <p>{resultado.importados || 0} {ehPessoas ? 'pessoa(s)' : 'produto(s)'} importado(s) com sucesso.</p>
              <p>Total: {resultado.total} | Erros: {resultado.erros}</p>
              {resultado.detalhes_erros?.map((item, i) => <p key={i}>Linha {item.linha}: {item.erro}</p>)}
            </div>
          )}

          <div className={styles.acoes}>
            <button onClick={onFechar} className={styles.btnCancelar} type="button">Fechar</button>
            {ehPessoas ? (
              <button onClick={confirmarImportacao} disabled={!arquivo || carregando} className={styles.btnImportar} type="button">
                {carregando ? 'Importando...' : 'Importar'}
              </button>
            ) : !preview ? (
              <button onClick={analisarCSV} disabled={!arquivo || carregando || (modo === 'categoria' && !categoriaId)} className={styles.btnImportar} type="button">
                {carregando ? 'Analisando...' : 'Analisar CSV'}
              </button>
            ) : (
              <button onClick={confirmarImportacao} disabled={!preview.validos || carregando} className={styles.btnImportar} type="button">
                {carregando ? 'Importando...' : `Confirmar importação (${preview.validos})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalImportacaoCSV