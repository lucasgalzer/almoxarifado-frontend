import { useState, useEffect } from 'react'
import api from '../services/api'
import ModalConfirmacao from '../components/ModalConfirmacao'
import { useToast } from '../components/Toast'
import styles from './Configuracoes.module.css'

function ajustarCor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent))
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

const TIPOS_CAMPO = [
  { value: 'texto', label: 'Texto' },
  { value: 'numero', label: 'Número' },
  { value: 'select', label: 'Seleção (lista)' },
  { value: 'boolean', label: 'Sim/Não' },
]

function Configuracoes() {
  const { addToast } = useToast()
  const [aba, setAba] = useState('categorias')
  const [categorias, setCategorias] = useState([])
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [logs, setLogs] = useState([])
  const [instituicao, setInstituicao] = useState(null)
  const [uploadando, setUploadando] = useState(false)
  const [aparencia, setAparencia] = useState({
    nome_exibicao: '',
    cor_primaria: '#7eb82c',
    cor_secundaria: '#2b3742',
    logo_base64: '',
  })

  const [novaCategoria, setNovaCategoria] = useState({ nome: '', descricao: '', tipo_controle: 'quantidade' })
  const [editandoCategoria, setEditandoCategoria] = useState(null)
  const [erroCategoria, setErroCategoria] = useState('')
  const [categoriaExcluindo, setCategoriaExcluindo] = useState(null)

  // Campos da categoria
  const [categoriaExpandida, setCategoriaExpandida] = useState(null)
  const [campos, setCampos] = useState([])
  const [carregandoCampos, setCarregandoCampos] = useState(false)
  const [salvandoCampos, setSalvandoCampos] = useState(false)

  const [estoqueMinimoEditando, setEstoqueMinimoEditando] = useState(null)
  const [novoMinimo, setNovoMinimo] = useState('')

  useEffect(() => {
    carregarCategorias()
    carregarProdutos()
    carregarLogs()
    carregarInstituicao()
  }, [])

  async function carregarInstituicao() {
    try {
      const { data } = await api.get('/instituicao')
      setInstituicao(data)
      setAparencia({
        nome_exibicao: data.nome_exibicao || '',
        cor_primaria: data.cor_primaria || '#7eb82c',
        cor_secundaria: data.cor_secundaria || '#2b3742',
        logo_base64: data.logo_base64 || '',
      })
    } catch (error) {
      console.error(error)
    }
  }

  async function carregarCategorias() {
    try {
      const { data } = await api.get('/categorias')
      setCategorias(data)
    } catch (error) {
      console.error(error)
    }
  }

  async function carregarProdutos() {
  try {
    const { data } = await api.get('/produtos', { params: { por_pagina: 'todos' } })
    setProdutos(data.dados)
  } catch (error) {
    console.error(error)
  }
}

  async function carregarLogs() {
    try {
      const { data } = await api.get('/audit-log')
      setLogs(data)
    } catch (error) {
      console.error(error)
    }
  }

  async function abrirCampos(cat) {
    if (categoriaExpandida?.id === cat.id) {
      setCategoriaExpandida(null)
      setCampos([])
      return
    }
    setCategoriaExpandida(cat)
    setCarregandoCampos(true)
    try {
      const { data } = await api.get(`/categorias/${cat.id}/campos`)
      setCampos(data.map(c => ({
        ...c,
        opcoes: c.opcoes ? (typeof c.opcoes === 'string' ? JSON.parse(c.opcoes) : c.opcoes) : [],
        opcoesTexto: c.opcoes ? (typeof c.opcoes === 'string' ? JSON.parse(c.opcoes) : c.opcoes).join(', ') : '',
      })))
    } catch {
      addToast('Erro ao carregar campos', 'erro')
    } finally {
      setCarregandoCampos(false)
    }
  }

  function adicionarCampo() {
    setCampos(prev => [...prev, {
      _novo: true,
      nome: '',
      label: '',
      tipo: 'texto',
      obrigatorio: false,
      opcoes: [],
      opcoesTexto: '',
    }])
  }

  function removerCampo(index) {
    setCampos(prev => prev.filter((_, i) => i !== index))
  }

  function atualizarCampo(index, field, value) {
    setCampos(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  async function salvarCampos() {
    setSalvandoCampos(true)
    try {
      const camposParaSalvar = campos.map(c => ({
        nome: c.nome,
        label: c.label,
        tipo: c.tipo,
        obrigatorio: c.obrigatorio,
        opcoes: c.tipo === 'select'
          ? c.opcoesTexto.split(',').map(o => o.trim()).filter(Boolean)
          : [],
      }))

      const invalidos = camposParaSalvar.filter(c => !c.nome || !c.label)
      if (invalidos.length > 0) {
        addToast('Preencha nome e label de todos os campos', 'erro')
        return
      }

      await api.put(`/categorias/${categoriaExpandida.id}/campos`, { campos: camposParaSalvar })
      addToast('Campos salvos com sucesso!', 'sucesso')
      abrirCampos(categoriaExpandida)
      abrirCampos(categoriaExpandida)
    } catch {
      addToast('Erro ao salvar campos', 'erro')
    } finally {
      setSalvandoCampos(false)
    }
  }

  async function salvarAparencia(e) {
    e.preventDefault()
    try {
      await api.put('/instituicao', aparencia)
      document.documentElement.style.setProperty('--color-primary', aparencia.cor_primaria)
      document.documentElement.style.setProperty('--color-primary-dark', ajustarCor(aparencia.cor_primaria, -20))
      document.documentElement.style.setProperty('--color-primary-light', ajustarCor(aparencia.cor_primaria, 20))
      document.documentElement.style.setProperty('--color-secondary', aparencia.cor_secundaria)
      addToast('Aparência atualizada com sucesso!', 'sucesso')
    } catch (error) {
      addToast('Erro ao salvar aparência', 'erro')
    }
  }

  async function handleUploadLogo(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      addToast('Imagem muito grande. Máximo 2MB', 'erro')
      return
    }
    setUploadando(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      setAparencia(prev => ({ ...prev, logo_base64: event.target.result }))
      setUploadando(false)
      addToast('Logo carregada! Clique em Salvar aparência para confirmar.', 'info')
    }
    reader.onerror = () => {
      addToast('Erro ao carregar logo', 'erro')
      setUploadando(false)
    }
    reader.readAsDataURL(file)
  }

  async function salvarCategoria(e) {
    e.preventDefault()
    setErroCategoria('')
    setCarregando(true)
    try {
      if (editandoCategoria) {
        await api.put(`/categorias/${editandoCategoria.id}`, novaCategoria)
        setEditandoCategoria(null)
        addToast('Categoria atualizada!', 'sucesso')
      } else {
        await api.post('/categorias', novaCategoria)
        addToast('Categoria criada!', 'sucesso')
      }
      setNovaCategoria({ nome: '', descricao: '' })
      carregarCategorias()
    } catch (error) {
      setErroCategoria(error.response?.data?.erro || 'Erro ao salvar categoria')
    } finally {
      setCarregando(false)
    }
  }

  async function excluirCategoria() {
    try {
      await api.delete(`/categorias/${categoriaExcluindo.id}`)
      addToast('Categoria excluída com sucesso', 'sucesso')
      setCategoriaExcluindo(null)
      carregarCategorias()
    } catch (error) {
      addToast(error.response?.data?.erro || 'Erro ao excluir', 'erro')
      setCategoriaExcluindo(null)
    }
  }

 function editarCategoria(cat) {
  setEditandoCategoria(cat)
  setNovaCategoria({ nome: cat.nome, descricao: cat.descricao || '', tipo_controle: cat.tipo_controle || 'quantidade' })
}

  async function salvarEstoqueMinimo(produto) {
    try {
      await api.put(`/produtos/${produto.id}`, {
        ...produto,
        quantidade_minima: parseInt(novoMinimo)
      })
      addToast('Estoque mínimo atualizado!', 'sucesso')
      setEstoqueMinimoEditando(null)
      setNovoMinimo('')
      carregarProdutos()
    } catch (error) {
      addToast(error.response?.data?.erro || 'Erro ao salvar', 'erro')
    }
  }

  const unidades = [...new Set(produtos.map(p => p.unidade_medida).filter(Boolean))].sort()

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    display: 'block',
    marginBottom: '5px'
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Configurações</h1>
          <p className={styles.subtitulo}>Gerencie categorias, unidades e estoque mínimo</p>
        </div>
      </div>

      <div className={styles.abas}>
        <button className={`${styles.aba} ${aba === 'categorias' ? styles.abaAtiva : ''}`} onClick={() => setAba('categorias')}>Categorias</button>
        <button className={`${styles.aba} ${aba === 'unidades' ? styles.abaAtiva : ''}`} onClick={() => setAba('unidades')}>Unidades de medida</button>
        <button className={`${styles.aba} ${aba === 'estoque_minimo' ? styles.abaAtiva : ''}`} onClick={() => setAba('estoque_minimo')}>Estoque mínimo</button>
        <button className={`${styles.aba} ${aba === 'aparencia' ? styles.abaAtiva : ''}`} onClick={() => setAba('aparencia')}>Aparência</button>
        <button className={`${styles.aba} ${aba === 'audit' ? styles.abaAtiva : ''}`} onClick={() => { setAba('audit'); carregarLogs() }}>Audit Log</button>
      </div>

      {aba === 'categorias' && (
        <div className={styles.conteudo}>
          <div className={styles.formBox}>
            <h2 className={styles.secaoTitulo}>{editandoCategoria ? 'Editar categoria' : 'Nova categoria'}</h2>
            <form onSubmit={salvarCategoria} className={styles.form}>
              {erroCategoria && <div className={styles.erro}>{erroCategoria}</div>}
              <div className={styles.formRow}>
  <input placeholder="Nome da categoria *" value={novaCategoria.nome} onChange={e => setNovaCategoria(prev => ({ ...prev, nome: e.target.value }))} className={styles.input} />
  <input placeholder="Descrição (opcional)" value={novaCategoria.descricao} onChange={e => setNovaCategoria(prev => ({ ...prev, descricao: e.target.value }))} className={styles.input} />
  <select
    value={novaCategoria.tipo_controle}
    onChange={e => setNovaCategoria(prev => ({ ...prev, tipo_controle: e.target.value }))}
    className={styles.input}
    style={{ maxWidth: '200px' }}
  >
    <option value="quantidade">Por quantidade</option>
    <option value="individual">Por unidade individual</option>
  </select>
  <button type="submit" disabled={carregando} className={styles.btnSalvar}>{carregando ? '...' : editandoCategoria ? 'Atualizar' : 'Adicionar'}</button>
  {editandoCategoria && (
    <button type="button" onClick={() => { setEditandoCategoria(null); setNovaCategoria({ nome: '', descricao: '', tipo_controle: 'quantidade' }) }} className={styles.btnCancelar}>Cancelar</button>
  )}
</div>
            </form>
          </div>

          <div className={styles.lista}>
            {categorias.length === 0 ? (
              <div className={styles.vazio}>Nenhuma categoria cadastrada.</div>
            ) : categorias.map(cat => (
              <div key={cat.id}>
                <div className={styles.itemLinha}>
                  <div className={styles.itemInfo}>
                    <strong>{cat.nome}</strong>
                    {cat.descricao && <span>{cat.descricao}</span>}
                  </div>
                  <div className={styles.itemAcoes}>
                    <button
                      onClick={() => abrirCampos(cat)}
                      className={styles.btnEditar}
                      style={categoriaExpandida?.id === cat.id ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
                    >
                      {categoriaExpandida?.id === cat.id ? 'Fechar campos' : 'Campos'}
                    </button>
                    <button onClick={() => editarCategoria(cat)} className={styles.btnEditar}>Editar</button>
                    <button onClick={() => setCategoriaExcluindo(cat)} className={styles.btnExcluir}>Excluir</button>
                  </div>
                </div>

                {categoriaExpandida?.id === cat.id && (
                  <div style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderTop: 'none', padding: '16px 18px', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>
                        Campos personalizados de "{cat.nome}"
                      </span>
                      <button onClick={adicionarCampo} style={{ padding: '5px 12px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        + Adicionar campo
                      </button>
                    </div>

                    {carregandoCampos ? (
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Carregando...</p>
                    ) : campos.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Nenhum campo cadastrado. Clique em "Adicionar campo" para começar.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                        {campos.map((campo, index) => (
                          <div key={index} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <input
                                value={campo.label}
                                onChange={e => atualizarCampo(index, 'label', e.target.value)}
                                placeholder="Label (ex: Marca)"
                                style={{ flex: 1, minWidth: '120px', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px', outline: 'none' }}
                              />
                              <input
                                value={campo.nome}
                                onChange={e => atualizarCampo(index, 'nome', e.target.value.toLowerCase().replace(/\s/g, '_'))}
                                placeholder="Nome interno (ex: marca)"
                                style={{ flex: 1, minWidth: '120px', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px', outline: 'none', fontFamily: 'monospace' }}
                              />
                              <select
                                value={campo.tipo}
                                onChange={e => atualizarCampo(index, 'tipo', e.target.value)}
                                style={{ padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px', outline: 'none' }}
                              >
                                {TIPOS_CAMPO.map(t => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={campo.obrigatorio}
                                  onChange={e => atualizarCampo(index, 'obrigatorio', e.target.checked)}
                                />
                                Obrigatório
                              </label>
                              <button onClick={() => removerCampo(index)} style={{ padding: '5px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', fontSize: '12px', cursor: 'pointer' }}>
                                ✕
                              </button>
                            </div>
                            {campo.tipo === 'select' && (
                              <input
                                value={campo.opcoesTexto}
                                onChange={e => atualizarCampo(index, 'opcoesTexto', e.target.value)}
                                placeholder="Opções separadas por vírgula (ex: Azul, Verde, Vermelho)"
                                style={{ padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px', outline: 'none', width: '100%' }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={salvarCampos}
                      disabled={salvandoCampos}
                      style={{ padding: '8px 20px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: salvandoCampos ? 0.7 : 1 }}
                    >
                      {salvandoCampos ? 'Salvando...' : 'Salvar campos'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {aba === 'unidades' && (
        <div className={styles.conteudo}>
          <div className={styles.formBox}>
            <h2 className={styles.secaoTitulo}>Unidades de medida em uso</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>As unidades são definidas no cadastro de cada produto.</p>
          </div>
          <div className={styles.lista}>
            {unidades.length === 0 ? (
              <div className={styles.vazio}>Nenhuma unidade cadastrada ainda.</div>
            ) : unidades.map(u => (
              <div key={u} className={styles.itemLinha}>
                <div className={styles.itemInfo}>
                  <strong>{u}</strong>
                  <span>{produtos.filter(p => p.unidade_medida === u).length} produto(s) usando</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {aba === 'estoque_minimo' && (
        <div className={styles.conteudo}>
          <div className={styles.formBox}>
            <h2 className={styles.secaoTitulo}>Estoque mínimo por produto</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '0' }}>Quando o estoque atingir ou ficar abaixo do mínimo, um alerta aparecerá no dashboard.</p>
          </div>
          <div className={styles.tabela}>
            <table>
              <thead>
                <tr><th>Código</th><th>Produto</th><th>Tipo</th><th>Qtd. Atual</th><th>Qtd. Mínima</th><th>Situação</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p.id} className={p.quantidade_atual <= p.quantidade_minima ? styles.rowAlerta : ''}>
                    <td>{p.codigo_interno}</td>
                    <td>{p.nome}</td>
                    <td>{p.tipo === 'consumivel' ? 'Consumível' : 'Reutilizável'}</td>
                    <td>{p.quantidade_atual} {p.unidade_medida}</td>
                    <td>
                      {estoqueMinimoEditando === p.id ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input type="number" min="0" value={novoMinimo} onChange={e => setNovoMinimo(e.target.value)} className={styles.inputMinimo} autoFocus />
                          <button onClick={() => salvarEstoqueMinimo(p)} className={styles.btnSalvarInline}>✓</button>
                          <button onClick={() => setEstoqueMinimoEditando(null)} className={styles.btnCancelarInline}>✕</button>
                        </div>
                      ) : (
                        <span>{p.quantidade_minima} {p.unidade_medida}</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${p.quantidade_atual === 0 ? styles.badgeZerado : p.quantidade_atual <= p.quantidade_minima ? styles.badgeBaixo : styles.badgeOk}`}>
                        {p.quantidade_atual === 0 ? 'Zerado' : p.quantidade_atual <= p.quantidade_minima ? 'Baixo' : 'Normal'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => { setEstoqueMinimoEditando(p.id); setNovoMinimo(p.quantidade_minima) }} className={styles.btnEditar}>Alterar mínimo</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {aba === 'aparencia' && (
        <div className={styles.conteudo}>
          <div className={styles.formBox}>
            <h2 className={styles.secaoTitulo}>Identidade visual da escola</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>Personalize as cores e o nome exibido no sistema.</p>
            <form onSubmit={salvarAparencia} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nome exibido no menu</label>
                <input className={styles.input} value={aparencia.nome_exibicao} onChange={e => setAparencia(prev => ({ ...prev, nome_exibicao: e.target.value }))} placeholder={instituicao?.nome || 'Nome da escola'} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Cor primária</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={aparencia.cor_primaria} onChange={e => setAparencia(prev => ({ ...prev, cor_primaria: e.target.value }))} style={{ width: '48px', height: '38px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', padding: '2px' }} />
                    <input className={styles.input} value={aparencia.cor_primaria} onChange={e => setAparencia(prev => ({ ...prev, cor_primaria: e.target.value }))} placeholder="#7eb82c" style={{ flex: 1 }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Cor da sidebar</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={aparencia.cor_secundaria} onChange={e => setAparencia(prev => ({ ...prev, cor_secundaria: e.target.value }))} style={{ width: '48px', height: '38px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', padding: '2px' }} />
                    <input className={styles.input} value={aparencia.cor_secundaria} onChange={e => setAparencia(prev => ({ ...prev, cor_secundaria: e.target.value }))} placeholder="#2b3742" style={{ flex: 1 }} />
                  </div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Logo da escola</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {aparencia.logo_base64 && (
                    <img src={aparencia.logo_base64} alt="Logo" style={{ height: '56px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: '6px', background: 'white', alignSelf: 'flex-start' }} />
                  )}
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '600', cursor: uploadando ? 'not-allowed' : 'pointer', width: 'fit-content', opacity: uploadando ? 0.7 : 1 }}>
                    {uploadando ? 'Carregando...' : aparencia.logo_base64 ? 'Trocar imagem' : 'Selecionar imagem'}
                    <input type="file" accept="image/*" onChange={handleUploadLogo} style={{ display: 'none' }} disabled={uploadando} />
                  </label>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>PNG, JPG ou SVG — máximo 2MB. Salve a aparência para confirmar.</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', padding: '14px', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', background: aparencia.cor_primaria, borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                <div style={{ flex: 1, background: aparencia.cor_secundaria, borderRadius: 'var(--radius-md)', height: '40px' }} />
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Pré-visualização</span>
              </div>
              <div>
                <button type="submit" className={styles.btnSalvar} style={{ padding: '9px 20px' }}>Salvar aparência</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {aba === 'audit' && (
        <div className={styles.conteudo}>
          <div className={styles.formBox}>
            <h2 className={styles.secaoTitulo}>Registro de ações do sistema</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Últimas 200 ações registradas. Apenas administradores têm acesso.</p>
          </div>
          <div className={styles.tabela}>
            <table>
              <thead>
                <tr><th>Data</th><th>Usuário</th><th>Ação</th><th>Tabela</th></tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>Nenhum registro ainda.</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                    <td>{log.usuario_nome || '—'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeOk}`} style={{ background: '#eff6ff', color: '#2563eb' }}>{log.acao}</span>
                    </td>
                    <td>{log.tabela_afetada}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {categoriaExcluindo && (
        <ModalConfirmacao
          titulo="Excluir categoria"
          mensagem={`Tem certeza que deseja excluir "${categoriaExcluindo.nome}"? Esta ação não pode ser desfeita.`}
          onConfirmar={excluirCategoria}
          onCancelar={() => setCategoriaExcluindo(null)}
        />
      )}
    </div>
  )
}

export default Configuracoes