import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'

export default function SignPage() {
  const { token } = useParams()
  const [doc, setDoc]         = useState(null)
  const [error, setError]     = useState('')
  const [step, setStep]       = useState('review') // review | sign | done
  const [sigMode, setSigMode] = useState('draw')
  const [sigText, setSigText] = useState('')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [signedAt, setSignedAt] = useState(null)
  const canvasRef             = useRef(null)
  const drawing               = useRef(false)
  const lastPos               = useRef({ x: 0, y: 0 })

  useEffect(() => {
    api.getSignDoc(token).then(data => {
      if (data.error) setError(data.error)
      else setDoc(data)
    }).catch(() => setError('Could not load document.'))
  }, [token])

  function getPos(e, canvas) {
    const r = canvas.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return { x: (src.clientX - r.left) * (canvas.width / r.width), y: (src.clientY - r.top) * (canvas.height / r.height) }
  }

  function onMouseDown(e) { drawing.current = true; lastPos.current = getPos(e, canvasRef.current) }
  function onMouseMove(e) {
    if (!drawing.current) return
    const ctx = canvasRef.current.getContext('2d')
    const p = getPos(e, canvasRef.current)
    ctx.beginPath(); ctx.strokeStyle = '#1A1916'; ctx.lineWidth = 2; ctx.lineCap = 'round'
    ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(p.x, p.y); ctx.stroke()
    lastPos.current = p
  }
  function clearCanvas() { canvasRef.current?.getContext('2d').clearRect(0, 0, 600, 120) }

  async function handleSign() {
    if (!name.trim() || !email.trim()) return setError('Please enter your name and email.')
    setLoading(true); setError('')
    try {
      let signature_data = sigMode === 'type' ? sigText : canvasRef.current?.toDataURL('image/png') || ''
      const result = await api.submitSign(token, { signer_name: name, signer_email: email, method: sigMode, signature_data })
      if (result.error) throw new Error(result.error)
      setSignedAt(result.signed_at)
      setStep('done')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (error && !doc) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>Sign<span style={{ color: '#2563EB' }}>Flow</span></div>
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h2 style={s.heading}>Link unavailable</h2>
          <p style={{ fontSize: 14, color: '#6B6860', lineHeight: 1.6 }}>{error}</p>
        </div>
      </div>
    </div>
  )

  if (!doc) return (
    <div style={s.page}>
      <div style={{ color: '#A8A49C', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>Loading document…</div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>Sign<span style={{ color: '#2563EB' }}>Flow</span></div>

        {/* STEPS */}
        <div style={s.steps}>
          {['Review', 'Sign', 'Complete'].map((label, i) => {
            const idx = ['review','sign','done'].indexOf(step)
            const isActive = i === idx
            const isDone = i < idx || step === 'done'
            return (
              <div key={label} style={{ ...s.step, ...(isActive ? s.stepActive : isDone ? s.stepDone : {}) }}>
                {label}
              </div>
            )
          })}
        </div>

        {step === 'review' && (
          <div>
            <div style={s.pill}>Signature Requested</div>
            <h2 style={s.heading}>{doc.title}</h2>
            <p style={{ fontSize: 13, color: '#6B6860', marginBottom: '1.5rem' }}>
              From: <strong>{doc.company_name || 'Sender'}</strong>
              {doc.doc_date && ` · Dated: ${doc.doc_date}`}
              {doc.total && ` · Value: ${doc.currency_symbol}${Number(doc.total).toLocaleString()}`}
            </p>

            {/* Doc summary */}
            <div style={s.docSummary}>
              <div style={s.summaryRow}><span style={s.summaryLabel}>Document</span><span>{doc.doc_type}</span></div>
              {doc.recipient_name && <div style={s.summaryRow}><span style={s.summaryLabel}>Recipient</span><span>{doc.recipient_name}</span></div>}
              {doc.due_date && <div style={s.summaryRow}><span style={s.summaryLabel}>Due</span><span>{doc.due_date}</span></div>}
              {doc.doc_type === 'NDA' && doc.disclosing_party && (
                <>
                  <div style={s.summaryRow}><span style={s.summaryLabel}>Disclosing</span><span>{doc.disclosing_party}</span></div>
                  <div style={s.summaryRow}><span style={s.summaryLabel}>Receiving</span><span>{doc.receiving_party}</span></div>
                </>
              )}
              {doc.doc_type === 'Contract' && doc.scope_of_work && (
                <div style={{ ...s.summaryRow, alignItems: 'flex-start' }}><span style={s.summaryLabel}>Scope</span><span style={{ lineHeight: 1.6, fontSize: 13 }}>{doc.scope_of_work}</span></div>
              )}
            </div>

            <button style={s.btnPrimary} onClick={() => setStep('sign')}>Continue to Sign →</button>
          </div>
        )}

        {step === 'sign' && (
          <div>
            <h2 style={{ ...s.heading, marginBottom: '0.25rem' }}>Sign the document</h2>
            <p style={{ fontSize: 13, color: '#6B6860', marginBottom: '1.5rem' }}>Your information stays private. No account needed.</p>

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Full Name</label>
                <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Email Address</label>
                <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" required />
              </div>
            </div>

            <div style={{ margin: '1.25rem 0 0.75rem' }}>
              <label style={s.label}>Your Signature</label>
            </div>
            <div style={s.sigTabs}>
              {['draw', 'type'].map(m => (
                <button key={m} style={{ ...s.sigTab, ...(sigMode === m ? s.sigTabActive : {}) }} onClick={() => setSigMode(m)}>
                  {m === 'draw' ? 'Draw' : 'Type'}
                </button>
              ))}
            </div>

            {sigMode === 'draw' ? (
              <div>
                <canvas ref={canvasRef} width={600} height={120}
                  style={{ border: '1px dashed #D4D0C8', borderRadius: 10, cursor: 'crosshair', background: '#FAFAF8', width: '100%', height: 120, display: 'block' }}
                  onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={() => drawing.current = false} onMouseLeave={() => drawing.current = false}
                  onTouchStart={e => { e.preventDefault(); onMouseDown(e) }}
                  onTouchMove={e => { e.preventDefault(); onMouseMove(e) }}
                  onTouchEnd={() => drawing.current = false}
                />
                <button style={s.clearBtn} onClick={clearCanvas}>Clear</button>
              </div>
            ) : (
              <input style={{ ...s.input, fontFamily: 'Instrument Serif, serif', fontSize: 26, padding: '12px' }}
                placeholder="Type your name here…" value={sigText} onChange={e => setSigText(e.target.value)} />
            )}

            <div style={s.divider} />
            <button style={{ ...s.btnPrimary, width: '100%', padding: 14, fontSize: 15, opacity: loading ? 0.7 : 1 }} onClick={handleSign} disabled={loading}>
              {loading ? 'Signing…' : 'Sign & Complete →'}
            </button>
            <p style={{ fontSize: 12, color: '#A8A49C', textAlign: 'center', marginTop: 10 }}>
              By signing, you agree to be legally bound by this document.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: 56, marginBottom: '1rem' }}>✓</div>
            <h2 style={{ ...s.heading, marginBottom: '0.5rem' }}>Document Signed!</h2>
            <p style={{ fontSize: 14, color: '#6B6860', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              You've successfully signed <strong>{doc.title}</strong>.<br />
              A confirmation has been sent to both parties.
            </p>
            <div style={s.docSummary}>
              <div style={s.summaryRow}><span style={s.summaryLabel}>Signed by</span><span>{name}</span></div>
              <div style={s.summaryRow}><span style={s.summaryLabel}>Timestamp</span><span>{signedAt ? new Date(signedAt).toLocaleString() : new Date().toLocaleString()}</span></div>
              <div style={s.summaryRow}><span style={s.summaryLabel}>Status</span><span style={{ color: '#16A34A', fontWeight: 600 }}>✓ Completed</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#F7F6F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'DM Sans, sans-serif' },
  card: { background: '#fff', border: '1px solid #E8E5DE', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 560 },
  logo: { fontFamily: 'Instrument Serif, serif', fontSize: '1.4rem', fontStyle: 'italic', color: '#1A1916', marginBottom: '1.5rem', display: 'block' },
  steps: { display: 'flex', marginBottom: '2rem', background: '#F7F6F2', borderRadius: 8, overflow: 'hidden' },
  step: { flex: 1, padding: '8px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#A8A49C' },
  stepActive: { background: '#1A1916', color: '#fff' },
  stepDone: { background: '#F0FDF4', color: '#16A34A' },
  pill: { display: 'inline-block', background: '#EFF6FF', color: '#2563EB', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, marginBottom: '0.75rem' },
  heading: { fontFamily: 'Instrument Serif, serif', fontSize: '1.5rem', fontStyle: 'italic', marginBottom: '0.5rem' },
  docSummary: { background: '#F7F6F2', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #EFEDE7', fontSize: 14, gap: 12 },
  summaryLabel: { fontSize: 12, color: '#A8A49C', fontWeight: 600, flexShrink: 0 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 11, fontWeight: 700, color: '#6B6860', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { padding: '10px 12px', border: '1px solid #D4D0C8', borderRadius: 8, fontSize: 14, fontFamily: 'DM Sans, sans-serif', background: '#FAFAF8', color: '#1A1916', outline: 'none' },
  sigTabs: { display: 'flex', border: '1px solid #D4D0C8', borderRadius: 8, overflow: 'hidden', width: 'fit-content', marginBottom: 10 },
  sigTab: { padding: '7px 18px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif', color: '#6B6860' },
  sigTabActive: { background: '#1A1916', color: '#fff' },
  clearBtn: { background: 'none', border: '1px solid #D4D0C8', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: '#6B6860', fontFamily: 'DM Sans, sans-serif', marginTop: 6 },
  divider: { height: 1, background: '#E8E5DE', margin: '1.5rem 0' },
  btnPrimary: { background: '#1A1916', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', width: '100%', display: 'block' },
  errorBox: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: '1rem' },
}
