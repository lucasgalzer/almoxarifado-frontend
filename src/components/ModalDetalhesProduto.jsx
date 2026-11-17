import { useEffect, useState } from 'react'
import api from '../services/api'
import styles from './ModalDetalhesProduto.module.css'

function ModalDetalhesProduto({ produto, onFechar }) {
  const [dados, setDados] = useState(produto)
  const [camposCategoria, setCamposCategoria] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregarDetalhes() {
      setCarregando(true)
      setErro('')
      try {
        const { data } = await api.get(`/produtos/${produto.id}`)
        if (!ativo) return
        setDados(data)

        if (data.categoria_id) {
          const resposta = await api.get(`/categorias/${data.categoria_id}/campos`)
          if (ativo) setCamposCategoria(Array.isArray(resposta.data) ? resposta.data : [])
        } else {
          setCamposCategoria([])
        }
      } catch (error) {
        if (ativo) setErro(error.response?.data?.erro || 'Não foi possível carregar os detalhes do produto.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarDetalhes()
    return () => { ativo = false }
  }, [produto.id])

  const extras = typeof dados.campos_extras === 'string'
    ? (() => { try { return JSON.parse(dados.campos_extras) } catch { return {} } })()
    : (dados.campos_extras || {})

  function valorOuTraco(valor) {
    return valor !== null && valor !== undefined && valor !== '' ? valor : '—'
  }

  function formatarStatus(status) {
    const labels = {
      disponivel: 'Disponível',
      indisponivel: 'Indisponível',
      em_manutencao: 'Em manutenção'
    }
    return labels[status] || valorOuTraco(status)
  }

  function formatarTipo(tipo) {
    return tipo === 'consumivel' ? 'Consumível' : 'Reutilizável'
  }

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-detalhes-produto" onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>DETALHES DO PRODUTO</span>
            <h2 id="titulo-detalhes-produto">{dados.nome || produto.nome}</h2>
            <p>{dados.codigo_interno || produto.codigo_interno}</p>
          </div>
          <button type="button" className={styles.fechar} onClick={onFechar} aria-label="Fechar detalhes">×</button>
        </header>

        <div className={styles.conteudo}>
          {carregando && <p className={styles.estado}>Carregando informações do produto...</p>}
          {erro && <div className={styles.erro}>{erro}</div>}

          {!carregando && !erro && (
            <>
              <section className={styles.secao}>
                <h3>Informações gerais</h3>
                <div className={styles.grid}>
                  <div className={styles.campo}><span>Código interno</span><strong>{valorOuTraco(dados.codigo_interno)}</strong></div>
                  <div className={styles.campo}><span>Nome</span><strong>{valorOuTraco(dados.nome)}</strong></div>
                  <div className={styles.campo}><span>Categoria</span><strong>{valorOuTraco(dados.categoria_nome)}</strong></div>
                  <div className={styles.campo}><span>Tipo</span><strong>{formatarTipo(dados.tipo)}</strong></div>
                  <div className={styles.campo}><span>Status</span><strong>{formatarStatus(dados.status)}</strong></div>
                  <div className={styles.campo}><span>Unidade de medida</span><strong>{valorOuTraco(dados.unidade_medida)}</strong></div>
                  <div className={styles.campo}><span>Quantidade atual</span><strong>{valorOuTraco(dados.quantidade_atual)}</strong></div>
                  <div className={styles.campo}><span>Quantidade mínima</span><strong>{valorOuTraco(dados.quantidade_minima)}</strong></div>
                  <div className={styles.campo}><span>Localização física</span><strong>{valorOuTraco(dados.localizacao_fisica)}</strong></div>
                </div>
                <div className={styles.texto}><span>Descrição</span><p>{valorOuTraco(dados.descricao)}</p></div>
                <div className={styles.texto}><span>Observações</span><p>{valorOuTraco(dados.observacoes)}</p></div>
              </section>

              {camposCategoria.length > 0 && (
                <section className={styles.secao}>
                  <h3>Informações da categoria</h3>
                  <div className={styles.grid}>
                    {camposCategoria.map(campo => (
                      <div className={styles.campo} key={campo.nome}>
                        <span>{campo.label || campo.nome}</span>
                        <strong>{valorOuTraco(extras[campo.nome])}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <footer className={styles.rodape}>
          <button type="button" onClick={onFechar}>Fechar</button>
        </footer>
      </section>
    </div>
  )
}

export default ModalDetalhesProduto
