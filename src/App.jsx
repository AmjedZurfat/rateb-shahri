import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('landing')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setLoading(false)
      if (session?.user) setPage('dashboard')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
      if (session?.user) setPage('dashboard')
      else setPage('landing')
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)', fontSize: 16 }}>
      جاري التحميل...
    </div>
  )

  if (page === 'dashboard' && user) return <Dashboard user={user} onLogout={() => { supabase.auth.signOut(); setPage('landing') }} />
  if (page === 'login') return <Login onBack={() => setPage('landing')} onSuccess={() => setPage('dashboard')} />
  return <Landing onLogin={() => setPage('login')} />
}
