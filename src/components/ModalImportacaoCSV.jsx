import { useState, useRef } from 'react'
import api from '../services/api'
import styles from './ModalImportacaoCSV.module.css'

function ModalImportacaoCSV({ tipo, onFechar, onImportado }) {
  const [arquivo, setArquivo] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const inputRef = useRef()

  function handleArquivo(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setErro('Apenas arquivos .csv são permitidos')
      return
    }
    setErro('')
    setArquivo(file)
    setResultado(null)
  }

  async function handleEnviar() {
    if (!arquivo) return setErro('Selecione um arquivo CSV')

    setCarregando(true)
    setErro('')

    try {
      const formData = new FormData()
      formData.append('arquivo', arquivo)

      const { data } = await api.post(`/importacao/${tipo || 'produtos'}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setResultado(data)
      if (data.importados > 0) onImportado()
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao importar arquivo')
    } finally {
      setCarregando(false)
    }
  }

  function baixarModelo() {
    const modelos = {
      pessoas: `nome_completo,matricula,email,setor,cargo,telefone
Maria Silva,001,maria@escola.com,Coordenação,Coordenadora,(51) 99999-0001
João Santos,002,joao@escola.com,Docente,Professor,(51) 99999-0002`,
      produtos: `codigo_interno,nome,tipo,unidade_medida,quantidade_atual,quantidade_minima,localizacao_fisica,descricao,observacoes
P002,Papel A4,consumivel,resma,10,2,Prateleira B1,Papel sulfite A4 500 folhas,
P003,Tesoura,reutilizavel,un,5,1,Gaveta C2,,Tesoura escolar`
    }

    const conteudo = modelos[tipo || 'produtos']
    const blob = new Blob([conteudo], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `modelo_${tipo || 'produtos'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const infoTipo = tipo === 'pessoas'
    ? {
        colunas: 'nome_completo, matricula, email, setor, cargo, telefone',
        obrigatorias: 'nome_completo',
        extra: null
      }
    : {
        colunas: 'codigo_interno, nome, tipo, unidade_medida, quantidade_atual, quantidade_minima, localizacao_fisica, descricao, observacoes',
        obrigatorias: 'codigo_interno, nome, tipo',
        extra: 'Valores válidos para tipo: consumivel ou reutilizavel'
      }

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Importar {tipo === 'pessoas' ? 'Pessoas' : 'Produtos'} via CSV</h2>
          <button className={styles.btnFechar} onClick={onFechar}>✕</button>
        </div>

        <div className={styles.corpo}>
          <div className={styles.info}>
            <p>O arquivo CSV deve conter as colunas:</p>
            <code>{infoTipo.colunas}</code>
            <p>Colunas obrigatórias: <strong>{infoTipo.obrigatorias}</strong></p>
            {infoTipo.extra && <p>{infoTipo.extra}</p>}
          </div>

          <button className={styles.btnModelo} onClick={baixarModelo}>
            ⬇ Baixar modelo CSV
          </button>

          <div className={styles.dropzone} onClick={() => inputRef.current.click()}>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              onChange={handleArquivo}
              style={{ display: 'none' }}
            />
            {arquivo ? (
              <p className={styles.arquivoNome}>📄 {arquivo.name}</p>
            ) : (
              <p>Clique para selecionar o arquivo CSV</p>
            )}
          </div>

          {erro && <div className={styles.erro}>{erro}</div>}

          {resultado && (
            <div className={resultado.erros > 0 ? styles.resultadoAlerta : styles.resultadoSucesso}>
              <p>✅ {resultado.importados} {tipo === 'pessoas' ? 'pessoa(s)' : 'produto(s)'} importado(s) com sucesso</p>
              {resultado.erros > 0 && (
                <>
                  <p>⚠️ {resultado.erros} linha(s) com erro:</p>
                  <ul>
                    {resultado.detalhes_erros.map((e, i) => (
                      <li key={i}>Linha {e.linha}: {e.erro}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className={styles.acoes}>
            <button onClick={onFechar} className={styles.btnCancelar}>Fechar</button>
            <button onClick={handleEnviar} disabled={!arquivo || carregando} className={styles.btnImportar}>
              {carregando ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalImportacaoCSV