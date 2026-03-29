import { useState, useRef, useEffect } from 'react'
import { api } from '../lib/api'

const CURRENCIES = [
  { code:'USD',symbol:'$',flag:'🇺🇸' },{ code:'EUR',symbol:'€',flag:'🇪🇺' },{ code:'GBP',symbol:'£',flag:'🇬🇧' },
  { code:'GHS',symbol:'₵',flag:'🇬🇭' },{ code:'NGN',symbol:'₦',flag:'🇳🇬' },{ code:'JPY',symbol:'¥',flag:'🇯🇵' },
  { code:'CAD',symbol:'$',flag:'🇨🇦' },{ code:'AUD',symbol:'$',flag:'🇦🇺' },{ code:'ZAR',symbol:'R',flag:'🇿🇦' },
  { code:'KES',symbol:'Ksh',flag:'🇰🇪' },{ code:'INR',symbol:'₹',flag:'🇮🇳' },{ code:'BRL',symbol:'R$',flag:'🇧🇷' },
  { code:'CHF',symbol:'Fr',flag:'🇨🇭' },{ code:'MXN',symbol:'$',flag:'🇲🇽' },{ code:'SGD',symbol:'$',flag:'🇸🇬' },
]

const DOC_TYPES = [
  { type:'Invoice',icon:'🧾' },{ type:'Receipt',icon:'📋' },{ type:'Contract',icon:'📝' },
  { type:'Proposal',icon:'💼' },{ type:'NDA',icon:'🔒' },
]

export default function NewDocModal({ onClose, onCreated }) {
  const [docType, setDocType]     = useState('Invoice')
  const [template, setTemplate]   = useState('Clean')
  const [currency, setCurrency]   = useState(CURRENCIES[0])
  const [sigMode, setSigMode]     = useState('draw')
  const [sigText, setSigText]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const canvasRef                 = useRef(null)
  const drawing                   = useRef(false)
  const lastPos                   = useRef({ x: 0, y: 0 })

  const [lineItems, setLineItems] = useState([{ desc: '', qty: 1, price: 0 }])
  const subtotal = lineItems.reduce((s, i) => s + i.qty * i.price, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#1A1916'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  }, [sigMode])

  function getPos(e, canvas) {
    const r = canvas.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return { x: (src.clientX - r.left) * (canvas.width / r.width), y: (src.clientY - r.top) * (canvas.height / r.height) }
  }

  function onMouseDown(e) {
    drawing.current = true
    const p = getPos(e, canvasRef.current)
    lastPos.current = p
  }

  function onMouseMove(e) {
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const p = getPos(e, canvas)
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(p.x, p.y); ctx.stroke()
    lastPos.current = p
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  }

  function updateItem(i, field, val) {
    const updated = [...lineItems]
    updated[i] = { ...updated[i], [field]: field === 'desc' ? val : parseFloat(val) || 0 }
    setLineItems(updated)
  }

  async function handleSubmit(status) {
    setError('')
    setLoading(true)
    try {
      const title = document.getElementById('docTitle').value || `${docType} #${Date.now().toString().slice(-4)}`
      const recipient = document.getElementById('docRecipient').value || ''
      const recipient_email = document.getElementById('docEmail').value || ''
      const doc_date = document.getElementById('docDate').value || new Date().toISOString().slice(0, 10)
      const due_date = document.getElementById('docDue').value || ''

      const body = {
        title, doc_type: docType, template, status,
        currency_code: currency.code, currency_symbol: currency.symbol,
        recipient_name: recipient, recipient_email, doc_date, due_date,
      }

      if (docType === 'Invoice' || docType === 'Receipt') {
        body.line_items = lineItems
        body.tax_rate = 10
        if (docType === 'Receipt') body.payment_method = document.getElementById('payMethod')?.value
      }
      if (docType === 'Contract') {
        body.scope_of_work = document.getElementById('scopeWork')?.value
        body.contract_value = parseFloat(document.getElementById('contractVal')?.value) || 0
        body.governing_law = document.getElementById('govLaw')?.value
      }
      if (docType === 'Proposal') {
        body.executive_summary = document.getElementById('execSummary')?.value
        body.proposed_value = parseFloat(document.getElementById('proposedVal')?.value) || 0
      }
      if (docType === 'NDA') {
        body.disclosing_party = document.getElementById('discParty')?.value
        body.receiving_party = document.getElementById('recParty')?.value
        body.nda_purpose = document.getElementById('ndaPurpose')?.value
        body.nda_duration_years = parseInt(document.getElementById('ndaDuration')?.value) || 2
      }

      const doc = await api.createDoc(body)

      // Save sender signature if drawn
      if (sigMode === 'draw') {
        const canvas = canvasRef.current
        if (canvas) {
          const sigData = canvas.toDataURL('image/png')
          await api.saveSignature(sigData).catch(() => {})
        }
      }

      onCreated(doc)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <h2 style={s.modalTitle}>Create New Document</h2>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>

        {error && <div style={s.error}>{error}</div>}

        {/* DOC TYPE */}
        <div style={s.sectionLabel}>Document Type</div>
        <div style={s.docTypes}>
          {DOC_TYPES.map(dt => (
            <button key={dt.type} style={{ ...s.typeBtn, ...(docType === dt.type ? s.typeBtnActive : {}) }} onClick={() => setDocType(dt.type)}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{dt.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{dt.type}</div>
            </button>
          ))}
        </div>

        {/* TEMPLATE */}
        <div style={s.sectionLabel}>Template</div>
        <div style={s.templates}>
          {['Clean', 'Modern', 'Minimalist', 'Corporate'].map(t => (
            <button key={t} style={{ ...s.tplBtn, ...(template === t ? s.tplBtnActive : {}) }} onClick={() => setTemplate(t)}>
              {t}
            </button>
          ))}
        </div>

        {/* CURRENCY */}
        <div style={s.sectionLabel}>Currency</div>
        <div style={s.currGrid}>
          {CURRENCIES.map(c => (
            <button key={c.code} style={{ ...s.currBtn, ...(currency.code === c.code ? s.currBtnActive : {}) }} onClick={() => setCurrency(c)}>
              <div style={{ fontSize: 16 }}>{c.flag}</div>
              <div style={{ fontSize: 10, fontWeight: 700 }}>{c.code}</div>
            </button>
          ))}
        </div>

        <div style={s.divider} />

        {/* BASE FIELDS */}
        <div style={s.grid2}>
          <Field label="Document Title" id="docTitle" placeholder={`${docType} #001`} />
          <Field label="Recipient Name" id="docRecipient" placeholder="Client / Company" />
          <Field label="Recipient Email" id="docEmail" type="email" placeholder="client@example.com" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Date" id="docDate" type="date" defaultValue={new Date().toISOString().slice(0,10)} />
            <Field label="Due Date" id="docDue" type="date" />
          </div>
        </div>

        {/* TYPE-SPECIFIC FIELDS */}
        {(docType === 'Invoice' || docType === 'Receipt') && (
          <div style={{ marginTop: '1rem' }}>
            <div style={s.sectionLabel}>Line Items</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 28px', gap: 6, marginBottom: 6 }}>
              {['Description','Qty','Unit Price','Total',''].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#A8A49C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {lineItems.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 28px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <input style={s.lineInput} value={item.desc} onChange={e => updateItem(i, 'desc', e.target.value)} placeholder="Item description" />
                <input style={s.lineInput} type="number" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} min="1" />
                <input style={s.lineInput} type="number" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} placeholder="0.00" step="0.01" />
                <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{currency.symbol}{(item.qty * item.price).toFixed(2)}</div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#A8A49C' }} onClick={() => setLineItems(lineItems.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            <button style={s.addItemBtn} onClick={() => setLineItems([...lineItems, { desc: '', qty: 1, price: 0 }])}>+ Add Item</button>
            <div style={{ textAlign: 'right', marginTop: 12, paddingTop: 12, borderTop: '1px solid #E8E5DE' }}>
              <div style={{ fontSize: 13, color: '#6B6860', marginBottom: 3 }}>Subtotal: <strong>{currency.symbol}{subtotal.toFixed(2)}</strong></div>
              <div style={{ fontSize: 13, color: '#6B6860', marginBottom: 6 }}>Tax (10%): <strong>{currency.symbol}{tax.toFixed(2)}</strong></div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Total: {currency.symbol}{total.toFixed(2)}</div>
            </div>
            {docType === 'Receipt' && (
              <div style={{ marginTop: 10 }}>
                <label style={s.fieldLabel}>Payment Method</label>
                <select id="payMethod" style={s.select}><option>Cash</option><option>Card</option><option>Bank Transfer</option><option>Mobile Money</option></select>
              </div>
            )}
          </div>
        )}

        {docType === 'Contract' && (
          <div style={s.grid2}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={s.fieldLabel}>Scope of Work</label>
              <textarea id="scopeWork" style={{ ...s.lineInput, minHeight: 100, resize: 'vertical', width: '100%', marginTop: 4 }} placeholder="Describe deliverables and terms…" />
            </div>
            <Field label="Contract Value" id="contractVal" type="number" placeholder="0.00" />
            <Field label="Governing Law" id="govLaw" placeholder="e.g. Laws of Ghana" />
          </div>
        )}

        {docType === 'Proposal' && (
          <div style={s.grid2}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={s.fieldLabel}>Executive Summary</label>
              <textarea id="execSummary" style={{ ...s.lineInput, minHeight: 90, resize: 'vertical', width: '100%', marginTop: 4 }} placeholder="Brief overview of the proposal…" />
            </div>
            <Field label="Proposed Value" id="proposedVal" type="number" placeholder="0.00" />
          </div>
        )}

        {docType === 'NDA' && (
          <div style={s.grid2}>
            <Field label="Disclosing Party" id="discParty" placeholder="Who shares info" />
            <Field label="Receiving Party" id="recParty" placeholder="Who receives info" />
            <Field label="Purpose" id="ndaPurpose" placeholder="Purpose of disclosure" />
            <Field label="Duration (years)" id="ndaDuration" type="number" defaultValue="2" min="1" max="20" />
          </div>
        )}

        <div style={s.divider} />

        {/* SIGNATURE */}
        <div style={s.sectionLabel}>Your Signature (Sender signs first)</div>
        <div style={s.sigTabs}>
          {['draw', 'type'].map(m => (
            <button key={m} style={{ ...s.sigTab, ...(sigMode === m ? s.sigTabActive : {}) }} onClick={() => setSigMode(m)}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {sigMode === 'draw' ? (
          <div>
            <canvas ref={canvasRef} width={600} height={100}
              style={{ border: '1px dashed #D4D0C8', borderRadius: 10, cursor: 'crosshair', background: '#FAFAF8', width: '100%', height: 100, display: 'block' }}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={() => drawing.current = false} onMouseLeave={() => drawing.current = false}
              onTouchStart={e => { e.preventDefault(); onMouseDown(e) }}
              onTouchMove={e => { e.preventDefault(); onMouseMove(e) }}
              onTouchEnd={() => drawing.current = false}
            />
            <button style={s.clearBtn} onClick={clearCanvas}>Clear</button>
          </div>
        ) : (
          <input style={{ ...s.lineInput, fontFamily: 'Instrument Serif, serif', fontSize: 28, padding: '10px 14px', width: '100%' }}
            placeholder="Type your signature…" value={sigText} onChange={e => setSigText(e.target.value)} />
        )}

        <div style={s.divider} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={s.draftBtn} onClick={() => handleSubmit('Draft')} disabled={loading}>Save Draft</button>
            <button style={s.sendBtn} onClick={() => handleSubmit('Pending')} disabled={loading}>
              {loading ? 'Saving…' : 'Save & Send for Signing →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, id, type = 'text', placeholder, defaultValue, min, max }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#6B6860', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input id={id} type={type} placeholder={placeholder} defaultValue={defaultValue} min={min} max={max}
        style={{ padding: '9px 12px', border: '1px solid #D4D0C8', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif', background: '#FAFAF8', color: '#1A1916', outline: 'none' }} />
    </div>
  )
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal: { background: '#fff', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 740, maxHeight: '92vh', overflowY: 'auto', fontFamily: 'DM Sans, sans-serif' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  modalTitle: { fontFamily: 'Instrument Serif, serif', fontSize: '1.4rem', fontStyle: 'italic' },
  closeBtn: { background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#A8A49C', lineHeight: 1 },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: '1rem' },
  sectionLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A8A49C', marginBottom: 8 },
  docTypes: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: '1.25rem' },
  typeBtn: { padding: '12px 8px', border: '1.5px solid #E8E5DE', borderRadius: 10, cursor: 'pointer', background: '#fff', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' },
  typeBtnActive: { borderColor: '#2563EB', background: '#EFF6FF' },
  templates: { display: 'flex', gap: 8, marginBottom: '1.25rem' },
  tplBtn: { flex: 1, padding: '8px', border: '1.5px solid #E8E5DE', borderRadius: 8, cursor: 'pointer', background: '#fff', fontSize: 13, fontFamily: 'DM Sans, sans-serif' },
  tplBtnActive: { borderColor: '#2563EB', background: '#EFF6FF', color: '#2563EB', fontWeight: 600 },
  currGrid: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: '1rem', maxHeight: 130, overflowY: 'auto' },
  currBtn: { padding: '8px 4px', border: '1px solid #E8E5DE', borderRadius: 8, cursor: 'pointer', background: '#fff', textAlign: 'center', fontFamily: 'DM Sans, sans-serif' },
  currBtnActive: { borderColor: '#2563EB', background: '#EFF6FF' },
  divider: { height: 1, background: '#E8E5DE', margin: '1.25rem 0' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  fieldLabel: { fontSize: 11, fontWeight: 700, color: '#6B6860', textTransform: 'uppercase', letterSpacing: '0.05em' },
  select: { padding: '9px 12px', border: '1px solid #D4D0C8', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif', background: '#FAFAF8', color: '#1A1916', marginTop: 4, width: '100%' },
  lineInput: { padding: '8px 10px', border: '1px solid #D4D0C8', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif', background: '#FAFAF8', color: '#1A1916', outline: 'none' },
  addItemBtn: { background: 'none', border: '1px dashed #D4D0C8', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer', color: '#6B6860', fontFamily: 'DM Sans, sans-serif', marginTop: 4 },
  sigTabs: { display: 'flex', border: '1px solid #D4D0C8', borderRadius: 8, overflow: 'hidden', width: 'fit-content', marginBottom: 10 },
  sigTab: { padding: '7px 18px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif', color: '#6B6860' },
  sigTabActive: { background: '#1A1916', color: '#fff' },
  clearBtn: { background: 'none', border: '1px solid #D4D0C8', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: '#6B6860', fontFamily: 'DM Sans, sans-serif', marginTop: 6 },
  cancelBtn: { background: 'transparent', color: '#6B6860', border: '1px solid #D4D0C8', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  draftBtn: { background: 'transparent', color: '#1A1916', border: '1px solid #D4D0C8', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 },
  sendBtn: { background: '#1A1916', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 },
}
