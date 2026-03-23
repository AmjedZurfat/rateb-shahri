export default function Landing({ onLogin }) {
  const s = {
    wrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 },
    hero: { textAlign: 'center', marginBottom: 56 },
    h1: { fontSize: 44, fontWeight: 900, color: 'var(--t1)', marginBottom: 12, letterSpacing: -1 },
    sub: { fontSize: 17, color: 'var(--t2)', marginBottom: 6 },
    sub2: { fontSize: 13, color: 'var(--t3)', marginBottom: 40 },
    btns: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
    btnMain: { background: 'var(--acc)', color: '#fff', borderRadius: 11, padding: '14px 32px', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' },
    btnSec: { background: 'var(--s2)', color: 'var(--t2)', borderRadius: 11, padding: '14px 32px', fontSize: 16, fontWeight: 700, border: '1px solid var(--bd2)', cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, maxWidth: 860, width: '100%', marginBottom: 56 },
    card: { background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 13, padding: '20px 16px', textAlign: 'center' },
    pricingWrap: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 560, width: '100%', marginBottom: 32 },
    freeCard: { background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 13, padding: 22, textAlign: 'center' },
    proCard: { background: 'rgba(79,142,247,0.08)', border: '2px solid var(--acc)', borderRadius: 13, padding: 22, textAlign: 'center', position: 'relative' },
  }

  const features = [
    ['📊', 'لوحة تحكم ذكية', 'اعرف وضعك المالي دفعة واحدة'],
    ['📅', 'مصاريف يومية', 'سجّل كل مصروف بضغطة واحدة'],
    ['🏷️', 'مصرف الشهر', 'تتبع ميزانية كل بند يوماً بيوم'],
    ['🤖', 'ذكاء اصطناعي', 'نصائح مخصصة لزيادة دخلك'],
    ['📈', 'سجل تاريخي', 'قارن أشهرك وشوف تقدمك'],
    ['🔒', 'بياناتك خاصة', 'آمنة ومشفرة 100%'],
  ]

  const freeFeatures = ['إدارة الواردات والمصروفات', 'المصاريف اليومية', 'مصرف الشهر', 'لوحة التحكم']
  const proFeatures = ['كل مميزات المجاني', 'ذكاء اصطناعي غير محدود', 'تقارير شهرية', 'تنبيهات تجاوز الميزانية']

  return (
    <div style={s.wrap}>
      <div style={s.hero}>
        <div style={{ fontSize: 66, marginBottom: 16 }}>💰</div>
        <h1 style={s.h1}>الراتب الشهري</h1>
        <p style={s.sub}>إدارة مالية ذكية للعائلة العراقية</p>
        <p style={s.sub2}>تتبع راتبك • مصروفاتك اليومية • مصرف البيت • كل شيء في مكان واحد</p>
        <div style={s.btns}>
          <button style={s.btnMain} onClick={onLogin}>ابدأ مجاناً ←</button>
          <button style={s.btnSec} onClick={onLogin}>تسجيل دخول</button>
        </div>
      </div>

      <div style={s.grid}>
        {features.map(([ic, title, desc]) => (
          <div key={title} style={s.card}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{ic}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--t2)' }}>{desc}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: 'var(--t1)' }}>الباقات</h2>
      <div style={s.pricingWrap}>
        <div style={s.freeCard}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)', marginBottom: 8 }}>مجاني</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--t1)', marginBottom: 14 }}>$0</div>
          {freeFeatures.map(f => <div key={f} style={{ fontSize: 12, color: 'var(--t2)', padding: '5px 0', borderBottom: '1px solid var(--bd)' }}>✓ {f}</div>)}
        </div>
        <div style={s.proCard}>
          <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'var(--acc)', color: '#fff', borderRadius: 20, padding: '3px 14px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>الأكثر شعبية</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--acc)', marginBottom: 8 }}>بريميوم</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--acc)', marginBottom: 2 }}>$3</div>
          <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 14 }}>شهرياً</div>
          {proFeatures.map(f => <div key={f} style={{ fontSize: 12, color: 'var(--t2)', padding: '5px 0', borderBottom: '1px solid var(--bd)' }}>✓ {f}</div>)}
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--t3)' }}>لا يحتاج بطاقة ائتمان • ابدأ مجاناً اليوم</p>
    </div>
  )
}
