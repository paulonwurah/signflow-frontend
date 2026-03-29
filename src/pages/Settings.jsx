import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export default function Settings() {
  const { profile, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ company_name:'', phone:'', address:'', country:'', letterhead:'', branding_type:'logo', default_currency:'USD', notify_email:true })
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (profile) {
      setForm({
        company_name: profile.company_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        country: profile.country || '',
        letterhead: profile.letterhead || '',
        branding_type: profile.branding_type || 'logo',
        default_currency: profile.default_currency || 'USD',
        notify_email: profile.notify_email !== false,
      })
      if (profile.logo_url) setLogoPreview(profile.logo_url)
    }
  }, [profile])

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      if (logoFile) await api.uploadLogo(logoFile)
      await api.updateProfile(form)
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.logo} onClick={() => navigate('/dashboard')}>Sign<span style={{ color: '#2563EB' }}>Flow</span></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.btnOutline} onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <button style={s.btnOutline} onClick={signOut}>Sign out</button>
        </div>
      </nav>

      <div style={s.wrap}>
        <h1 style={s.title}>Settings</h1>

        {error && <div style={s.error}>{error}</div>}
        {saved && <div style={s.success}>Settings saved!</div>}

        {/* COMPANY */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Company Profile</div>
          <div style={s.grid2}>
            <Field label="Company Name" value={form.company_name} onChange={v => set('company_name', v)} placeholder="Acme Corp" />
            <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} placeholder="+1 555 000 0000" />
          </div>
          <div style={{ marginTop: 12 }}>
            <Field label="Address" value={form.address} onChange={v => set('address', v)} placeholder="123 Business Ave, City" textarea />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={s.fieldLabel}>Country</label>
            <select style={s.select} value={form.country} onChange={e => set('country', e.target.value)}>
              {['Ghana','Nigeria','United States','United Kingdom','South Africa','Kenya','Canada','Australia'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* BRANDING */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Branding</div>
          <div style={s.toggle}>
            {['logo','letterhead'].map(t => (
              <button key={t} style={{ ...s.toggleBtn, ...(form.branding_type === t ? s.toggleActive : {}) }} onClick={() => set('branding_type', t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {form.branding_type === 'logo' ? (
            <div style={{ marginTop: 12 }}>
              {logoPreview && <img src={logoPreview} alt="Logo" style={{ height: 60, objectFit: 'contain', marginBottom: 10, display: 'block' }} />}
              <label style={s.fieldLabel}>Upload Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoChange} style={{ marginTop: 4, fontSize: 13, fontFamily: 'DM Sans, sans-serif' }} />
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <Field label="Letterhead Text" value={form.letterhead} onChange={v => set('letterhead', v)} placeholder="Company name · Address · Website" textarea />
            </div>
          )}
        </div>

        {/* PREFERENCES */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Preferences</div>
          <div style={s.prefRow}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Email notifications</div>
              <div style={{ fontSize: 12, color: '#A8A49C' }}>Get notified when documents are signed</div>
            </div>
            <label style={s.switchWrap}>
              <input type="checkbox" checked={form.notify_email} onChange={e => set('notify_email', e.target.checked)} style={{ display: 'none' }} />
              <div style={{ ...s.switchTrack, background: form.notify_email ? '#2563EB' : '#D4D0C8' }}>
                <div style={{ ...s.switchThumb, transform: form.notify_email ? 'translateX(20px)' : 'translateX(0)' }} />
              </div>
            </label>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={s.fieldLabel}>Default Currency</label>
            <select style={s.select} value={form.default_currency} onChange={e => set('default_currency', e.target.value)}>
              {[['USD','🇺🇸'],['EUR','🇪🇺'],['GBP','🇬🇧'],['GHS','🇬🇭'],['NGN','🇳🇬'],['ZAR','🇿🇦'],['KES','🇰🇪']].map(([c,f]) => (
                <option key={c} value={c}>{f} {c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* PLAN */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Subscription</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-block', background: '#EFF6FF', color: '#2563EB', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, marginBottom: 6 }}>
                {profile?.plan?.toUpperCase() || 'FREE'} PLAN
              </div>
              <div style={{ fontSize: 13, color: '#6B6860' }}>{profile?.plan === 'pro' ? '$12/month' : profile?.plan === 'business' ? '$29/month' : 'Free · 1 document/month'}</div>
            </div>
            <button style={s.btnOutline}>Manage Plan</button>
          </div>
        </div>

        <button style={{ ...s.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', textarea }) {
  const style = { padding: '9px 12px', border: '1px solid #D4D0C8', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif', background: '#FAFAF8', color: '#1A1916', outline: 'none', width: '100%', marginTop: 4 }
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#6B6860', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {textarea
        ? <textarea style={{ ...style, resize: 'vertical', minHeight: 70 }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        : <input style={style} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      }
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#F7F6F2', fontFamily: 'DM Sans, sans-serif' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem', height: 56, background: '#fff', borderBottom: '1px solid #E8E5DE', position: 'sticky', top: 0, zIndex: 100 },
  logo: { fontFamily: 'Instrument Serif, serif', fontSize: '1.3rem', fontStyle: 'italic', cursor: 'pointer', color: '#1A1916' },
  wrap: { padding: '2rem', maxWidth: 720, margin: '0 auto' },
  title: { fontFamily: 'Instrument Serif, serif', fontSize: '1.6rem', fontStyle: 'italic', marginBottom: '1.5rem' },
  section: { background: '#fff', border: '1px solid #E8E5DE', borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem' },
  sectionTitle: { fontWeight: 600, fontSize: 15, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E8E5DE' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  fieldLabel: { fontSize: 11, fontWeight: 700, color: '#6B6860', textTransform: 'uppercase', letterSpacing: '0.05em' },
  select: { display: 'block', marginTop: 4, padding: '9px 12px', border: '1px solid #D4D0C8', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif', background: '#FAFAF8', color: '#1A1916', width: '100%' },
  toggle: { display: 'inline-flex', background: '#F7F6F2', borderRadius: 8, padding: 3 },
  toggleBtn: { padding: '6px 18px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif', color: '#6B6860', fontWeight: 500 },
  toggleActive: { background: '#fff', color: '#1A1916', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  prefRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' },
  switchWrap: { cursor: 'pointer' },
  switchTrack: { width: 44, height: 24, borderRadius: 20, position: 'relative', transition: 'background 0.2s' },
  switchThumb: { position: 'absolute', top: 3, left: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'transform 0.2s' },
  btnPrimary: { background: '#1A1916', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  btnOutline: { background: 'transparent', color: '#1A1916', border: '1px solid #D4D0C8', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: '1rem' },
  success: { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#16A34A', marginBottom: '1rem' },
}
