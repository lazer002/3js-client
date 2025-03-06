import { Suspense, lazy, useContext, useState, useEffect } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { authContext } from './context/useContext.jsx'
import Layout from './components/Layout'
import './App.css'

const Signin = lazy(() => import('./pages/Signin'))
const Home = lazy(() => import('./pages/Home'))

const ProtectedRoute = ({ children }) => {
  const { auth } = useContext(authContext)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center opacity-80">
        <img 
          src="/3d/logo.png" 
          alt="Loading..." 
          className=" object-contain size-48 animate-bounce"
        />
      </div>
    );
  }
  

  return auth ? <Layout>{children}</Layout> : <Navigate to="/signin" />
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  )
}

export default App
