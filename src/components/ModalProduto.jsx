import { useState, useEffect } from 'react'
import api from '../services/api'
import { useToast } from './Toast'
import styles from './ModalProduto.module.css'

const TIPOS = [
  { value: 'consumivel', label: 'Consumível' },
  { value: 'reutilizavel', label: 'Reutilizável' },
]

function ModalProduto({ produto, onFechar, onSalvar }) {
  const { addToast } = useToast()
  const [categorias, setCategorias] = useState([])
  const [camposCategoria, setCamposCategoria] = useState([])
  const [tipoControle, setTipoControle] = useState('quantidade')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    codigo_interno: '',
    nome: '',
    descricao: '',
    categoria_id: '',
    tipo: 'consumivel',
    quantidade_atual: 0,
    quantidade_minima: 0,
    unidade_medida: 'un',
    localizacao_fisica: '',
    status: 'disponivel',
    observacoes: '',
  })

  const [camposExtras, setCamposExtras] = useState({})

  useEffect(() => {
    api.get('/categorias').then(({ data }) => setCategorias(data)).catch(console.error)

    if (produto) {
      setForm({
        codigo_interno: produto.codigo_interno || '',
        nome: produto.nome || '',
        descricao: produto.descricao || '',
        categoria_id: produto.categoria_id || '',
        tipo: produto.tipo || 'consumivel',
        quantidade_atual: produto.quantidade_atual || 0,
        quantidade_minima: produto.quantidade_minima || 0,
        unidade_medida: produto.unidade_medida || 'un',
        localizacao_fisica: produto.localizacao_fisica || '',
        status: produto.status || 'disponivel',
        observacoes: produto.observacoes || '',
      })

      if (produto.campos_extras) {
        const extras = typeof produto.campos_extras === 'string'
          ? JSON.parse(produto.campos_extras)
          : produto.campos_extras
        setCamposExtras(extras || {})
      }

      if (produto.categoria_id) {
        carregarCamposCategoria(produto.categoria_id)
      }
    }
  }, [produto])

  async function carregarCamposCategoria(categoriaId) {
    if (!categoriaId) {
      setCamposCategoria([])
      setTipoControle('quantidade')
      return
    }
    try {
      const [{ data: campos }, { data: cats }] = await Promise.all([
        api.get(`/categorias/${categoriaId}/campos`),
        api.get('/categorias'),
      ])
      const cat = cats.find(c => c.id === categoriaId)
      setTipoControle(cat?.tipo_controle || 'quantidade')
      setCamposCategoria(campos.map(c => ({
        ...c,
        opcoes: c.opcoes
          ? (typeof c.opcoes === 'string' ? JSON.parse(c.opcoes) : c.opcoes)
          : []
      })))
    } catch {
      setCamposCategoria([])
      setTipoControle('quantidade')
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'categoria_id') {
      setCamposExtras({})
      carregarCamposCategoria(value)
    }
  }

  function handleCampoExtra(nome, value) {
    setCamposExtras(prev => ({ ...prev, [nome]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!form.codigo_interno) return setErro('Código interno é obrigatório')
    if (!form.nome) return setErro('Nome é obrigatório')
    if (!form.tipo) return setErro('Tipo é obrigatório')
    if (!form.categoria_id) return setErro('Categoria é obrigatória')

    for (const campo of camposCategoria) {
      if (campo.obrigatorio && !camposExtras[campo.nome] && camposExtras[campo.nome] !== 0) {
        return setErro(`Campo "${campo.label}" é obrigatório`)
      }
    }

    setCarregando(true)
    try {
      const payload = {
        ...form,
        campos_extras: camposExtras,
        // Para controle individual, força quantidade 1 e mínimo 0
        quantidade_atual: tipoControle === 'individual' ? 1 : form.quantidade_atual,
        quantidade_minima: tipoControle === 'individual' ? 0 : form.quantidade_minima,
      }

      if (produto) {
        await api.put(`/produtos/${produto.id}`, payload)
      } else {
        await api.post('/produtos', payload)
      }
      addToast(produto ? 'Produto atualizado!' : 'Produto cadastrado!', 'sucesso')
      onSalvar()
    } catch (error) {
      const msg = error.response?.data?.erro || 'Erro ao salvar produto'
      setErro(msg)
      addToast(msg, 'erro')
    } finally {
      setCarregando(false)
    }
  }

  function renderCampoExtra(campo) {
    const valor = camposExtras[campo.nome] ?? ''

    if (campo.tipo === 'boolean') {
      return (
        <div className={styles.campo} key={campo.nome}>
          <label>{campo.label}{campo.obrigatorio ? ' *' : ''}</label>
          <select value={valor} onChange={e => handleCampoExtra(campo.nome, e.target.value)}>
            <option value="">Selecione</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </div>
      )
    }

    if (campo.tipo === 'select') {
      return (
        <div className={styles.campo} key={campo.nome}>
          <label>{campo.label}{campo.obrigatorio ? ' *' : ''}</label>
          <select value={valor} onChange={e => handleCampoExtra(campo.nome, e.target.value)}>
            <option value="">Selecione</option>
            {campo.opcoes.map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </div>
      )
    }

    if (campo.tipo === 'numero') {
      return (
        <div className={styles.campo} key={campo.nome}>
          <label>{campo.label}{campo.obrigatorio ? ' *' : ''}</label>
          <input
            type="number"
            value={valor}
            onChange={e => handleCampoExtra(campo.nome, e.target.value)}
            placeholder={campo.label}
          />
        </div>
      )
    }

    return (
      <div className={styles.campo} key={campo.nome}>
        <label>{campo.label}{campo.obrigatorio ? ' *' : ''}</label>
        <input
          type="text"
          value={valor}
          onChange={e => handleCampoExtra(campo.nome, e.target.value)}
          placeholder={campo.label}
        />
      </div>
    )
  }

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{produto ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button className={styles.btnFechar} onClick={onFechar}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {erro && <div className={styles.erro}>{erro}</div>}

          <div className={styles.grid2}>
            <div className={styles.campo}>
              <label>Código interno *</label>
              <input name="codigo_interno" value={form.codigo_interno} onChange={handleChange} placeholder="P001" />
            </div>
            <div className={styles.campo}>
              <label>Tipo *</label>
              <select name="tipo" value={form.tipo} onChange={handleChange}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.campo}>
            <label>Nome *</label>
            <input name="nome" value={form.nome} onChange={handleChange} placeholder="Nome do produto" />
          </div>

          <div className={styles.campo}>
            <label>Descrição</label>
            <input name="descricao" value={form.descricao} onChange={handleChange} placeholder="Descrição opcional" />
          </div>

          <div className={styles.campo}>
            <label>Categoria *</label>
            <select name="categoria_id" value={form.categoria_id} onChange={handleChange}>
              <option value="">Selecione uma categoria</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          {form.categoria_id && (
            <>
              {camposCategoria.length > 0 && (
                <div style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
                    Informações da categoria
                  </p>
                  {camposCategoria.map(campo => renderCampoExtra(campo))}
                </div>
              )}

              {tipoControle === 'quantidade' && (
                <div style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
                    Controle de estoque
                  </p>
                  <div className={styles.grid2}>
                    <div className={styles.campo}>
                      <label>Quantidade atual *</label>
                      <input type="number" name="quantidade_atual" value={form.quantidade_atual} onChange={handleChange} min="0" disabled={!!produto} />
                    </div>
                    <div className={styles.campo}>
                      <label>Quantidade mínima</label>
                      <input type="number" name="quantidade_minima" value={form.quantidade_minima} onChange={handleChange} min="0" />
                    </div>
                  </div>
                  <div className={styles.grid2}>
                    <div className={styles.campo}>
                      <label>Unidade de medida</label>
                      <select name="unidade_medida" value={form.unidade_medida} onChange={handleChange}>
                        {['un', 'cx', 'pct', 'resma', 'litro', 'kg', 'metro'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.campo}>
                      <label>Localização física</label>
                      <input name="localizacao_fisica" value={form.localizacao_fisica} onChange={handleChange} placeholder="Ex: Prateleira A1" />
                    </div>
                  </div>
                </div>
              )}

              {tipoControle === 'individual' && (
                <div style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
                    Controle individual
                  </p>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '12px', color: '#1d4ed8' }}>
                    Este item é controlado individualmente — sem controle de quantidade. Cada unidade física deve ser cadastrada separadamente.
                  </div>
                  <div className={styles.grid2}>
                    <div className={styles.campo}>
                      <label>Status</label>
                      <select name="status" value={form.status} onChange={handleChange}>
                        <option value="disponivel">Disponível</option>
                        <option value="indisponivel">Indisponível</option>
                      </select>
                    </div>
                    <div className={styles.campo}>
                      <label>Localização física</label>
                      <input name="localizacao_fisica" value={form.localizacao_fisica} onChange={handleChange} placeholder="Ex: Sala 01" />
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.campo}>
                <label>Observações</label>
                <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={2} placeholder="Observações opcionais" />
              </div>
            </>
          )}

          <div className={styles.acoes}>
            <button type="button" onClick={onFechar} className={styles.btnCancelar}>Cancelar</button>
            <button type="submit" disabled={carregando} className={styles.btnSalvar}>
              {carregando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalProduto