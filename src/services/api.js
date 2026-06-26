import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3333'
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      localStorage.removeItem('token_super_admin')
      localStorage.removeItem('usuario_super_admin')
      window.location.href = '/login'
    }

    if (error.response?.status === 403) {
      const msg = error.response?.data?.erro || ''
      if (msg.includes('desativada')) {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        window.location.href = '/login?erro=instituicao_desativada'
      }
    }

    return Promise.reject(error)
  }
)

export default api