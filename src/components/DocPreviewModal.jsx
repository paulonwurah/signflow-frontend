import { useState } from 'react'

const TPL_COLORS = {
  Clean:      { header: '#F7F6F2', headerText: '#1A1916', accent: '#1A1916' },
  Modern:     { header: '#1A1916', headerText: '#fff',    accent: '#fff' },
  Minimalist: { header: '#fff',    headerText: '#000',    accent: '#000' },
  Corporate:  { header: '#1D4ED8', headerText: '#fff',    accent: '#fff' },
}

export default function DocPreviewModal({ doc, onClose, onSend }) {
  const [tpl, setTpl] = useState(doc.template || 'Clean')
  const colors = TPL_COLORS[tpl] || TPL_COLORS.Clean
  const sym = doc.currency_symbol || '$'

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        {/* MODAL HEADER */}
        <div style={s.modalHeader}>
          <div>
            <div style={s.modalTitle}>{doc.title}</div>
            <div style={s.modalSub}>{doc.doc_type} · {doc.status}</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{display:'flex',gap:4}}>
              {['Clean','Modern','Minimalist','Corporate'].map(t=>(
                <button key={t} style={{...s.tplBtn,...(tpl===t?s.tplBtnActive:{})}} onClick={()=>setTpl(t)}>{t}</button>
              ))}
            </div>
            {doc.status==='Draft' && <button style={s.sendBtn} onClick={onSend}>Send for Signing →</button>}
            <button style={s.closeBtn} onClick={onClose}>×</button>
          </div>
        </div>

        {/* DOC PAGE */}
        <div style={s.previewBg}>
          <div style={s.docPage}>
            {/* HEADER */}
            <div style={{...s.docHeader, background:colors.header}}>
              <div>
                {tpl==='Minimalist'
                  ? <div style={{fontSize:'0.95rem',fontWeight:300,letterSpacing:'0.18em',textTransform:'uppercase',color:colors.headerText}}>{doc.doc_type}</div>
                  : tpl==='Clean'
                  ? <div style={{fontFamily:'Georgia,serif',fontSize:'1.5rem',fontStyle:'italic',color:colors.headerText}}>{doc.doc_type}</div>
                  : <div style={{fontSize:'1.3rem',fontWeight:600,color:colors.headerText}}>{doc.doc_type}</div>
                }
                <div style={{fontSize:12,color:tpl==='Clean'?'#6B6860':'rgba(255,255,255,0.6)',marginTop:3}}>
                  {doc.doc_type==='Invoice'?'#INV-001':doc.doc_type==='Contract'?'#CON-007':doc.doc_type==='Proposal'?'#PRO-012':doc.doc_type==='NDA'?'#NDA-003':'#REC-004'}
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:13,fontWeight:600,color:colors.headerText}}>{doc.company_name||'Your Company'}</div>
                <div style={{fontSize:11,color:tpl==='Clean'?'#6B6860':'rgba(255,255,255,0.6)',marginTop:2}}>{doc.company_address||'Your Address'}</div>
              </div>
            </div>

            {/* BODY */}
            <div style={s.docBody}>
              {/* META */}
              <div style={s.metaGrid}>
                <MetaBlock label="Date" value={doc.doc_date||new Date().toLocaleDateString()} />
                <MetaBlock label="Due" value={doc.due_date||'—'} />
                <MetaBlock label="From" value={doc.company_name||'—'} sub={doc.company_address} />
                <MetaBlock label="To" value={doc.recipient_name||'—'} sub={doc.recipient_email} />
                {doc.total&&<MetaBlock label="Total" value={`${sym}${Number(doc.total).toLocaleString()}`} highlight />}
              </div>

              {/* TYPE-SPECIFIC */}
              {(doc.doc_type==='Invoice'||doc.doc_type==='Receipt') && doc.line_items?.length>0 && (
                <div style={{marginBottom:'1.25rem'}}>
                  <div style={s.sectionLabel}>Line Items</div>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr>
                      {['Description','Qty','Unit Price','Total'].map(h=><th key={h} style={s.lineHead}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {doc.line_items.map((item,i)=>(
                        <tr key={i} style={{borderBottom:'0.5px solid #F1F0EC'}}>
                          <td style={s.lineCell}>{item.desc||'—'}</td>
                          <td style={s.lineCell}>{item.qty}</td>
                          <td style={s.lineCell}>{sym}{Number(item.price).toFixed(2)}</td>
                          <td style={{...s.lineCell,fontWeight:600,textAlign:'right'}}>{sym}{(item.qty*item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{textAlign:'right',marginTop:10,paddingTop:10,borderTop:'1px solid #E8E5DE'}}>
                    <div style={{fontSize:12,color:'#6B6860',marginBottom:3}}>Subtotal: <strong>{sym}{Number(doc.subtotal||0).toFixed(2)}</strong></div>
                    <div style={{fontSize:12,color:'#6B6860',marginBottom:6}}>Tax ({doc.tax_rate||10}%): <strong>{sym}{Number(doc.tax_amount||0).toFixed(2)}</strong></div>
                    <div style={{fontSize:16,fontWeight:700}}>Total: {sym}{Number(doc.total||0).toFixed(2)}</div>
                  </div>
                </div>
              )}

              {doc.doc_type==='Contract' && (
                <div>
                  {doc.scope_of_work&&<ProseBlock label="Scope of Work" text={doc.scope_of_work} />}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                    {doc.contract_value&&<MetaBlock label="Contract Value" value={`${sym}${Number(doc.contract_value).toLocaleString()}`} />}
                    {doc.governing_law&&<MetaBlock label="Governing Law" value={doc.governing_law} />}
                  </div>
                  <div style={s.legalBox}>Either party may terminate with 30 days written notice. All work completed up to termination shall be compensated at the agreed rate.</div>
                </div>
              )}

              {doc.doc_type==='Proposal' && (
                <div>
                  {doc.executive_summary&&<ProseBlock label="Executive Summary" text={doc.executive_summary} />}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                    {doc.proposed_value&&<MetaBlock label="Proposed Value" value={`${sym}${Number(doc.proposed_value).toLocaleString()}`} highlight />}
                    {doc.proposal_valid_until&&<MetaBlock label="Valid Until" value={doc.proposal_valid_until} />}
                  </div>
                  <div style={{background:'#FFFBEB',borderRadius:6,padding:'0.75rem 1rem',fontSize:12,color:'#92400E'}}>To proceed: sign and return. 50% deposit due on acceptance.</div>
                </div>
              )}

              {doc.doc_type==='NDA' && (
                <div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                    <MetaBlock label="Disclosing Party" value={doc.disclosing_party||'—'} />
                    <MetaBlock label="Receiving Party" value={doc.receiving_party||'—'} />
                    <MetaBlock label="Purpose" value={doc.nda_purpose||'—'} />
                    <MetaBlock label="Duration" value={`${doc.nda_duration_years||2} years`} />
                  </div>
                  <div style={s.legalBox}>All shared information shall be kept strictly confidential for the duration of this agreement and not disclosed to any third party without prior written consent.</div>
                </div>
              )}

              {doc.notes && <ProseBlock label="Notes" text={doc.notes} />}

              {/* SIGNATURE BLOCKS */}
              <div style={s.sigRow}>
                <div><div style={s.sectionLabel}>Sender</div><div style={s.sigLine}></div><div style={{fontSize:11,color:'#6B6860',marginTop:5}}>{doc.company_name||'—'}</div></div>
                <div><div style={s.sectionLabel}>Recipient</div><div style={s.sigLine}></div><div style={{fontSize:11,color:'#6B6860',marginTop:5}}>{doc.recipient_name||'—'}</div></div>
              </div>
            </div>

            {/* FOOTER */}
            <div style={s.docFooter}>
              <span>Generated by SignFlow</span>
              <span>Document ID: {doc.id?.slice(0,8)||'—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaBlock({ label, value, sub, highlight }) {
  return (
    <div>
      <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#A8A49C',marginBottom:3}}>{label}</div>
      <div style={{fontSize:highlight?15:13,fontWeight:highlight?700:500,color:'#1A1916'}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:'#6B6860',marginTop:1}}>{sub}</div>}
    </div>
  )
}

function ProseBlock({ label, text }) {
  return (
    <div style={{marginBottom:'1rem'}}>
      <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#A8A49C',marginBottom:6}}>{label}</div>
      <div style={{fontSize:13,color:'#1A1916',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{text}</div>
    </div>
  )
}

const s = {
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:300,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'2rem',overflowY:'auto'},
  modal:{background:'#F7F6F2',borderRadius:16,width:'100%',maxWidth:760,overflow:'hidden'},
  modalHeader:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1rem 1.25rem',background:'#fff',borderBottom:'0.5px solid #E8E5DE',gap:12,flexWrap:'wrap'},
  modalTitle:{fontFamily:'Instrument Serif,serif',fontSize:'1.1rem',fontStyle:'italic'},
  modalSub:{fontSize:12,color:'#6B6860',marginTop:2},
  tplBtn:{padding:'4px 10px',borderRadius:6,border:'0.5px solid #E8E5DE',background:'transparent',fontSize:11,cursor:'pointer',fontFamily:'DM Sans,sans-serif',color:'#6B6860'},
  tplBtnActive:{background:'#1A1916',color:'#fff',borderColor:'#1A1916'},
  sendBtn:{background:'#2563EB',color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif'},
  closeBtn:{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#A8A49C',lineHeight:1,padding:'2px 6px'},
  previewBg:{padding:'1.5rem',display:'flex',justifyContent:'center'},
  docPage:{background:'#fff',width:'100%',maxWidth:640,borderRadius:10,overflow:'hidden',border:'0.5px solid #E8E5DE'},
  docHeader:{padding:'1.5rem',display:'flex',justifyContent:'space-between',alignItems:'flex-start'},
  docBody:{padding:'1.5rem'},
  metaGrid:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',marginBottom:'1.25rem',paddingBottom:'1.25rem',borderBottom:'0.5px solid #E8E5DE'},
  sectionLabel:{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#A8A49C',marginBottom:8},
  lineHead:{textAlign:'left',padding:'6px 8px',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'#A8A49C',borderBottom:'0.5px solid #E8E5DE'},
  lineCell:{padding:'8px 8px',fontSize:13,color:'#1A1916'},
  sigRow:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem',marginTop:'1.5rem',paddingTop:'1.25rem',borderTop:'0.5px solid #E8E5DE'},
  sigLine:{height:40,borderBottom:'1px solid #1A1916',marginTop:6},
  legalBox:{background:'#F7F6F2',borderRadius:6,padding:'0.875rem 1rem',fontSize:12,color:'#6B6860',lineHeight:1.65,marginBottom:'1rem'},
  docFooter:{padding:'0.875rem 1.5rem',borderTop:'0.5px solid #E8E5DE',display:'flex',justifyContent:'space-between',fontSize:11,color:'#A8A49C',background:'#FAFAF8'},
}
