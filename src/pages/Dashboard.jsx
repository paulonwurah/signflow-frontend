import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import NewDocModal from '../components/NewDocModal'
import DocPreviewModal from '../components/DocPreviewModal'

const STATUS_STYLE = {
  Draft:     { background:'#F1F0EC', color:'#6B6860' },
  Pending:   { background:'#FFFBEB', color:'#D97706' },
  Signed:    { background:'#F0FDF4', color:'#16A34A' },
  Completed: { background:'#EFF6FF', color:'#2563EB' },
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const chartRef = useRef(null)
  const donutRef = useRef(null)
  const barRef   = useRef(null)
  const chartsInit = useRef(false)

  const [docs, setDocs]             = useState([])
  const [stats, setStats]           = useState({ total:0, Draft:0, Pending:0, Completed:0, Signed:0 })
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all')
  const [search, setSearch]         = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [signingLink, setSigningLink] = useState(null)
  const [copied, setCopied]         = useState(false)
  const [period, setPeriod]         = useState('30')

  const loadData = useCallback(async () => {
    try {
      const params = {}
      if (filter !== 'all') params.status = filter
      if (search) params.search = search
      const [docsRes, statsRes] = await Promise.all([api.getDocs(params), api.getStats()])
      setDocs(docsRes.documents || [])
      setStats(statsRes)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [filter, search])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (loading || chartsInit.current) return
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    s.onload = () => { chartsInit.current = true; initCharts() }
    document.head.appendChild(s)
  }, [loading])

  function initCharts() {
    const C = window.Chart
    if (!C) return
    if (chartRef.current) new C(chartRef.current, { type:'line', data:{ labels:['Oct','Nov','Dec','Jan','Feb','Mar'], datasets:[{ label:'Sent', data:[5,7,4,9,8,12], borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.06)', tension:0.4, pointRadius:3, fill:true, borderWidth:2 },{ label:'Signed', data:[3,5,3,7,6,10], borderColor:'#16A34A', backgroundColor:'rgba(22,163,74,0.06)', tension:0.4, pointRadius:3, fill:true, borderWidth:2 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false }, ticks:{ font:{ size:11 } } }, y:{ grid:{ color:'rgba(0,0,0,0.04)' }, beginAtZero:true, ticks:{ font:{ size:11 } } } } } })
    if (donutRef.current) new C(donutRef.current, { type:'doughnut', data:{ labels:['Completed','Pending','Draft','Signed'], datasets:[{ data:[stats.Completed||34,stats.Pending||7,stats.Draft||5,stats.Signed||2], backgroundColor:['#2563EB','#D97706','#9B9890','#16A34A'], borderWidth:0 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, cutout:'72%' } })
    if (barRef.current) new C(barRef.current, { type:'bar', data:{ labels:['Invoice','Contract','Proposal','Receipt','NDA'], datasets:[{ data:[12000,21600,10700,1000,0], backgroundColor:'#2563EB', borderRadius:4, borderSkipped:false }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false }, ticks:{ font:{ size:10 }, autoSkip:false } }, y:{ grid:{ color:'rgba(0,0,0,0.04)' }, ticks:{ callback:v=>'$'+Math.round(v/1000)+'k', font:{ size:10 } }, beginAtZero:true } } } })
  }

  async function handleDelete(id) {
    if (!confirm('Delete this document?')) return
    await api.deleteDoc(id); loadData()
  }

  async function handleSend(id) {
    try {
      const doc = docs.find(d => d.id === id)
      await api.sendDoc(id)
      if (doc?.signing_token) setSigningLink(`${window.location.origin}/sign/${doc.signing_token}`)
      loadData()
    } catch(e) { alert(e.message) }
  }

  function handleDocCreated(doc) {
    setShowModal(false)
    if (doc.status === 'Pending' && doc.signing_token) setSigningLink(`${window.location.origin}/sign/${doc.signing_token}`)
    loadData()
  }

  const totalValue = docs.reduce((s,d) => s + (Number(d.total)||0), 0)

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.logo} onClick={() => navigate('/')}>Sign<span style={{color:'#2563EB'}}>Flow</span></div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:13,color:'#6B6860'}}>{profile?.company_name||user?.email}</span>
          <span style={s.planBadge}>{(profile?.plan||'free').toUpperCase()}</span>
          <button style={s.btnOutline} onClick={() => navigate('/settings')}>Settings</button>
          <button style={s.btnOutline} onClick={signOut}>Sign out</button>
        </div>
      </nav>

      <div style={s.wrap}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Dashboard</h1>
            <p style={s.sub}>{new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <select style={s.select} value={period} onChange={e=>setPeriod(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button style={s.btnPrimary} onClick={()=>setShowModal(true)}>+ New Document</button>
          </div>
        </div>

        <div style={s.statsRow}>
          {[
            {label:'Total documents', value:stats.total, delta:'+12 this month', up:true},
            {label:'Pending signature', value:stats.Pending||0, delta:'awaiting response', up:false},
            {label:'Completed', value:(stats.Completed||0)+(stats.Signed||0), delta:`${stats.total?Math.round(((stats.Completed||0)+(stats.Signed||0))/stats.total*100):0}% close rate`, up:true},
            {label:'Total value', value:`$${totalValue.toLocaleString()}`, delta:'across all docs', up:true},
          ].map(st=>(
            <div key={st.label} style={s.statCard}>
              <div style={s.statLabel}>{st.label}</div>
              <div style={s.statVal}>{st.value}</div>
              <div style={{fontSize:11,color:st.up?'#16A34A':'#D97706',marginTop:3}}>{st.delta}</div>
            </div>
          ))}
        </div>

        {signingLink && (
          <div style={s.linkBanner}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>Share this signing link with your recipient:</div>
              <div style={{fontSize:12,color:'#2563EB',fontFamily:'monospace',wordBreak:'break-all'}}>{signingLink}</div>
            </div>
            <div style={{display:'flex',gap:8,flexShrink:0}}>
              <button style={{...s.btnOutline,fontSize:12}} onClick={()=>{navigator.clipboard.writeText(signingLink);setCopied(true);setTimeout(()=>setCopied(false),2000)}}>{copied?'Copied!':'Copy'}</button>
              <button style={{...s.btnOutline,color:'#DC2626',fontSize:12}} onClick={()=>setSigningLink(null)}>×</button>
            </div>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
          <div style={s.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <div style={s.cardTitle}>Documents over time</div>
              <div style={{display:'flex',gap:12,fontSize:11,color:'#6B6860'}}>
                <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:2,background:'#2563EB',display:'inline-block'}}></span>Sent</span>
                <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:2,background:'#16A34A',display:'inline-block'}}></span>Signed</span>
              </div>
            </div>
            <div style={{position:'relative',height:180}}><canvas ref={chartRef}></canvas></div>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Status breakdown</div>
            <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
              <div style={{position:'relative',width:90,height:90,flexShrink:0}}><canvas ref={donutRef}></canvas></div>
              <div style={{display:'flex',flexDirection:'column',gap:7}}>
                {[['#2563EB','Completed',stats.Completed||0],['#D97706','Pending',stats.Pending||0],['#9B9890','Draft',stats.Draft||0],['#16A34A','Signed',stats.Signed||0]].map(([c,l,v])=>(
                  <div key={l} style={{display:'flex',alignItems:'center',gap:7,fontSize:12}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:c,flexShrink:0}}></div>
                    <span style={{color:'#6B6860',flex:1}}>{l}</span>
                    <span style={{fontWeight:500}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'1rem',marginBottom:'1rem'}}>
          <div style={s.card}>
            <div style={s.cardTitle}>Revenue by type</div>
            <div style={{position:'relative',height:150}}><canvas ref={barRef}></canvas></div>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Top documents</div>
            {[{name:'App Development',type:'Contract',val:'$12,000'},{name:'Website Redesign',type:'Invoice',val:'$8,140'},{name:'Q2 Retainer',type:'Contract',val:'$3,600'},{name:'Brand Identity',type:'Proposal',val:'$4,200'}].map((d,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<3?'0.5px solid #F1F0EC':'none'}}>
                <div><div style={{fontSize:13,fontWeight:500}}>{d.name}</div><div style={{fontSize:11,color:'#A8A49C'}}>{d.type}</div></div>
                <div style={{fontSize:13,fontWeight:500}}>{d.val}</div>
              </div>
            ))}
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Activity</div>
            {[{c:'#16A34A',t:'Rachel Lima signed Q2 Retainer',ts:'2 min ago'},{c:'#2563EB',t:'Invoice sent to BuildRight Ltd.',ts:'1 hr ago'},{c:'#D97706',t:'NDA — TechVentures expires soon',ts:'Reminder'},{c:'#16A34A',t:'Brand Guidelines NDA signed',ts:'Yesterday'},{c:'#2563EB',t:'New proposal: App Development',ts:'2 days ago'}].map((a,i)=>(
              <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:i<4?'0.5px solid #F1F0EC':'none',alignItems:'flex-start'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:a.c,flexShrink:0,marginTop:4}}></div>
                <div><div style={{fontSize:12,lineHeight:1.5}}>{a.t}</div><div style={{fontSize:11,color:'#A8A49C',marginTop:1}}>{a.ts}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.tableWrap}>
          <div style={s.toolbar}>
            <input style={s.searchInput} placeholder="Search documents…" value={search} onChange={e=>setSearch(e.target.value)} />
            <div style={{display:'flex',gap:6}}>
              {['all','Draft','Pending','Signed','Completed'].map(f=>(
                <button key={f} style={{...s.filterBtn,...(filter===f?s.filterActive:{})}} onClick={()=>setFilter(f)}>{f==='all'?'All':f}</button>
              ))}
            </div>
          </div>
          {loading ? <div style={s.empty}>Loading…</div> : docs.length===0 ? (
            <div style={s.empty}><div style={{fontSize:28,marginBottom:8}}>📄</div><div style={{fontWeight:500,marginBottom:4}}>No documents</div><button style={{...s.btnPrimary,marginTop:10}} onClick={()=>setShowModal(true)}>+ New Document</button></div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed'}}>
              <thead><tr>{[['Document','35%'],['Type','12%'],['Status','12%'],['Date','11%'],['Value','12%'],['Actions','18%']].map(([h,w])=><th key={h} style={{...s.th,width:w}}>{h}</th>)}</tr></thead>
              <tbody>
                {docs.map(doc=>(
                  <tr key={doc.id} style={{borderBottom:'0.5px solid #F7F6F2',cursor:'pointer'}} onClick={()=>setPreviewDoc(doc)}>
                    <td style={s.td}><div style={{fontWeight:500,fontSize:13}}>{doc.title}</div><div style={{fontSize:11,color:'#A8A49C'}}>{doc.recipient_name||'—'}</div></td>
                    <td style={{...s.td,color:'#6B6860',fontSize:13}}>{doc.doc_type}</td>
                    <td style={s.td}><span style={{...s.badge,...(STATUS_STYLE[doc.status]||{})}}>{doc.status}</span></td>
                    <td style={{...s.td,color:'#6B6860',fontSize:12}}>{doc.doc_date||'—'}</td>
                    <td style={{...s.td,fontWeight:500,fontSize:13}}>{doc.total?`${doc.currency_symbol}${Number(doc.total).toLocaleString()}`:'—'}</td>
                    <td style={s.td} onClick={e=>e.stopPropagation()}>
                      <div style={{display:'flex',gap:5}}>
                        {doc.status==='Draft'&&<button style={s.actBtn} onClick={()=>handleSend(doc.id)}>Send</button>}
                        {doc.status==='Pending'&&<button style={s.actBtn} onClick={()=>setSigningLink(`${window.location.origin}/sign/${doc.signing_token}`)}>Copy link</button>}
                        <button style={{...s.actBtn,color:'#DC2626'}} onClick={()=>handleDelete(doc.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && <NewDocModal onClose={()=>setShowModal(false)} onCreated={handleDocCreated} />}
      {previewDoc && <DocPreviewModal doc={previewDoc} onClose={()=>setPreviewDoc(null)} onSend={()=>{handleSend(previewDoc.id);setPreviewDoc(null)}} />}
    </div>
  )
}

const s = {
  page:{minHeight:'100vh',background:'#F7F6F2',fontFamily:'DM Sans,sans-serif'},
  nav:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 2rem',height:52,background:'#fff',borderBottom:'0.5px solid #E8E5DE',position:'sticky',top:0,zIndex:100},
  logo:{fontFamily:'Instrument Serif,serif',fontSize:'1.3rem',fontStyle:'italic',cursor:'pointer',color:'#1A1916'},
  planBadge:{background:'#EFF6FF',color:'#2563EB',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20},
  wrap:{padding:'1.5rem',maxWidth:1100,margin:'0 auto'},
  header:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.25rem'},
  title:{fontFamily:'Instrument Serif,serif',fontSize:'1.5rem',fontStyle:'italic',marginBottom:2},
  sub:{fontSize:12,color:'#6B6860'},
  statsRow:{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:'1rem',marginBottom:'1.25rem'},
  statCard:{background:'#EFEDE7',borderRadius:10,padding:'1rem'},
  statLabel:{fontSize:10,color:'#9B9890',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'},
  statVal:{fontFamily:'Instrument Serif,serif',fontSize:'1.8rem',fontStyle:'italic',lineHeight:1,marginBottom:2},
  card:{background:'#fff',border:'0.5px solid #E8E5DE',borderRadius:14,padding:'1.25rem'},
  cardTitle:{fontSize:11,fontWeight:600,color:'#9B9890',marginBottom:'0.75rem',textTransform:'uppercase',letterSpacing:'0.06em'},
  tableWrap:{background:'#fff',border:'0.5px solid #E8E5DE',borderRadius:14,overflow:'hidden'},
  toolbar:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.875rem 1.25rem',borderBottom:'0.5px solid #E8E5DE',flexWrap:'wrap',gap:8},
  searchInput:{padding:'7px 12px',border:'0.5px solid #D4D0C8',borderRadius:8,fontSize:13,fontFamily:'DM Sans,sans-serif',background:'#F7F6F2',color:'#1A1916',width:220,outline:'none'},
  filterBtn:{padding:'4px 12px',borderRadius:20,border:'0.5px solid #E8E5DE',background:'transparent',fontSize:12,fontFamily:'DM Sans,sans-serif',cursor:'pointer',color:'#6B6860'},
  filterActive:{background:'#1A1916',color:'#fff',borderColor:'#1A1916'},
  th:{textAlign:'left',padding:'8px 1rem',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#A8A49C',background:'#F7F6F2',borderBottom:'0.5px solid #E8E5DE'},
  td:{padding:'10px 1rem',verticalAlign:'middle'},
  badge:{display:'inline-block',padding:'2px 9px',borderRadius:20,fontSize:11,fontWeight:600},
  actBtn:{padding:'4px 10px',borderRadius:7,border:'0.5px solid #E8E5DE',background:'transparent',fontSize:11,cursor:'pointer',fontFamily:'DM Sans,sans-serif',color:'#1A1916'},
  empty:{padding:'3rem',textAlign:'center',color:'#A8A49C',fontSize:13},
  btnPrimary:{background:'#1A1916',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif'},
  btnOutline:{background:'transparent',color:'#1A1916',border:'0.5px solid #D4D0C8',borderRadius:8,padding:'6px 14px',fontSize:12,cursor:'pointer',fontFamily:'DM Sans,sans-serif'},
  select:{padding:'6px 10px',borderRadius:8,border:'0.5px solid #D4D0C8',background:'#fff',fontSize:12,color:'#1A1916',fontFamily:'DM Sans,sans-serif'},
  linkBanner:{background:'#EFF6FF',border:'0.5px solid #BFDBFE',borderRadius:10,padding:'0.875rem 1.25rem',marginBottom:'1.25rem',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12},
}
