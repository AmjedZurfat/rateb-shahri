import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login({ onBack, onSuccess }) {
  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
      if (error) setError(error.message)
      else setSuccess('تم إنشاء الحساب! تحقق من بريدك للتفعيل ثم سجّل دخول')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('البريد أو كلمة المرور غير صحيحة')
      else onSuccess()
    }
    setLoading(false)
  }

  const inp = { width: '100%', background: 'var(--s2)', border: '1px solid var(--bd2)', borderRadius: 9, color: 'var(--t1)', padding: '11px 13px', fontSize: 14, outline: 'none', marginBottom: 14 }
  const lbl = { fontSize: 11, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--bd2)', borderRadius: 18, padding: '36px 32px', width: '100%', maxWidth: 420 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer', fontSize: 13, marginBottom: 20 }}>← رجوع</button>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>💰</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--t1)', marginBottom: 4 }}>الراتب الشهري</h1>
          <p style={{ fontSize: 13, color: 'var(--t2)' }}>{mode === 'signup' ? 'أنشئ حسابك مجاناً' : 'مرحباً بعودتك'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div><label style={lbl}>الاسم</label><input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="اسمك الكامل" required /></div>
          )}
          <div><label style={lbl}>البريد الإلكتروني</label><input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" required /></div>
          <div><label style={lbl}>كلمة المرور</label><input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} /></div>

          {error && <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--red)', marginBottom: 14 }}>{error}</div>}
          {success && <div style={{ background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--grn)', marginBottom: 14 }}>{success}</div>}

          <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? 'var(--s3)' : 'var(--acc)', color: '#fff', border: 'none', borderRadius: 9, padding: 12, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 16 }}>
            {loading ? '...' : mode === 'signup' ? 'إنشاء الحساب مجاناً' : 'تسجيل الدخول'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--t2)' }}>
          {mode === 'signup' ? 'عندك حساب؟ ' : 'ما عندك حساب؟ '}
          <button onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setSuccess('') }} style={{ color: 'var(--acc)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            {mode === 'signup' ? 'سجّل دخول' : 'إنشاء حساب مجاني'}
          </button>
        </p>
      </div>
    </div>
  )
}
