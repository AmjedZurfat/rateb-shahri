import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

const COLORS = ['#4f8ef7','#2ecc71','#f39c12','#e74c3c','#7c6af7','#1abc9c','#e67e22','#9b59b6','#00b0ff','#ff4081']
const EMOJIS = ['💼','💵','💰','🏠','🏦','📦','🚗','👶','👩','🛒','⚡','💡','💧','📡','➕','📋','🎯','💳','🏪','🎓','💊','✈️','🎮','📱','🍽️','🎁','🔧','☕','🍕','🏥','⛽']
const DAY_CATS = ['طعام وشراب','مواصلات','تسوق','صحة','ترفيه','أخرى']
const CAT_LBL = { income:'واردات', fixed:'ثابتة', family:'أسرة', savings:'ادخار', monthlyBudget:'مصرف' }

const fmt = n => Math.round(n).toLocaleString('ar-IQ') + ' IQD'
const todayStr = () => new Date().toISOString().split('T')[0]
const fmtDate = d => { const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}` }

export default function Dashboard({ user, onLogout }) {
  const [fields, setFields] = useState([])
  const [dailyExp, setDailyExp] = useState([])
  const [budgetEntries, setBudgetEntries] = useState([])
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState('dash')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [mName, setMName] = useState('')
  const [mIcon, setMIcon] = useState('💼')
  const [dDate, setDDate] = useState(todayStr())
  const [dDesc, setDDesc] = useState('')
  const [dAmt, setDAmt] = useState('')
  const [dCat, setDCat] = useState('طعام وشراب')
  const [dIco, setDIco] = useState('🍽️')
  const [dayFilter, setDayFilter] = useState('')
  const [expCat, setExpCat] = useState('fixed')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    const load = async () => {
      const [{ data: prof }, { data: flds }, { data: daily }, { data: budget }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('fields').select('*').eq('user_id', user.id).order('sort_order'),
        supabase.from('daily_expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('budget_entries').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      ])
      setProfile(prof)
      setFields(flds || [])
      setDailyExp(daily || [])
      setBudgetEntries(budget || [])
      setLoading(false)
    }
    load()
  }, [user.id])

  const bycat = cat => fields.filter(f => f.category === cat)
  const tInc = () => bycat('income').reduce((a,b) => a+b.amount, 0)
  const tMonth = () => [...bycat('fixed'),...bycat('family'),...bycat('savings')].reduce((a,b) => a+b.amount, 0)
  const tDaily = () => dailyExp.reduce((a,b) => a+b.amount, 0)
  const tBudget = () => budgetEntries.reduce((a,b) => a+b.amount, 0)
  const tAll = () => tMonth() + tDaily() + tBudget()
  const bal = () => tInc() - tAll()
  const budgetSpent = fid => budgetEntries.filter(e => e.field_id === fid).reduce((a,b) => a+b.amount, 0)

  const updateAmount = async (id, amount) => {
    setFields(prev => prev.map(f => f.id === id ? {...f, amount} : f))
    await supabase.from('fields').update({ amount }).eq('id', id)
  }

  const updateBudget = async (id, budget) => {
    setFields(prev => prev.map(f => f.id === id ? {...f, budget} : f))
    await supabase.from('fields').update({ budget }).eq('id', id)
  }

  const saveField = async () => {
    if (!mName.trim()) return
    if (modal.mode === 'add') {
      const { data } = await supabase.from('fields').insert({ user_id: user.id, category: modal.cat, name: mName.trim(), icon: mIcon, amount: 0, budget: 0, sort_order: fields.filter(f=>f.category===modal.cat).length }).select().single()
      if (data) setFields(prev => [...prev, data])
    } else {
      await supabase.from('fields').update({ name: mName.trim(), icon: mIcon }).eq('id', modal.item.id)
      setFields(prev => prev.map(f => f.id === modal.item.id ? {...f, name: mName.trim(), icon: mIcon} : f))
    }
    setModal(null)
  }

  const delField = async (id) => {
    if (!confirm('حذف هذا الحقل؟')) return
    await supabase.from('fields').delete().eq('id', id)
    setFields(prev => prev.filter(f => f.id !== id))
  }

  const addDaily = async () => {
    if (!dDesc.trim() || !dAmt) return
    const { data } = await supabase.from('daily_expenses').insert({ user_id: user.id, date: dDate, description: dDesc.trim(), category: dCat, icon: dIco, amount: parseFloat(dAmt) }).select().single()
    if (data) setDailyExp(prev => [data, ...prev])
    setDDesc(''); setDAmt('')
  }

  const delDaily = async (id) => {
    await supabase.from('daily_expenses').delete().eq('id', id)
    setDailyExp(prev => prev.filter(e => e.id !== id))
  }

  const addBudgetEntry = async (fieldId, date, amount, note) => {
    if (!amount) return
    const { data } = await supabase.from('budget_entries').insert({ user_id: user.id, field_id: fieldId, date, amount, note }).select().single()
    if (data) setBudgetEntries(prev => [data, ...prev])
  }

  const delBudgetEntry = async (id) => {
    await supabase.from('budget_entries').delete().eq('id', id)
    setBudgetEntries(prev => prev.filter(e => e.id !== id))
  }

  const runAI = async () => {
    setAiLoading(true); setAiError(''); setAiResult('')
    const incD = bycat('income').filter(f=>f.amount>0).map(f=>`${f.name}: ${f.amount.toLocaleString()} IQD`).join('، ') || 'لا شيء'
    const expD = [...bycat('fixed'),...bycat('family'),...bycat('savings')].filter(f=>f.amount>0).map(f=>`${f.name}: ${f.amount.toLocaleString()} IQD`).join('، ') || 'لا شيء'
    const catT = {}
    dailyExp.forEach(e => { catT[e.category] = (catT[e.category]||0) + e.amount })
    const dayD = Object.entries(catT).map(([c,v])=>`${c}: ${v.toLocaleString()} IQD`).join('، ') || 'لا شيء'
    const prompt = `أنت مستشار مالي عراقي خبير. حلل هذا الوضع المالي الشهري:\nالواردات: ${fmt(tInc())} — ${incD}\nالمصروفات الشهرية: ${fmt(tMonth())} — ${expD}\nالمصاريف اليومية: ${fmt(tDaily())} — ${dayD}\nمصرف البنود: ${fmt(tBudget())}\nالرصيد: ${fmt(bal())} (${bal()>=0?'فائض':'عجز'})\n\nأعطني: 1) تحليل موجز 2) أبرز ملاحظة 3) 3 نصائح عملية لزيادة الدخل في العراق 4) خطة ادخار مقترحة. اكتب بالعربية.`
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }) })
      const data = await res.json()
      if (!res.ok) { setAiError(data.error || 'خطأ'); setAiLoading(false); return }
      setAiResult(data.result)
      if (data.plan === 'free') setAiError(`استخدمت ${data.calls_used} من ${data.calls_limit} طلبات مجانية هذا الشهر`)
    } catch(e) { setAiError(e.message) }
    setAiLoading(false)
  }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t2)'}}>جاري التحميل...</div>

  const C = {
    app: { display:'flex', height:'100vh', overflow:'hidden' },
    sb: { width:220, background:'var(--s1)', borderLeft:'1px solid var(--bd)', display:'flex', flexDirection:'column', flexShrink:0 },
    main: { flex:1, overflowY:'auto', padding:'22px 26px' },
    card: { background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:13, padding:16, marginBottom:13 },
    th: { background:'var(--s2)', padding:'9px 12px', fontSize:10, fontWeight:700, color:'var(--t2)', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid var(--bd)', textAlign:'right' },
    td: { padding:'9px 12px', borderBottom:'1px solid var(--bd)', fontSize:12, verticalAlign:'middle' },
    inp: { background:'var(--s2)', border:'1px solid var(--bd2)', borderRadius:8, color:'var(--t1)', padding:'8px 11px', fontSize:12, outline:'none', width:'100%' },
    btnBlue: { background:'var(--acc)', color:'#fff', border:'none', borderRadius:9, padding:'8px 14px', fontSize:12, fontWeight:700, cursor:'pointer' },
    btnGray: { background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:7, padding:'4px 9px', fontSize:11, color:'var(--t2)', cursor:'pointer' },
  }

  const navItems = [['dash','📊','لوحة التحكم'],['inc','💵','الواردات'],['exp','🧾','المصروفات الشهرية'],['daily','📅','المصاريف اليومية'],['budget','🏷️','مصرف الشهري'],['ai','🤖','الذكاء الاصطناعي'],['hist','📈','السجل']]

  const FieldRow = ({ f, showCat }) => {
    const [val, setVal] = useState(String(f.amount || ''))
    return (
      <tr>
        <td style={{...C.td, fontSize:18}}>{f.icon}</td>
        <td style={{...C.td, fontWeight:600}}>{f.name}</td>
        {showCat && <td style={C.td}><span style={{background:'rgba(79,142,247,.15)',color:'var(--acc)',padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700}}>{CAT_LBL[f.category]}</span></td>}
        <td style={C.td}><input style={{...C.inp, width:140, textAlign:'left'}} type="number" value={val} onChange={e=>setVal(e.target.value)} onBlur={e=>updateAmount(f.id, parseFloat(e.target.value)||0)} placeholder="0"/></td>
        <td style={C.td}>
          <div style={{display:'flex',gap:4}}>
            <button style={C.btnGray} onClick={()=>{setModal({mode:'edit',cat:f.category,item:f});setMName(f.name);setMIcon(f.icon)}}>✏️</button>
            <button style={{...C.btnGray,color:'var(--red)'}} onClick={()=>delField(f.id)}>🗑️</button>
          </div>
        </td>
      </tr>
    )
  }

  const BudgetCard = ({ f }) => {
    const [bDate, setBDate] = useState(todayStr())
    const [bAmt, setBAmt] = useState('')
    const [bNote, setBNote] = useState('')
    const [budVal, setBudVal] = useState(String(f.budget || ''))
    const spent = budgetSpent(f.id)
    const pct = f.budget > 0 ? Math.min(100, Math.round(spent/f.budget*100)) : 0
    const over = f.budget > 0 && spent > f.budget
    const entries = budgetEntries.filter(e => e.field_id === f.id).sort((a,b) => b.date.localeCompare(a.date))
    return (
      <div style={{...C.card, borderColor: over?'rgba(231,76,60,.3)':'var(--bd)'}}>
        <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:8}}>
          <span style={{fontSize:22}}>{f.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700}}>{f.name}</div>
            <div style={{fontSize:11,color:'var(--t2)'}}>مُنفَق: <span style={{color:over?'var(--red)':'var(--grn)',fontWeight:700}}>{fmt(spent)}</span>{f.budget>0?` / ميزانية: `+fmt(f.budget):''}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <input type="number" value={budVal} placeholder="الميزانية" onChange={e=>setBudVal(e.target.value)} onBlur={e=>updateBudget(f.id,parseFloat(e.target.value)||0)} style={{...C.inp,width:120,textAlign:'left',fontSize:11}}/>
            {over && <span style={{background:'rgba(231,76,60,.15)',color:'var(--red)',borderRadius:5,padding:'1px 7px',fontSize:9,fontWeight:700}}>تجاوز!</span>}
            <button style={C.btnGray} onClick={()=>{setModal({mode:'edit',cat:f.category,item:f});setMName(f.name);setMIcon(f.icon)}}>✏️</button>
            <button style={{...C.btnGray,color:'var(--red)'}} onClick={()=>delField(f.id)}>🗑️</button>
          </div>
        </div>
        {f.budget>0 && <div style={{height:4,background:'var(--s2)',borderRadius:4,marginBottom:10}}><div style={{width:`${pct}%`,height:'100%',background:over?'var(--red)':'var(--grn)',borderRadius:4}}/></div>}
        <div style={{display:'grid',gridTemplateColumns:'130px 1fr 110px auto',gap:8,alignItems:'flex-end',marginBottom:8}}>
          <div><div style={{fontSize:9,color:'var(--t2)',marginBottom:4}}>التاريخ</div><input type="date" value={bDate} onChange={e=>setBDate(e.target.value)} style={{...C.inp,fontSize:11}}/></div>
          <div><div style={{fontSize:9,color:'var(--t2)',marginBottom:4}}>ملاحظة</div><input value={bNote} onChange={e=>setBNote(e.target.value)} placeholder="اختياري" style={{...C.inp,fontSize:11}}/></div>
          <div><div style={{fontSize:9,color:'var(--t2)',marginBottom:4}}>المبلغ</div><input type="number" value={bAmt} onChange={e=>setBAmt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){addBudgetEntry(f.id,bDate,parseFloat(bAmt)||0,bNote);setBAmt('');setBNote('')}}} placeholder="0" style={{...C.inp,fontSize:11,textAlign:'left'}}/></div>
          <button style={{...C.btnBlue,height:34,padding:'0 12px',alignSelf:'flex-end'}} onClick={()=>{addBudgetEntry(f.id,bDate,parseFloat(bAmt)||0,bNote);setBAmt('');setBNote('')}}>＋</button>
        </div>
        {entries.length>0 && <div style={{maxHeight:100,overflowY:'auto',borderTop:'1px solid var(--bd)',paddingTop:6}}>
          {entries.map(e=>(
            <div key={e.id} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:11,color:'var(--t2)'}}>
              <span>{fmtDate(e.date)}{e.note?` — ${e.note}`:''}</span>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{color:'var(--red)',fontWeight:700}}>{fmt(e.amount)}</span>
                <button onClick={()=>delBudgetEntry(e.id)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:11}}>🗑️</button>
              </div>
            </div>
          ))}
        </div>}
      </div>
    )
  }

  const dailyGroups = {}
  const filtered = dayFilter ? dailyExp.filter(e=>e.date===dayFilter) : dailyExp
  filtered.forEach(e => { (dailyGroups[e.date] = dailyGroups[e.date]||[]).push(e) })

  return (
    <div style={C.app}>
      <aside style={C.sb}>
        <div style={{padding:'18px 16px 12px',borderBottom:'1px solid var(--bd)'}}>
          <div style={{fontSize:15,fontWeight:900,color:'var(--acc)'}}>💰 الراتب الشهري</div>
          <div style={{fontSize:10,color:'var(--t2)',marginTop:2}}>{profile?.name || user?.email}</div>
        </div>
        <nav style={{flex:1,padding:'8px 6px',overflowY:'auto'}}>
          {navItems.map(([p,ic,lb])=>(
            <button key={p} onClick={()=>setPage(p)} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 10px',borderRadius:9,cursor:'pointer',border:'none',width:'100%',textAlign:'right',fontSize:12,color:page===p?'var(--acc)':'var(--t2)',background:page===p?'rgba(79,142,247,.15)':'transparent',marginBottom:2,transition:'all .15s'}}>
              <span style={{fontSize:14,width:18,textAlign:'center'}}>{ic}</span>{lb}
            </button>
          ))}
        </nav>
        <div style={{padding:12,borderTop:'1px solid var(--bd)'}}>
          <div style={{background:'var(--s2)',borderRadius:10,padding:11,marginBottom:10}}>
            <div style={{fontSize:10,color:'var(--t2)',marginBottom:3}}>الرصيد الصافي</div>
            <div style={{fontSize:17,fontWeight:700,color:bal()>=0?'var(--grn)':'var(--red)',marginBottom:5}}>{fmt(bal())}</div>
            {[['واردات',tInc(),'var(--grn)'],['شهري',tMonth(),'var(--red)'],['يومي',tDaily(),'var(--org)'],['مصرف',tBudget(),'var(--pur)']].map(([lb,val,col])=>(
              <div key={lb} style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--t2)',marginBottom:2}}>
                <span>{lb}</span><span style={{color:col}}>{fmt(val)}</span>
              </div>
            ))}
          </div>
          <button onClick={onLogout} style={{width:'100%',background:'none',border:'1px solid var(--bd)',borderRadius:8,color:'var(--t2)',padding:7,fontSize:11,cursor:'pointer'}}>تسجيل خروج</button>
        </div>
      </aside>

      <main style={C.main}>
        {page==='dash' && (
          <div>
            <div style={{marginBottom:18}}><h1 style={{fontSize:22,fontWeight:900,marginBottom:3}}>لوحة التحكم</h1><p style={{fontSize:12,color:'var(--t2)'}}>ملخص مالي شامل</p></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:13}}>
              {[['📈','الواردات',tInc(),'var(--grn)'],['🧾','المصروفات الشهرية',tMonth(),'var(--red)'],['📅','المصاريف اليومية',tDaily(),'var(--org)'],['🏷️','مصرف الشهر',tBudget(),'var(--pur)']].map(([ic,lb,val,col])=>(
                <div key={lb} style={{...C.card,marginBottom:0,position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:0,right:0,width:40,height:40,borderRadius:'0 13px 0 100%',background:col,opacity:.12}}/>
                  <div style={{fontSize:16,marginBottom:8}}>{ic}</div>
                  <div style={{fontSize:10,color:'var(--t2)',marginBottom:4}}>{lb}</div>
                  <div style={{fontSize:15,fontWeight:700,color:col}}>{fmt(val)}</div>
                </div>
              ))}
            </div>
            {(tInc()>0||tAll()>0) && (
              <div style={{...C.card,display:'flex',alignItems:'center',gap:14,marginBottom:13,borderColor:bal()>=0?'rgba(46,204,113,.25)':'rgba(231,76,60,.25)',background:bal()>=0?'rgba(46,204,113,.05)':'rgba(231,76,60,.05)'}}>
                <span style={{fontSize:26}}>{bal()>=0?'✅':'⚠️'}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:bal()>=0?'var(--grn)':'var(--red)',marginBottom:2}}>{bal()>=0?'فائض مالي':'عجز مالي'} هذا الشهر</div>
                  <div style={{fontSize:11,color:'var(--t2)'}}>إجمالي المصروفات: {fmt(tAll())}</div>
                </div>
                <div style={{fontSize:20,fontWeight:900,color:bal()>=0?'var(--grn)':'var(--red)'}}>{bal()>=0?'+':''}{fmt(bal())}</div>
              </div>
            )}
            {bycat('monthlyBudget').length>0 && (
              <div style={C.card}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--t2)',textTransform:'uppercase',letterSpacing:1,marginBottom:12}}>تقدم مصرف البنود</div>
                {bycat('monthlyBudget').map((mb,i)=>{
                  const spent=budgetSpent(mb.id),pct=mb.budget>0?Math.min(100,Math.round(spent/mb.budget*100)):0,over=mb.budget>0&&spent>mb.budget
                  return <div key={mb.id} style={{marginBottom:9}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3,fontSize:12}}>
                      <span>{mb.icon} {mb.name}</span>
                      <span><span style={{color:over?'var(--red)':'var(--grn)',fontWeight:700}}>{fmt(spent)}</span>{mb.budget>0&&<span style={{color:'var(--t2)'}}> / {fmt(mb.budget)}</span>}</span>
                    </div>
                    <div style={{height:3,background:'var(--s2)',borderRadius:3}}><div style={{width:`${pct}%`,height:'100%',background:over?'var(--red)':COLORS[i%COLORS.length],borderRadius:3}}/></div>
                  </div>
                })}
              </div>
            )}
          </div>
        )}

        {page==='inc' && (
          <div>
            <div style={{marginBottom:18}}><h1 style={{fontSize:22,fontWeight:900,marginBottom:3}}>إدارة الواردات</h1></div>
            <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12}}><h2 style={{fontSize:16,fontWeight:700,flex:1}}>مصادر الدخل</h2><button style={C.btnBlue} onClick={()=>{setModal({mode:'add',cat:'income'});setMName('');setMIcon('💼')}}>＋ إضافة</button></div>
            <div style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:13,overflow:'hidden',marginBottom:11}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr><th style={C.th}>أيقونة</th><th style={C.th}>الاسم</th><th style={C.th}>المبلغ</th><th style={C.th}>إجراءات</th></tr></thead>
                <tbody>{bycat('income').length===0?<tr><td colSpan={4} style={{...C.td,textAlign:'center',color:'var(--t3)',padding:24}}>لا يوجد — اضغط "+ إضافة"</td></tr>:bycat('income').map(f=><FieldRow key={f.id} f={f}/>)}</tbody>
              </table>
            </div>
            <div style={{...C.card,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:12,color:'var(--t2)'}}>إجمالي الواردات</span><span style={{fontSize:18,fontWeight:700,color:'var(--grn)'}}>{fmt(tInc())}</span></div>
          </div>
        )}

        {page==='exp' && (
          <div>
            <div style={{marginBottom:18}}><h1 style={{fontSize:22,fontWeight:900,marginBottom:3}}>المصروفات الشهرية</h1></div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              <h2 style={{fontSize:16,fontWeight:700,flex:1}}>جميع المصروفات</h2>
              <select value={expCat} onChange={e=>setExpCat(e.target.value)} style={{...C.inp,width:'auto',cursor:'pointer',fontSize:12}}>
                <option value="fixed">ثابتة</option><option value="family">أسرة</option><option value="savings">ادخار/ديون</option>
              </select>
              <button style={C.btnBlue} onClick={()=>{setModal({mode:'add',cat:expCat});setMName('');setMIcon('💼')}}>＋ إضافة</button>
            </div>
            <div style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:13,overflow:'hidden',marginBottom:11}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr><th style={C.th}>أيقونة</th><th style={C.th}>الاسم</th><th style={C.th}>الفئة</th><th style={C.th}>المبلغ</th><th style={C.th}>إجراءات</th></tr></thead>
                <tbody>
                  {[...bycat('fixed'),...bycat('family'),...bycat('savings')].length===0?<tr><td colSpan={5} style={{...C.td,textAlign:'center',color:'var(--t3)',padding:24}}>لا يوجد</td></tr>:[...bycat('fixed'),...bycat('family'),...bycat('savings')].map(f=><FieldRow key={f.id} f={f} showCat/>)}
                </tbody>
              </table>
            </div>
            <div style={{...C.card,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:12,color:'var(--t2)'}}>إجمالي المصروفات الشهرية</span><span style={{fontSize:18,fontWeight:700,color:'var(--red)'}}>{fmt(tMonth())}</span></div>
          </div>
        )}

        {page==='daily' && (
          <div>
            <div style={{marginBottom:18}}><h1 style={{fontSize:22,fontWeight:900,marginBottom:3}}>المصاريف اليومية</h1><p style={{fontSize:12,color:'var(--t2)'}}>سجّل مصاريفك اليومية — تُطرح تلقائياً من الواردات</p></div>
            <div style={{...C.card,marginBottom:13}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--t2)',textTransform:'uppercase',letterSpacing:1,marginBottom:11}}>إضافة مصروف يومي</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
                <div><div style={{fontSize:9,color:'var(--t2)',marginBottom:4}}>التاريخ</div><input type="date" value={dDate} onChange={e=>setDDate(e.target.value)} style={C.inp}/></div>
                <div><div style={{fontSize:9,color:'var(--t2)',marginBottom:4}}>الفئة</div><select value={dCat} onChange={e=>setDCat(e.target.value)} style={{...C.inp,cursor:'pointer'}}>{DAY_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><div style={{fontSize:9,color:'var(--t2)',marginBottom:4}}>أيقونة</div><input value={dIco} onChange={e=>setDIco(e.target.value)} style={C.inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr auto',gap:10,alignItems:'flex-end'}}>
                <div><div style={{fontSize:9,color:'var(--t2)',marginBottom:4}}>الوصف</div><input value={dDesc} onChange={e=>setDDesc(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addDaily()} placeholder="مثال: وجبة غداء" style={C.inp}/></div>
                <div><div style={{fontSize:9,color:'var(--t2)',marginBottom:4}}>المبلغ</div><input type="number" value={dAmt} onChange={e=>setDAmt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addDaily()} placeholder="0" style={{...C.inp,textAlign:'left'}}/></div>
                <button style={{...C.btnBlue,height:36,padding:'0 14px'}} onClick={addDaily}>＋</button>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <input type="date" value={dayFilter} onChange={e=>setDayFilter(e.target.value)} style={{...C.inp,width:'auto'}}/>
              {dayFilter&&<button style={C.btnGray} onClick={()=>setDayFilter('')}>✕ إزالة</button>}
              <span style={{marginRight:'auto',fontSize:12,color:'var(--t2)'}}>الإجمالي: <strong style={{color:'var(--org)'}}>{fmt(tDaily())}</strong></span>
            </div>
            {Object.entries(dailyGroups).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,entries])=>(
              <div key={date} style={C.card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9}}>
                  <span style={{fontSize:14,fontWeight:700}}>📅 {fmtDate(date)} <span style={{fontSize:11,color:'var(--t2)',fontWeight:400}}>{entries.length} عمليات</span></span>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--org)'}}>{fmt(entries.reduce((a,b)=>a+b.amount,0))}</span>
                </div>
                {entries.map(e=>(
                  <div key={e.id} style={{display:'flex',alignItems:'center',gap:9,padding:'6px 0',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                    <span style={{fontSize:18}}>{e.icon}</span>
                    <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{e.description}</div><div style={{fontSize:10,color:'var(--t2)'}}>{e.category}</div></div>
                    <span style={{fontSize:12,fontWeight:700,color:'var(--org)'}}>{fmt(e.amount)}</span>
                    <button onClick={()=>delDaily(e.id)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:13}}>🗑️</button>
                  </div>
                ))}
              </div>
            ))}
            {dailyExp.length===0&&<div style={{...C.card,textAlign:'center',padding:32,color:'var(--t3)'}}>لا توجد مصاريف يومية بعد</div>}
          </div>
        )}

        {page==='budget' && (
          <div>
            <div style={{marginBottom:18}}><h1 style={{fontSize:22,fontWeight:900,marginBottom:3}}>مصرف المصاريف الشهري</h1></div>
            <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:13}}><h2 style={{fontSize:16,fontWeight:700,flex:1}}>بنود المصرف</h2><button style={C.btnBlue} onClick={()=>{setModal({mode:'add',cat:'monthlyBudget'});setMName('');setMIcon('🛒')}}>＋ إضافة</button></div>
            <div style={{...C.card,display:'flex',marginBottom:13}}>
              {[['إجمالي المُنفَق',tBudget(),'var(--pur)'],['إجمالي الميزانية',bycat('monthlyBudget').reduce((a,f)=>a+f.budget,0),'var(--acc)'],['المتبقي',bycat('monthlyBudget').reduce((a,f)=>a+(f.budget-budgetSpent(f.id)),0),'var(--grn)']].map(([lb,val,col])=>(
                <div key={lb} style={{flex:1,textAlign:'center'}}>
                  <div style={{fontSize:10,color:'var(--t2)',marginBottom:3}}>{lb}</div>
                  <div style={{fontSize:16,fontWeight:700,color:col}}>{fmt(val)}</div>
                </div>
              ))}
            </div>
            {bycat('monthlyBudget').map(f=><BudgetCard key={f.id} f={f}/>)}
            {bycat('monthlyBudget').length===0&&<div style={{...C.card,textAlign:'center',padding:32,color:'var(--t3)'}}>لا توجد بنود — اضغط "+ إضافة"</div>}
          </div>
        )}

        {page==='ai' && (
          <div>
            <div style={{marginBottom:18}}><h1 style={{fontSize:22,fontWeight:900,marginBottom:3}}>الذكاء الاصطناعي</h1></div>
            <div style={{...C.card,textAlign:'center',background:'rgba(79,142,247,.06)',borderColor:'rgba(79,142,247,.18)'}}>
              <div style={{fontSize:40,marginBottom:8}}>🤖</div>
              <div style={{fontSize:18,fontWeight:700,marginBottom:6}}>مستشارك المالي الذكي</div>
              <div style={{fontSize:12,color:'var(--t2)',lineHeight:1.7,marginBottom:14}}>يحلل جميع بياناتك ويقدم نصائح مخصصة</div>
              {!aiLoading&&<button onClick={runAI} style={{...C.btnBlue,fontSize:14,padding:'12px 28px',background:'linear-gradient(135deg,var(--acc),var(--pur))'}}>🔍 ابدأ التحليل</button>}
              {aiLoading&&<div style={{color:'var(--t2)',fontSize:13}}>⏳ جاري التحليل...</div>}
            </div>
            {aiError&&<div style={{...C.card,background:'rgba(243,156,18,.07)',borderColor:'rgba(243,156,18,.25)',fontSize:12,color:'var(--org)'}}>{aiError}</div>}
            {aiResult&&<div style={C.card}><div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12}}><span style={{fontSize:20}}>🤖</span><span style={{fontSize:14,fontWeight:700}}>التحليل المالي</span></div><div style={{fontSize:13,color:'var(--t2)',lineHeight:2,whiteSpace:'pre-wrap'}}>{aiResult}</div></div>}
          </div>
        )}

        {page==='hist' && (
          <div>
            <div style={{marginBottom:18}}><h1 style={{fontSize:22,fontWeight:900,marginBottom:3}}>السجل والإحصائيات</h1></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13}}>
              <div style={C.card}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--t2)',textTransform:'uppercase',letterSpacing:1,marginBottom:12}}>ملخص الشهر الحالي</div>
                {[['الواردات',tInc(),'var(--grn)'],['المصروفات الشهرية',tMonth(),'var(--red)'],['المصاريف اليومية',tDaily(),'var(--org)'],['مصرف البنود',tBudget(),'var(--pur)'],['إجمالي المصروفات',tAll(),'var(--red)']].map(([lb,v,col])=>(
                  <div key={lb} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:12}}>
                    <span style={{color:'var(--t2)'}}>{lb}</span><span style={{color:col,fontWeight:700}}>{fmt(v)}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontSize:14,borderTop:'2px solid rgba(255,255,255,0.1)',marginTop:4}}>
                  <span style={{fontWeight:700}}>الرصيد الصافي</span>
                  <span style={{color:bal()>=0?'var(--grn)':'var(--red)',fontWeight:900}}>{bal()>=0?'+':''}{fmt(bal())}</span>
                </div>
              </div>
              <div style={C.card}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--t2)',textTransform:'uppercase',letterSpacing:1,marginBottom:12}}>المصاريف اليومية حسب الفئة</div>
                {Object.entries(dailyExp.reduce((acc,e)=>{acc[e.category]=(acc[e.category]||0)+e.amount;return acc},{})).sort((a,b)=>b[1]-a[1]).map(([cat,total],i)=>(
                  <div key={cat} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:12}}>
                    <span style={{color:'var(--t2)'}}>{cat}</span><span style={{color:COLORS[i%COLORS.length],fontWeight:700}}>{fmt(total)}</span>
                  </div>
                ))}
                {dailyExp.length===0&&<div style={{fontSize:11,color:'var(--t3)',textAlign:'center',padding:12}}>لا توجد مصاريف يومية</div>}
              </div>
            </div>
          </div>
        )}
      </main>

      {modal && (
        <div onClick={e=>e.target===e.currentTarget&&setModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.82)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'var(--s1)',border:'1px solid var(--bd2)',borderRadius:16,padding:22,width:420,maxWidth:'96vw'}}>
            <div style={{display:'flex',alignItems:'center',marginBottom:16}}>
              <span style={{fontSize:15,fontWeight:700}}>{modal.mode==='add'?'إضافة بند':'تعديل: '+modal.item?.name}</span>
              <button onClick={()=>setModal(null)} style={{marginRight:'auto',background:'none',border:'none',color:'var(--t2)',cursor:'pointer',fontSize:17}}>✕</button>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:10,fontWeight:700,color:'var(--t2)',display:'block',marginBottom:5,textTransform:'uppercase'}}>اسم الحقل</label>
              <input value={mName} onChange={e=>setMName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveField()} placeholder="مثال: الراتب الأساسي" style={{...C.inp,marginBottom:0}} autoFocus/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:700,color:'var(--t2)',display:'block',marginBottom:5,textTransform:'uppercase'}}>الأيقونة</label>
              <input value={mIcon} onChange={e=>setMIcon(e.target.value)} style={{...C.inp,marginBottom:7}}/>
              <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                {EMOJIS.map(e=>(
                  <div key={e} onClick={()=>setMIcon(e)} style={{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:7,cursor:'pointer',fontSize:16,border:`1.5px solid ${mIcon===e?'var(--acc)':'transparent'}`,background:mIcon===e?'rgba(79,142,247,.15)':'var(--s2)'}}>
                    {e}
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setModal(null)} style={{background:'var(--s2)',border:'1px solid var(--bd2)',color:'var(--t2)',borderRadius:8,padding:'8px 16px',fontSize:12,cursor:'pointer'}}>إلغاء</button>
              <button onClick={saveField} style={C.btnBlue}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
