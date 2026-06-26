import styles from './ModalConfirmacao.module.css'

function ModalConfirmacao({ titulo, mensagem, onConfirmar, onCancelar, tipo = 'perigo' }) {
  return (
    <div className={styles.overlay} onClick={onCancelar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={`${styles.icone} ${styles[tipo]}`}>
          {tipo === 'perigo' ? '!' : '?'}
        </div>
        <h2 className={styles.titulo}>{titulo}</h2>
        <p className={styles.mensagem}>{mensagem}</p>
        <div className={styles.acoes}>
          <button className={styles.btnCancelar} onClick={onCancelar}>
            Cancelar
          </button>
          <button className={`${styles.btnConfirmar} ${styles[`btn_${tipo}`]}`} onClick={onConfirmar}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalConfirmacao