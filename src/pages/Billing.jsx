import { useState, useEffect, useCallback } from 'react'
import api from '../api'

const T = {
  blue:'#3B56E8',blueSoft:'#5B7CFA',blueLight:'#EEF2FF',blueLight2:'#E0E7FF',
  bg:'#F0F3FF',white:'#FFFFFF',border:'#E0E7FF',
  dark:'#1A1A2E',muted:'#6B7280',muted2:'#9CA3AF',
  green:'#10B981',greenBg:'#ECFDF5',greenBdr:'#A7F3D0',
  red:'#EF4444',redBg:'#FEF2F2',redBdr:'#FECACA',
  amber:'#F59E0B',amberBg:'#FFFBEB',amberBdr:'#FDE68A',
  orange:'#F97316',
  shadow:'0 2px 12px rgba(59,86,232,0.07)',
  font:"'Plus Jakarta Sans',sans-serif",
}

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:0})

function statusStyle(s) {
  if (s === 'paid')          return { bg:T.greenBg, border:T.greenBdr, color:T.green,  label:'PAID' }
  if (s === 'unpaid')        return { bg:T.redBg,   border:T.redBdr,   color:T.red,    label:'UNPAID' }
  return                            { bg:T.bg,       border:T.border,   color:T.muted2, label:'NOT BILLED' }
}

