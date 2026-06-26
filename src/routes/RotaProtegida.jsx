import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

function RotaProtegida({ children, perfis }) {
  const { usuario } = useAuth()

  if (!usuario) return <Navigate to="/login" />

  if (perfis && !perfis.includes(usuario.perfil)) {
    if (usuario.perfil === 'solicitante') return <Navigate to="/solicitante" />
    return <Navigate to="/dashboard" />
  }

  return children
}

export default RotaProtegida