import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RotaProtegida from './routes/RotaProtegida'
import RotaMenu from './routes/RotaMenu'
import Produtos from './pages/Produtos'
import Pessoas from './pages/Pessoas'
import Estoque from './pages/Estoque'
import Emprestimos from './pages/Emprestimos'
import Solicitacoes from './pages/Solicitacoes'
import Manutencao from './pages/Manutencao'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Usuarios from './pages/Usuarios'
import Solicitante from './pages/Solicitante'
import SuperAdmin from './pages/SuperAdmin'
import useAuth from './hooks/useAuth'
import EmprestimosFixos from './pages/EmprestimosFixos'

function RedirecionarPorPerfil() {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" />
  if (usuario.super_admin) return <Navigate to="/super-admin" />
  if (usuario.perfil === 'solicitante') return <Navigate to="/solicitante" />
  return <Navigate to="/dashboard" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/super-admin" element={
          <RotaProtegida>
            <SuperAdmin />
          </RotaProtegida>
        } />

        <Route path="/solicitante" element={
          <RotaProtegida perfis={['solicitante']}>
            <Solicitante />
          </RotaProtegida>
        } />

        <Route path="/" element={
          <RotaProtegida perfis={['admin', 'operador']}>
            <Layout />
          </RotaProtegida>
        }>
          <Route index element={<RedirecionarPorPerfil />} />
          <Route path="dashboard" element={<Dashboard />} />

<Route
  path="produtos"
  element={
    <RotaMenu menu="produtos">
      <Produtos />
    </RotaMenu>
  }
/>

<Route
  path="pessoas"
  element={
    <RotaMenu menu="pessoas">
      <Pessoas />
    </RotaMenu>
  }
/>

<Route
  path="estoque"
  element={
    <RotaMenu menu="estoque">
      <Estoque />
    </RotaMenu>
  }
/>

<Route
  path="emprestimos"
  element={
    <RotaMenu menu="emprestimos">
      <Emprestimos />
    </RotaMenu>
  }
/>

<Route
  path="solicitacoes"
  element={
    <RotaMenu menu="solicitacoes">
      <Solicitacoes />
    </RotaMenu>
  }
/>

<Route
  path="manutencao"
  element={
    <RotaMenu menu="manutencao">
      <Manutencao />
    </RotaMenu>
  }
/>

<Route
  path="relatorios"
  element={
    <RotaMenu menu="relatorios">
      <Relatorios />
    </RotaMenu>
  }
/>

<Route
  path="configuracoes"
  element={
    <RotaMenu menu="configuracoes">
      <Configuracoes />
    </RotaMenu>
  }
/>

<Route
  path="usuarios"
  element={
    <RotaMenu menu="usuarios">
      <Usuarios />
    </RotaMenu>
  }
/>

<Route
  path="emprestimos-fixos"
  element={
    <RotaMenu menu="emprestimos-fixos">
      <EmprestimosFixos />
    </RotaMenu>
  }
/>
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App