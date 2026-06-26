function parseJwt(token) {
  try {
    const base64 = token.split('.')[1]
    const decoded = JSON.parse(atob(base64))
    return decoded
  } catch {
    return null
  }
}

function useAuth() {
  const token = localStorage.getItem('token')
  const decoded = token ? parseJwt(token) : null

  const usuario = decoded ? {
    id: decoded.id,
    nome: decoded.nome,
    email: decoded.email,
    perfil: decoded.perfil,
    instituicao_id: decoded.instituicao_id,
    super_admin: decoded.super_admin,
    acessando_como: decoded.acessando_como,
  } : null

  const autenticado = !!token

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('token_super_admin')
    localStorage.removeItem('usuario')
    localStorage.removeItem('usuario_super_admin')
  }

  return { token, usuario, autenticado, logout }
}

export default useAuth