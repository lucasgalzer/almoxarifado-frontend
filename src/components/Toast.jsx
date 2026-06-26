import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import styles from './Toast.module.css'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((mensagem, tipo = 'sucesso') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, mensagem, tipo }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className={styles.container}>
        {toasts.map(toast => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.tipo]}`}>
            <span className={styles.icone}>
              {toast.tipo === 'sucesso' && '✅'}
              {toast.tipo === 'erro' && '❌'}
              {toast.tipo === 'aviso' && '⚠️'}
              {toast.tipo === 'info' && 'ℹ️'}
            </span>
            <span className={styles.mensagem}>{toast.mensagem}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}