function Modal({ title, sub, children, onClose }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:'fixed',inset:0,zIndex:300,background:'rgba(26,31,78,0.45)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:T.font}}>
      <style>{`@keyframes mi{from{opacity:0;transform:scale(0.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:22,width:'100%',maxWidth:440,boxShadow:'0 24px 60px rgba(59,86,232,0.18)',animation:'mi 0.25s ease both',overflow:'hidden'}}>
        <div style={{height:4,background:`linear-gradient(90deg,${T.blue},${T.blueSoft})`}}/>
        <div style={{padding:'20px 24px 16px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'2.5px',textTransform:'uppercase',color:T.muted2,marginBottom:4}}>Vayu Billing</div>
            <div style={{fontSize:20,fontWeight:800,color:T.dark}}>{title}</div>
            {sub && <div style={{fontSize:12,color:T.blue,marginTop:3,fontWeight:600}}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,width:28,height:28,cursor:'pointer',color:T.muted,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>
        <div style={{padding:'20px 24px'}}>{children}</div>
      </div>
    </div>
  )
}

export default function Billing({ user }) {
  const now = new Date()
  const [month,      setMonth]      = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`)
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')
  const [modal,      setModal]      = useState(null) // { store, action }
  const [notes,      setNotes]      = useState('')
  const [acting,     setActing]     = useState(false)
  const [toast,      setToast]      = useState(null)

  const showToast = (msg, ok=true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/admin/superadmin/billing?month=${month}`)
      setData(res.data)
    } catch { showToast('Could not load billing data.', false) }
    finally { setLoading(false) }
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  const changeMonth = dir => {
    const [y,m] = month.split('-').map(Number)
    const d = new Date(y, m-1+dir, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
  }

  const handleGenerate = async store => {
    setActing(true)
    try {
      await api.post('/api/admin/superadmin/billing/generate', { store_id: store.store_id, billing_month: month })
      showToast('Bill generated successfully.')
      setModal(null)
      fetchData()
    } catch (e) { showToast(e.response?.data?.error || 'Failed to generate bill.', false) }
    finally { setActing(false) }
  }

  const handleMarkPaid = async store => {
    setActing(true)
    try {
      await api.put(`/api/admin/superadmin/billing/${store.billing_id}/mark-paid`, { notes })
      showToast('Marked as paid.')
      setModal(null)
      setNotes('')
      fetchData()
    } catch (e) { showToast(e.response?.data?.error || 'Failed to mark as paid.', false) }
    finally { setActing(false) }
  }

  const filtered = (data?.stores || []).filter(s => {
    if (filter === 'all')           return true
    if (filter === 'not_generated') return s.billing_status === 'not_generated'
    return s.billing_status === filter
  })

  const sum = data?.summary || {}

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,fontFamily:T.font}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:36,height:36,border:`3px solid ${T.blueLight2}`,borderTopColor:T.blue,borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 12px'}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{color:T.muted,fontSize:13}}>Loading billing data…</div>
      </div>
    </div>
  )

  return (
    <div style={{fontFamily:T.font,maxWidth:1100,margin:'0 auto'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .bill-card:hover{box-shadow:0 4px 24px rgba(59,86,232,0.1)!important} .act-btn:hover{opacity:0.85}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{position:'fixed',top:20,right:20,zIndex:400,background:toast.ok?T.greenBg:T.redBg,border:`1.5px solid ${toast.ok?T.greenBdr:T.redBdr}`,borderRadius:12,padding:'12px 20px',color:toast.ok?T.green:T.red,fontWeight:700,fontSize:13,boxShadow:T.shadow,fontFamily:T.font}}>
          {toast.ok ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      {/* Page header */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:'2.5px',textTransform:'uppercase',color:T.muted2,marginBottom:6}}>Vayu Platform</div>
        <div style={{fontSize:26,fontWeight:800,color:T.dark,letterSpacing:'-0.5px'}}>Billing Management</div>
        <div style={{fontSize:13,color:T.muted,marginTop:4}}>Track GMV and collect platform fees from stores.</div>
      </div>

      {/* Month navigator */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:20,marginBottom:20}}>
        <button onClick={()=>changeMonth(-1)} style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:10,width:36,height:36,cursor:'pointer',fontSize:18,color:T.blue,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>‹</button>
        <div style={{fontSize:18,fontWeight:800,color:T.dark,minWidth:180,textAlign:'center'}}>{data?.month_label || month}</div>
        <button onClick={()=>changeMonth(1)} style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:10,width:36,height:36,cursor:'pointer',fontSize:18,color:T.blue,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>›</button>
      </div>

      {/* Summary strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[
          { label:'Total GMV',   value:fmt(sum.total_gmv), color:T.dark },
          { label:'Vayu Fee',    value:fmt(sum.total_fee), color:T.blue },
          { label:'Paid',        value:sum.paid_count??0,  color:T.green },
          { label:'Unpaid',      value:sum.unpaid_count??0,color:T.red },
        ].map(c => (
          <div key={c.label} style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:16,padding:'16px 20px',boxShadow:T.shadow}}>
            <div style={{fontSize:10,fontWeight:700,color:T.muted2,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:6}}>{c.label}</div>
            <div style={{fontSize:22,fontWeight:800,color:c.color}}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[
          {key:'all',           label:'All'},
          {key:'unpaid',        label:'Unpaid'},
          {key:'not_generated', label:'Not Billed'},
          {key:'paid',          label:'Paid'},
        ].map(f => (
          <button key={f.key} onClick={()=>setFilter(f.key)} style={{padding:'7px 16px',borderRadius:20,border:`1.5px solid ${filter===f.key?T.blue:T.border}`,background:filter===f.key?T.blueLight:T.white,color:filter===f.key?T.blue:T.muted,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:T.font,transition:'all 0.15s'}}>
            {f.label}
          </button>
        ))}
        <div style={{marginLeft:'auto',fontSize:12,color:T.muted2,alignSelf:'center'}}>
          {filtered.length} store{filtered.length!==1?'s':''}
        </div>
      </div>

      {/* Store table */}
      {filtered.length === 0 ? (
        <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:16,padding:48,textAlign:'center',color:T.muted}}>
          No stores match this filter.
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtered.map(store => {
            const ss = statusStyle(store.billing_status)
            return (
              <div key={store.store_id} className="bill-card" style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:16,padding:'18px 22px',boxShadow:T.shadow,transition:'box-shadow 0.2s'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap'}}>

                  {/* Store info */}
                  <div style={{flex:'1 1 180px'}}>
                    <div style={{fontSize:15,fontWeight:800,color:T.dark}}>{store.store_name}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{store.city||'—'} · {store.plan}</div>
                  </div>

                  {/* Numbers */}
                  <div style={{display:'flex',gap:24,flex:'2 1 300px',flexWrap:'wrap'}}>
                    {[
                      {label:'GMV',       value:fmt(store.total_gmv),      color:T.dark},
                      {label:'Orders',    value:store.total_orders,         color:T.dark},
                      {label:'UPI',       value:store.upi_orders,           color:T.muted},
                      {label:'Razorpay',  value:store.razorpay_orders,      color:T.muted},
                      {label:'Vayu Fee',  value:fmt(store.vayu_fee_amount), color:T.blue},
                    ].map(n => (
                      <div key={n.label} style={{textAlign:'center',minWidth:60}}>
                        <div style={{fontSize:15,fontWeight:800,color:n.color}}>{n.value}</div>
                        <div style={{fontSize:10,color:T.muted2,marginTop:2,fontWeight:600}}>{n.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Status + actions */}
                  <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                    <span style={{background:ss.bg,border:`1px solid ${ss.border}`,color:ss.color,fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:20,letterSpacing:'0.8px'}}>{ss.label}</span>

                    {store.billing_status === 'not_generated' && (
                      <button className="act-btn" onClick={()=>setModal({store,action:'generate'})} style={{padding:'7px 14px',background:T.blueLight,border:`1.5px solid ${T.blueLight2}`,borderRadius:10,color:T.blue,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:T.font}}>
                        Generate Bill
                      </button>
                    )}
                    {store.billing_status === 'unpaid' && (
                      <>
                        <button className="act-btn" onClick={()=>setModal({store,action:'generate'})} style={{padding:'7px 14px',background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:10,color:T.muted,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:T.font}}>
                          Regenerate
                        </button>
                        <button className="act-btn" onClick={()=>{setNotes('');setModal({store,action:'mark_paid'})}} style={{padding:'7px 14px',background:T.greenBg,border:`1.5px solid ${T.greenBdr}`,borderRadius:10,color:T.green,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:T.font}}>
                          Mark Paid
                        </button>
                      </>
                    )}
                    {store.billing_status === 'paid' && store.paid_at && (
                      <div style={{fontSize:11,color:T.muted}}>
                        Collected {new Date(store.paid_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                        {store.notes ? <span style={{color:T.muted2}}> · {store.notes}</span> : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Generate modal */}
      {modal?.action === 'generate' && (
        <Modal title="Generate Bill" sub={modal.store.store_name} onClose={()=>setModal(null)}>
          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
            {[
              ['Month',    data?.month_label],
              ['GMV',      fmt(modal.store.total_gmv)],
              ['Fee (1%)', fmt(modal.store.vayu_fee_amount)],
            ].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',background:T.bg,border:`1px solid ${T.border}`,borderRadius:10}}>
                <span style={{fontSize:12,color:T.muted}}>{l}</span>
                <span style={{fontSize:13,fontWeight:700,color:T.dark}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>setModal(null)} style={{flex:1,padding:'11px',background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:10,color:T.muted,fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:T.font}}>Cancel</button>
            <button onClick={()=>handleGenerate(modal.store)} disabled={acting} style={{flex:1,padding:'11px',background:T.blue,border:'none',borderRadius:10,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:T.font,opacity:acting?0.7:1}}>
              {acting ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </Modal>
      )}

      {/* Mark paid modal */}
      {modal?.action === 'mark_paid' && (
        <Modal title="Mark as Paid" sub={modal.store.store_name} onClose={()=>setModal(null)}>
          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>
            {[
              ['Fee Collected', fmt(modal.store.vayu_fee_amount)],
              ['Month',        data?.month_label],
            ].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',background:T.greenBg,border:`1px solid ${T.greenBdr}`,borderRadius:10}}>
                <span style={{fontSize:12,color:T.muted}}>{l}</span>
                <span style={{fontSize:13,fontWeight:700,color:T.green}}>{v}</span>
              </div>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={e=>setNotes(e.target.value)}
            placeholder='Notes (e.g. "paid cash on visit")'
            rows={2}
            style={{width:'100%',padding:'10px 14px',background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:10,fontSize:13,color:T.dark,fontFamily:T.font,resize:'none',outline:'none',boxSizing:'border-box',marginBottom:16}}
          />
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>setModal(null)} style={{flex:1,padding:'11px',background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:10,color:T.muted,fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:T.font}}>Cancel</button>
            <button onClick={()=>handleMarkPaid(modal.store)} disabled={acting} style={{flex:1,padding:'11px',background:T.green,border:'none',borderRadius:10,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:T.font,opacity:acting?0.7:1}}>
              {acting ? 'Saving…' : 'Confirm Paid'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
