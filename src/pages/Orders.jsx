import { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api'

const fl = document.createElement('link')
fl.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap'
fl.rel = 'stylesheet'
if (!document.head.querySelector('[href*="Jakarta"]')) document.head.appendChild(fl)

const T = {
  blue:'#3B56E8',blue2:'#2C44D4',blueSoft:'#5B7CFA',blueLight:'#EEF2FF',blueLight2:'#E0E7FF',
  bg:'#F0F3FF',white:'#FFFFFF',border:'#E0E7FF',border2:'#C7D2FE',
  dark:'#1A1A2E',muted:'#6B7280',muted2:'#9CA3AF',
  green:'#10B981',greenBg:'#ECFDF5',greenBdr:'#A7F3D0',
  amber:'#F59E0B',amberBg:'#FFFBEB',amberBdr:'#FDE68A',
  red:'#EF4444',redBg:'#FEF2F2',redBdr:'#FECACA',
  purple:'#8B5CF6',purpleBg:'#F5F3FF',purpleBdr:'#DDD6FE',
  shadow:'0 2px 12px rgba(59,86,232,0.07)',shadowBtn:'0 4px 14px rgba(59,86,232,0.35)',
  font:"'Plus Jakarta Sans',sans-serif",
}

const toUTC=d=>new Date(typeof d==='string'&&!d.includes('Z')&&!d.includes('+')&&!d.includes('-',10)?d.replace(' ','T')+'Z':d)
const fmtDate=d=>toUTC(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
const fmtShort=d=>toUTC(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})
const fmtDay=d=>toUTC(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})
const STATUS={paid:{bg:T.greenBg,color:T.green,bdr:T.greenBdr,label:'Paid'},pending:{bg:T.amberBg,color:T.amber,bdr:T.amberBdr,label:'Pending'},failed:{bg:T.redBg,color:T.red,bdr:T.redBdr,label:'Failed'}}

function Badge({status,size='md'}){const s=STATUS[status]||STATUS.pending;return<span style={{background:s.bg,color:s.color,border:`1px solid ${s.bdr}`,fontSize:size==='sm'?9:11,fontWeight:700,padding:size==='sm'?'2px 7px':'3px 10px',borderRadius:20,fontFamily:T.font,whiteSpace:'nowrap'}}>{s.label}</span>}

