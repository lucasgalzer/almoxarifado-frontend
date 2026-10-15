import { useState, useRef } from 'react'
import api from '../services/api'
import styles from './ModalImportacaoCSV.module.css'

function ModalImportacaoCSV({ tipo, onFechar, onImportado }) {
  const [arquivo, setArquivo] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const inputRef = useRef()

  const tipoAtual = tipo || 'produtos'

  function handleArquivo(e) {
    const file = e.target.files[0]

    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErro('Apenas arquivos .csv são permitidos')
      setArquivo(null)
      return
    }

    setErro('')
    setArquivo(file)
    setResultado(null)
  }

  async function handleEnviar() {
    if (!arquivo) {
      setErro('Selecione um arquivo CSV')
      return
    }

    setCarregando(true)
    setErro('')
    setResultado(null)

    try {
      const formData = new FormData()

      formData.append('arquivo', arquivo)

      const { data } = await api.post(
        `/importacao/${tipoAtual}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      setResultado(data)

      if (data.importados > 0) {
        await onImportado()
      }

    } catch (error) {
      const resposta = error.response?.data

      setErro(
        resposta?.erro ||
        'Erro ao importar arquivo'
      )

      if (resposta?.detalhes_erros) {
        setResultado({
          total: resposta.total || 0,
          importados: 0,
          erros: resposta.detalhes_erros.length,
          detalhes_erros: resposta.detalhes_erros
        })
      }

    } finally {
      setCarregando(false)
    }
  }

  function baixarModelo() {
    const modelos = {
      pessoas: {
        nome: 'modelo_pessoas.csv',

        conteudo:
`nome_completo;matricula;email;cargo;telefone
Maria Silva;001;maria@escola.com;Coordenadora;(51) 99999-0001
João Santos;002;joao@escola.com;Professor;(51) 99999-0002`
      },

      produtos: {
        nome: 'modelo_produtos.csv',

        conteudo:
`codigo_interno;nome;categoria;tipo;unidade_medida;quantidade_atual;quantidade_minima;localizacao_fisica;descricao;observacoes
P001;Notebook Dell;Informática;reutilizavel;un;10;2;Sala TI;Notebook Dell Latitude;
P002;Mouse Logitech;Informática;reutilizavel;un;25;5;Armário TI;Mouse sem fio;
P003;Papel A4;Material de Escritório;consumivel;pacote;100;20;Armário 01;Papel A4 75g;`
      }
    }

    const modelo = modelos[tipoAtual]

    if (!modelo) return

    const blob = new Blob(
      [
        '\uFEFF' + modelo.conteudo
      ],
      {
        type: 'text/csv;charset=utf-8;'
      }
    )

    const url =
      URL.createObjectURL(blob)

    const a =
      document.createElement('a')

    a.href = url
    a.download = modelo.nome

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
  }

  const ehPessoas =
    tipoAtual === 'pessoas'

  const infoTipo = ehPessoas
    ? {
        colunas:
          'nome_completo;matricula;email;cargo;telefone',

        obrigatorias:
          'nome_completo',

        extras: [
          'A pessoa pertence automaticamente à instituição.',
          'O setor de acesso é configurado posteriormente em Usuários.',
          'Não informe senha no CSV.'
        ]
      }
    : {
        colunas:
          'codigo_interno;nome;categoria;tipo;unidade_medida;quantidade_atual;quantidade_minima;localizacao_fisica;descricao;observacoes',

        obrigatorias:
          'codigo_interno; nome; categoria; tipo',

        extras: [
          'A categoria deve existir previamente no sistema.',
          'O setor é definido automaticamente pelo setor atual.',
          'A instituição é definida automaticamente pelo usuário logado.',
          'Tipos válidos: consumivel ou reutilizavel.'
        ]
      }

  return (
    <div
      className={styles.overlay}
      data-modal-open="true"
      onClick={onFechar}
    >
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2>
            Importar {ehPessoas ? 'Pessoas' : 'Produtos'} via CSV
          </h2>

          <button
            className={styles.btnFechar}
            onClick={onFechar}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className={styles.corpo}>

          {/* =====================================================
              INFORMAÇÕES
          ====================================================== */}

          <div className={styles.info}>

            <p>
              O arquivo CSV deve utilizar
              <strong> ponto e vírgula (;)</strong> como separador.
            </p>

            <p>
              <strong>Colunas:</strong>
            </p>

            <code>
              {infoTipo.colunas}
            </code>

            <p>
              <strong>
                Colunas obrigatórias:
              </strong>{' '}
              {infoTipo.obrigatorias}
            </p>

            {infoTipo.extras.map(
              (texto, index) => (
                <p key={index}>
                  {texto}
                </p>
              )
            )}

          </div>

          {/* =====================================================
              MODELO
          ====================================================== */}

          <button
            className={styles.btnModelo}
            onClick={baixarModelo}
            type="button"
          >
            ⬇ Baixar modelo CSV
          </button>

          {/* =====================================================
              ARQUIVO
          ====================================================== */}

          <div
            className={styles.dropzone}
            onClick={() =>
              inputRef.current?.click()
            }
          >

            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleArquivo}
              style={{
                display: 'none'
              }}
            />

            {arquivo ? (
              <p className={styles.arquivoNome}>
                📄 {arquivo.name}
              </p>
            ) : (
              <p>
                Clique para selecionar o arquivo CSV
              </p>
            )}

          </div>

          {/* =====================================================
              ERRO
          ====================================================== */}

          {erro && (
            <div className={styles.erro}>
              {erro}
            </div>
          )}

          {/* =====================================================
              RESULTADO
          ====================================================== */}

          {resultado && (
            <div
              className={
                resultado.erros > 0
                  ? styles.resultadoAlerta
                  : styles.resultadoSucesso
              }
            >

              <p>
                {resultado.erros > 0
                  ? '⚠️'
                  : '✅'}{' '}

                {resultado.importados || 0}{' '}

                {ehPessoas
                  ? 'pessoa(s)'
                  : 'produto(s)'}

                {' '}importado(s) com sucesso.
              </p>

              {resultado.total !== undefined && (
                <p>
                  Total de linhas processadas:{' '}
                  {resultado.total}
                </p>
              )}

              {resultado.erros > 0 && (
                <>
                  <p>
                    ⚠️ {resultado.erros}{' '}
                    linha(s) com erro:
                  </p>

                  <ul>
                    {(resultado.detalhes_erros || []).map(
                      (item, index) => (
                        <li key={index}>
                          Linha {item.linha}:{' '}
                          {item.erro}
                        </li>
                      )
                    )}
                  </ul>
                </>
              )}

            </div>
          )}

          {/* =====================================================
              AÇÕES
          ====================================================== */}

          <div className={styles.acoes}>

            <button
              onClick={onFechar}
              className={styles.btnCancelar}
              type="button"
            >
              Fechar
            </button>

            <button
              onClick={handleEnviar}
              disabled={!arquivo || carregando}
              className={styles.btnImportar}
              type="button"
            >
              {carregando
                ? 'Importando...'
                : 'Importar'}
            </button>

          </div>

        </div>
      </div>
    </div>
  )
}

export default ModalImportacaoCSV