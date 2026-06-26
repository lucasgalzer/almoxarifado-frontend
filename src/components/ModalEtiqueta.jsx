import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import styles from './ModalEtiqueta.module.css'

function ModalEtiqueta({ produto, onFechar }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (svgRef.current && produto?.codigo_interno) {
      JsBarcode(svgRef.current, produto.codigo_interno, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000',
      })
    }
  }, [produto])

  function handleImprimir() {
    const conteudo = document.getElementById('etiqueta-print').innerHTML
    const janela = window.open('', '_blank')
    janela.document.write(`
      <html>
        <head>
          <title>Etiqueta — ${produto.codigo_interno}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; }
            .etiqueta { border: 1px solid #ccc; border-radius: 8px; padding: 16px 20px; text-align: center; width: 280px; }
            .escola { font-size: 11px; color: #666; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .nome { font-size: 13px; font-weight: 700; color: #111; margin-top: 6px; }
            .info { font-size: 11px; color: #666; margin-top: 2px; }
            svg { max-width: 100%; }
          </style>
        </head>
        <body>
          ${conteudo}
          <script>window.onload = () => { window.print(); window.close() }<\/script>
        </body>
      </html>
    `)
    janela.document.close()
  }

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Etiqueta do produto</h2>
          <button className={styles.btnFechar} onClick={onFechar}>✕</button>
        </div>

        <div className={styles.body}>
          <div id="etiqueta-print" className={styles.etiqueta}>
            <p className={styles.escola}>Colégio Teutônia</p>
            <svg ref={svgRef} />
            <p className={styles.nome}>{produto.nome}</p>
            
          </div>
        </div>

        <div className={styles.acoes}>
          <button onClick={onFechar} className={styles.btnCancelar}>Fechar</button>
          <button onClick={handleImprimir} className={styles.btnImprimir}>Imprimir etiqueta</button>
        </div>
      </div>
    </div>
  )
}

export default ModalEtiqueta