function OrderModal({order,onClose}){
  const [copied,setCopied]=useState(false)
  const copy=txt=>{navigator.clipboard.writeText(txt);setCopied(true);setTimeout(()=>setCopied(false),2000)}
  const s=STATUS[order.payment_status]||STATUS.pending
  return(
    <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(26,31,78,0.45)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <style>{`@keyframes mi{from{opacity:0;transform:scale(0.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:22,width:'100%',maxWidth:460,boxShadow:'0 24px 60px rgba(59,86,232,0.18)',animation:'mi 0.25s ease both',fontFamily:T.font,overflow:'hidden'}}>
        <div style={{height:4,background:`linear-gradient(90deg,${s.color},${T.blue})`}}/>
        <div style={{padding:'20px 24px 16px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><div style={{fontSize:9,fontWeight:700,letterSpacing:'2.5px',textTransform:'uppercase',color:T.muted2,marginBottom:4}}>Order Details</div><div style={{fontSize:20,fontWeight:800,color:T.dark}}>Order #{order.id}</div><div style={{fontSize:11,color:T.muted2,marginTop:2}}>{fmtDate(order.created_at)}</div></div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}><Badge status={order.payment_status}/><button onClick={onClose} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,width:28,height:28,cursor:'pointer',color:T.muted,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button></div>
        </div>
        <div style={{padding:'20px 24px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
            <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:12,padding:'13px 16px'}}><div style={{fontSize:9,fontWeight:700,color:T.muted2,letterSpacing:'2px',textTransform:'uppercase',marginBottom:6}}>Customer</div><div style={{fontSize:16,fontWeight:700,color:T.dark}}>+91 {order.users?.phone||'—'}</div></div>
            <div style={{background:T.blueLight,border:`1px solid ${T.blueLight2}`,borderRadius:12,padding:'13px 16px'}}><div style={{fontSize:9,fontWeight:700,color:T.muted2,letterSpacing:'2px',textTransform:'uppercase',marginBottom:6}}>Amount Paid</div><div style={{fontSize:22,fontWeight:800,color:T.blue}}>₹{(order.total||0).toLocaleString()}</div></div>
          </div>
          <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:12,overflow:'hidden',marginBottom:16}}>
            {[['Order ID',`#${order.id}`],['Payment Status',<Badge status={order.payment_status} size="sm"/>],['Date & Time',fmtDate(order.created_at)],['Payment ID',order.razorpay_payment_id||'Not available']].map(([lbl,val],i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderBottom:i<3?`1px solid ${T.border}`:'none'}}>
                <span style={{fontSize:11,color:T.muted2,fontWeight:600,flexShrink:0}}>{lbl}</span>
                <span style={{fontSize:12,fontWeight:600,color:T.dark,fontFamily:lbl==='Payment ID'||lbl==='Order ID'?'monospace':T.font,textAlign:'right',marginLeft:12}}>{typeof val==='string'?val:val}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:10}}>
            {order.razorpay_payment_id&&<button onClick={()=>copy(order.razorpay_payment_id)} style={{flex:1,padding:'10px',background:copied?T.greenBg:T.blueLight,border:`1.5px solid ${copied?T.greenBdr:T.blueLight2}`,borderRadius:10,color:copied?T.green:T.blue,fontSize:13,fontWeight:700,fontFamily:T.font,cursor:'pointer',transition:'all 0.2s'}}>{copied?'✅ Copied!':'📋 Copy Payment ID'}</button>}
            <button onClick={onClose} style={{flex:1,padding:'10px',background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:10,color:T.muted,fontSize:13,fontWeight:600,fontFamily:T.font,cursor:'pointer'}}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PER_PAGE=15

export default function Orders(){
  const [orders,setOrders]=useState([])
  const [loading,setLoading]=useState(true)
  const [statusFilter,setStatus]=useState('all')
  const [search,setSearch]=useState('')
  const [selectedOrder,setSelected]=useState(null)
  const [page,setPage]=useState(1)
  const [sortDir,setSortDir]=useState('desc')
  const [dateFrom,setDateFrom]=useState('')
  const [dateTo,setDateTo]=useState('')
  const [dateRange,setDateRange]=useState('all')

  useEffect(()=>{
    const load=async()=>{setLoading(true);try{const r=await api.get('/api/admin/orders?limit=500');setOrders(r.data.orders||[]);setPage(1)}catch(e){console.error(e)}finally{setLoading(false)}}
    load()
  },[])

  const paid=useMemo(()=>orders.filter(o=>o.payment_status==='paid'),[orders])
  const revenue=useMemo(()=>paid.reduce((s,o)=>s+(o.total||0),0),[paid])
  const avgOrder=paid.length?Math.round(revenue/paid.length):0

  const sparkData=useMemo(()=>{
    const days={}
    for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days[fmtDay(d)]=0}
    paid.forEach(o=>{const key=fmtDay(o.created_at);if(key in days)days[key]+=(o.total||0)})
    return Object.entries(days).map(([day,rev])=>({day,rev}))
  },[paid])

  const inRange=(o,range)=>{
    const d=new Date(o.created_at),now=new Date()
    if(range==='custom'){if(dateFrom){const f=new Date(dateFrom);f.setHours(0,0,0,0);if(d<f)return false}if(dateTo){const t=new Date(dateTo);t.setHours(23,59,59,999);if(d>t)return false}return true}
    if(range==='all')return true
    if(range==='today')return d.toDateString()===now.toDateString()
    if(range==='week'){const w=new Date(now);w.setDate(now.getDate()-7);return d>=w}
    if(range==='month'){const m=new Date(now);m.setDate(1);m.setHours(0,0,0,0);return d>=m}
    return true
  }

  const filtered=useMemo(()=>{
    let list=orders.filter(o=>statusFilter==='all'||o.payment_status===statusFilter).filter(o=>inRange(o,dateRange)).filter(o=>!search||o.users?.phone?.includes(search)||String(o.id).includes(search))
    return [...list].sort((a,b)=>{const da=new Date(a.created_at),db=new Date(b.created_at);return sortDir==='desc'?db-da:da-db})
  },[orders,statusFilter,dateRange,dateFrom,dateTo,search,sortDir])

  const paginated=filtered.slice((page-1)*PER_PAGE,page*PER_PAGE)
  const totalPages=Math.ceil(filtered.length/PER_PAGE)

  const ChartTT=({active,payload,label})=>{
    if(!active||!payload?.length)return null
    return<div style={{background:T.white,border:`1px solid ${T.border2}`,borderRadius:8,padding:'6px 12px',fontFamily:T.font,boxShadow:T.shadow}}><div style={{fontSize:9,color:T.muted2,textTransform:'uppercase',letterSpacing:'1px'}}>{label}</div><div style={{fontSize:14,fontWeight:700,color:T.blue}}>₹{(payload[0]?.value||0).toLocaleString()}</div></div>
  }

  return(
    <div style={{fontFamily:T.font,color:T.dark}}>
      <style>{`@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.orow:hover{background:${T.bg}!important;cursor:pointer}.orow{transition:background 0.15s}.inp:focus{border-color:${T.blue}!important;box-shadow:0 0 0 3px ${T.blueLight}!important}`}</style>
      <div style={{marginBottom:16,paddingBottom:16,borderBottom:`1.5px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:10,animation:'fu 0.4s ease both'}}>
        <div><div style={{fontSize:9,fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:T.muted2,marginBottom:4}}>Transactions</div><h1 style={{fontSize:26,fontWeight:800,color:T.dark,letterSpacing:'-0.5px',margin:0}}>Orders</h1><p style={{fontSize:12,color:T.muted,margin:'2px 0 0'}}>{orders.length} total · Click any row for details</p></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 220px',gap:10,marginBottom:16,animation:'fu 0.4s ease 0.05s both'}}>
        {[{label:'Total Orders',value:orders.length,color:T.blue,bg:T.blueLight,icon:'◫'},{label:'Paid',value:paid.length,color:T.green,bg:T.greenBg,icon:'✅'},{label:'Pending',value:orders.filter(o=>o.payment_status==='pending').length,color:T.amber,bg:T.amberBg,icon:'⏳'},{label:'Failed',value:orders.filter(o=>o.payment_status==='failed').length,color:T.red,bg:T.redBg,icon:'✕'},{label:'Avg Order',value:`₹${avgOrder.toLocaleString()}`,color:T.purple,bg:T.purpleBg,icon:'📊'}].map((s,i)=>(
          <div key={i} style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:12,padding:'11px 13px',boxShadow:T.shadow,display:'flex',alignItems:'center',gap:9}}>
            <div style={{width:32,height:32,borderRadius:8,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{s.icon}</div>
            <div><div style={{fontSize:17,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div><div style={{fontSize:9,color:T.muted2,marginTop:2}}>{s.label}</div></div>
          </div>
        ))}
        <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:12,padding:'11px 13px',boxShadow:T.shadow}}>
          <div style={{fontSize:9,fontWeight:700,color:T.muted2,letterSpacing:'2px',textTransform:'uppercase',marginBottom:4}}>7-Day Revenue</div>
          <div style={{fontSize:15,fontWeight:800,color:T.blue,marginBottom:4}}>₹{revenue.toLocaleString()}</div>
          <ResponsiveContainer width="100%" height={36}><AreaChart data={sparkData}><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.blue} stopOpacity={0.2}/><stop offset="100%" stopColor={T.blue} stopOpacity={0}/></linearGradient></defs><Tooltip content={<ChartTT/>}/><Area type="monotone" dataKey="rev" stroke={T.blue} strokeWidth={1.5} fill="url(#sg)" dot={false}/></AreaChart></ResponsiveContainer>
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center',animation:'fu 0.4s ease 0.1s both'}}>
        <div style={{position:'relative',flex:1,minWidth:200}}><span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',fontSize:12,color:T.muted2}}>🔍</span><input className="inp" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search phone or order ID..." style={{width:'100%',padding:'8px 12px 8px 32px',background:T.white,border:`1.5px solid ${T.border}`,borderRadius:9,fontSize:12,fontFamily:T.font,color:T.dark,outline:'none',transition:'all 0.2s'}}/></div>
        <div style={{display:'flex',gap:3,background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,padding:3}}>
          {['all','paid','pending','failed'].map(f=><button key={f} onClick={()=>{setStatus(f);setPage(1)}} style={{padding:'6px 11px',borderRadius:7,border:'none',background:statusFilter===f?T.blue:'transparent',color:statusFilter===f?'#fff':T.muted,fontSize:11,fontWeight:600,textTransform:'capitalize',fontFamily:T.font,cursor:'pointer',transition:'all 0.15s'}}>{f}</button>)}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,background:T.white,border:`1.5px solid ${T.border}`,borderRadius:9,padding:'4px 10px'}}>
          <span style={{fontSize:11,color:T.muted2,fontWeight:600,whiteSpace:'nowrap'}}>📅 From</span>
          <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setDateRange('custom');setPage(1)}} style={{border:'none',background:'transparent',fontSize:11,fontFamily:T.font,color:T.dark,outline:'none',cursor:'pointer'}}/>
          <span style={{fontSize:11,color:T.muted2,fontWeight:600}}>To</span>
          <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setDateRange('custom');setPage(1)}} style={{border:'none',background:'transparent',fontSize:11,fontFamily:T.font,color:T.dark,outline:'none',cursor:'pointer'}}/>
          {dateRange==='custom'&&<button onClick={()=>{setDateFrom('');setDateTo('');setDateRange('all');setPage(1)}} style={{background:T.redBg,border:`1px solid ${T.redBdr}`,borderRadius:6,padding:'2px 7px',fontSize:10,fontWeight:700,color:T.red,cursor:'pointer',fontFamily:T.font}}>✕ Clear</button>}
        </div>
        <div style={{display:'flex',gap:3,background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,padding:3}}>
          {[['all','All'],['today','Today'],['week','7D'],['month','Month']].map(([val,lbl])=><button key={val} onClick={()=>{setDateRange(val);setDateFrom('');setDateTo('');setPage(1)}} style={{padding:'6px 10px',borderRadius:7,border:'none',background:dateRange===val?T.blue2:'transparent',color:dateRange===val?'#fff':T.muted,fontSize:11,fontWeight:600,fontFamily:T.font,cursor:'pointer',transition:'all 0.15s'}}>{lbl}</button>)}
        </div>
        <button onClick={()=>setSortDir(d=>d==='desc'?'asc':'desc')} style={{padding:'7px 12px',background:T.white,border:`1.5px solid ${T.border}`,borderRadius:9,fontSize:11,fontWeight:600,color:T.muted,fontFamily:T.font,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>{sortDir==='desc'?'↓':'↑'} Date</button>
        <span style={{fontSize:11,color:T.muted2,flexShrink:0}}>{filtered.length} results</span>
      </div>

      {loading?<div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}><div style={{width:22,height:22,border:`2px solid ${T.blueLight2}`,borderTopColor:T.blue,borderRadius:'50%',animation:'spin .8s linear infinite'}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>
      :filtered.length===0?<div style={{textAlign:'center',padding:'60px 0',animation:'fu 0.4s ease both'}}><div style={{fontSize:40,marginBottom:10}}>📭</div><div style={{fontSize:15,fontWeight:700,color:T.dark,marginBottom:4}}>No orders found</div><div style={{fontSize:12,color:T.muted2}}>Try changing the filters above</div></div>
      :(
        <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:16,overflow:'hidden',boxShadow:T.shadow,animation:'fu 0.4s ease 0.15s both'}}>
          <div style={{display:'grid',gridTemplateColumns:'55px 1fr 110px 100px 155px 1fr',padding:'10px 18px',background:T.bg,borderBottom:`1px solid ${T.border}`,fontSize:9,fontWeight:700,color:T.muted2,letterSpacing:'2px',textTransform:'uppercase'}}><span>#ID</span><span>Customer</span><span>Amount</span><span>Status</span><span>Date</span><span>Payment ID</span></div>
          {paginated.map((o,i)=>(
            <div key={o.id} className="orow" onClick={()=>setSelected(o)} style={{display:'grid',gridTemplateColumns:'55px 1fr 110px 100px 155px 1fr',padding:'12px 18px',alignItems:'center',borderBottom:i<paginated.length-1?`1px solid ${T.border}`:'none'}}>
              <span style={{fontSize:11,fontWeight:700,color:T.muted2}}>#{o.id}</span>
              <div><div style={{fontSize:13,fontWeight:600,color:T.dark}}>+91 {o.users?.phone||'—'}</div></div>
              <span style={{fontSize:14,fontWeight:800,color:T.dark}}>₹{(o.total||0).toLocaleString()}</span>
              <Badge status={o.payment_status} size="sm"/>
              <span style={{fontSize:11,color:T.muted2}}>{fmtShort(o.created_at)}</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:10,color:T.muted2,fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{o.razorpay_payment_id?`…${o.razorpay_payment_id.slice(-12)}`:'—'}</span><span style={{fontSize:10,color:T.blue,fontWeight:600,flexShrink:0}}>View →</span></div>
            </div>
          ))}
          {totalPages>1&&<div style={{padding:'11px 18px',borderTop:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:T.bg}}>
            <span style={{fontSize:11,color:T.muted2}}>{(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,filtered.length)} of {filtered.length}</span>
            <div style={{display:'flex',gap:5,alignItems:'center'}}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{padding:'5px 12px',background:page===1?T.bg:T.white,border:`1px solid ${T.border}`,borderRadius:7,fontSize:11,fontWeight:600,color:page===1?T.muted2:T.dark,cursor:page===1?'not-allowed':'pointer',fontFamily:T.font}}>← Prev</button>
              {Array.from({length:Math.min(5,totalPages)},(_,i)=>{const p=Math.max(1,Math.min(page-2,totalPages-4))+i;if(p>totalPages)return null;return<button key={p} onClick={()=>setPage(p)} style={{width:28,height:28,borderRadius:7,border:`1px solid ${p===page?T.blue:T.border}`,background:p===page?T.blue:T.white,color:p===page?'#fff':T.dark,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:T.font,display:'flex',alignItems:'center',justifyContent:'center'}}>{p}</button>})}
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{padding:'5px 12px',background:page===totalPages?T.bg:T.white,border:`1px solid ${T.border}`,borderRadius:7,fontSize:11,fontWeight:600,color:page===totalPages?T.muted2:T.dark,cursor:page===totalPages?'not-allowed':'pointer',fontFamily:T.font}}>Next →</button>
            </div>
          </div>}
        </div>
      )}
      {selectedOrder&&<OrderModal order={selectedOrder} onClose={()=>setSelected(null)}/>}
    </div>
  )
}