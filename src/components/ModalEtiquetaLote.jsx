import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import styles from './ModalEtiqueta.module.css'

function ModalEtiquetaLote({ produtos, onFechar }) {
  const svgRefs = useRef([])

  useEffect(() => {
    produtos.forEach((produto, i) => {
      if (svgRefs.current[i]) {
        JsBarcode(svgRefs.current[i], produto.codigo_interno, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 8,
          background: '#ffffff',
          lineColor: '#000000',
        })
      }
    })
  }, [produtos])

  async function handleImprimir() {
    const svgs = svgRefs.current.map(el => el?.outerHTML || '')

    let logoHTML = ''
    try {
      const response = await fetch('/uploadlogo/Prancheta 1.png')
      const blob = await response.blob()
      const base64 = await new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      })
      logoHTML = `<img src="${base64}" style="height:20px; object-fit:contain; margin-bottom:4px;" />`
    } catch {
      logoHTML = '<p class="escola">Colégio Teutônia</p>'
    }

    const etiquetasHTML = produtos.map((produto, i) => `
      <div class="etiqueta">
        ${logoHTML}
        ${svgs[i]}
      </div>
    `).join('')

    const janela = window.open('', '_blank')
    janela.document.write(`
      <html>
        <head>
          <title>Etiquetas em Lote</title>
        <style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: sans-serif; padding: 10px; }
  .grade { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .etiqueta { 
    border: none; 
    border-radius: 8px; 
    padding: 10px; 
    text-align: center; 
    background: white; 
    display: flex; 
    flex-direction: column; 
    align-items: center;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .nome { font-size: 11px; font-weight: 700; color: #111; margin-top: 4px; }
  .info { font-size: 9px; color: #666; margin-top: 2px; }
  .escola { font-size: 9px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  svg { max-width: 100%; height: auto; }
  @media print { 
    body { padding: 4px; } 
    .grade { gap: 6px; } 
  }
</style>
        </head>
        <body>
          <div class="grade">${etiquetasHTML}</div>
          <script>window.onload = () => { window.print(); window.close() }<\/script>
        </body>
      </html>
    `)
    janela.document.close()
  }

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.modal} style={{ maxWidth: '660px' }} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Etiquetas em lote ({produtos.length})</h2>
          <button className={styles.btnFechar} onClick={onFechar}>✕</button>
        </div>

        <div className={styles.body} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {produtos.map((produto, i) => (
              <div key={produto.id} style={{ border: '1px dashed #ccc', borderRadius: '8px', padding: '10px', textAlign: 'center', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src="/uploadlogo/Prancheta 1.png"
                  alt="Logo"
                  style={{ height: '20px', objectFit: 'contain', marginBottom: '4px' }}
                  onError={e => e.target.style.display = 'none'}
                />
                <svg ref={el => svgRefs.current[i] = el} style={{ maxWidth: '100%' }} />
                
              </div>
            ))}
          </div>
        </div>

        <div className={styles.acoes}>
          <button onClick={onFechar} className={styles.btnCancelar}>Fechar</button>
          <button onClick={handleImprimir} className={styles.btnImprimir}>
            Imprimir todas ({produtos.length})
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalEtiquetaLote