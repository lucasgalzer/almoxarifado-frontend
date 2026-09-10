import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../services/api'

function RotaMenu({ menu, children }) {
  const [permitido, setPermitido] = useState(null)

  useEffect(() => {
    async function verificarPermissao() {
      try {
        const { data } = await api.get('/instituicao')

        const menus = Array.isArray(data.menus) ? data.menus : []

        setPermitido(menus.includes(menu))
      } catch (error) {
        console.error('Erro ao verificar permissão do menu:', error)
        setPermitido(false)
      }
    }

    verificarPermissao()
  }, [menu])

  if (permitido === null) {
    return null
  }

  if (!permitido) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default RotaMenu