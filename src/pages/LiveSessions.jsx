import { useState, useEffect, useRef } from 'react'
import api from '../api'

const T = {
  blue:'#3B56E8',blue2:'#2C44D4',blueSoft:'#5B7CFA',blueLight:'#EEF2FF',blueLight2:'#E0E7FF',
  bg:'#F0F3FF',white:'#FFFFFF',border:'#E0E7FF',border2:'#C7D2FE',
  dark:'#1A1A2E',dark2:'#2D3561',muted:'#6B7280',muted2:'#9CA3AF',
  green:'#10B981',greenBg:'#ECFDF5',greenBdr:'#A7F3D0',
  amber:'#F59E0B',amberBg:'#FFFBEB',amberBdr:'#FDE68A',
  red:'#EF4444',redBg:'#FEF2F2',redBdr:'#FECACA',
  purple:'#8B5CF6',purpleBg:'#F5F3FF',purpleBdr:'#DDD6FE',
  shadow:'0 2px 12px rgba(59,86,232,0.07)',
  font:"'Plus Jakarta Sans',sans-serif",
}

function getSuspicion(s) {
  const min=s.minutes_ago,cart=s.cart_total||0,items=s.item_count||0
  if(min>=30&&cart===0) return{level:'high',color:T.red,bg:T.redBg,border:T.redBdr,icon:'🔴',label:'HIGH RISK',reason:`${min}min in store — cart empty`}
  if(min>=25&&items===0) return{level:'high',color:T.red,bg:T.redBg,border:T.redBdr,icon:'🔴',label:'HIGH RISK',reason:`${min}min — nothing scanned`}
  if(min>=20&&cart<50) return{level:'medium',color:T.amber,bg:T.amberBg,border:T.amberBdr,icon:'🟡',label:'WATCH',reason:`${min}min — cart only ₹${cart}`}
  if(min>=15&&items===0) return{level:'medium',color:T.amber,bg:T.amberBg,border:T.amberBdr,icon:'🟡',label:'WATCH',reason:`${min}min — nothing scanned yet`}
  if(min>=40) return{level:'low',color:T.blue,bg:T.blueLight,border:T.blueLight2,icon:'🔵',label:'LONG SESSION',reason:`${min}min — extended visit`}
  return null
}

function RefreshTimer({interval=15}){
  const [secs,setSecs]=useState(interval)
  useEffect(()=>{setSecs(interval);const t=setInterval(()=>setSecs(s=>s<=1?interval:s-1),1000);return()=>clearInterval(t)},[interval])
  const pct=((interval-secs)/interval)*100
  return(<div style={{display:'flex',alignItems:'center',gap:6}}>
    <div style={{width:28,height:28,position:'relative',flexShrink:0}}>
      <svg width="28" height="28" style={{transform:'rotate(-90deg)'}}><circle cx="14" cy="14" r="11" fill="none" stroke={T.blueLight2} strokeWidth="2.5"/><circle cx="14" cy="14" r="11" fill="none" stroke={T.blue} strokeWidth="2.5" strokeDasharray={`${2*Math.PI*11}`} strokeDashoffset={`${2*Math.PI*11*(1-pct/100)}`} strokeLinecap="round" style={{transition:'stroke-dashoffset 1s linear'}}/></svg>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,color:T.blue}}>{secs}</div>
    </div>
    <span style={{fontSize:10,color:T.muted2,fontWeight:500}}>sec to refresh</span>
  </div>)
}

function SessionModal({session,onClose}){
  const susp=getSuspicion(session)
  return(<div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(26,31,78,0.45)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <style>{`@keyframes mi{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}`}</style>
    <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:22,width:'100%',maxWidth:440,boxShadow:'0 24px 60px rgba(59,86,232,0.18)',animation:'mi 0.25s ease both',overflow:'hidden',fontFamily:T.font}}>
      <div style={{height:4,background:susp?`linear-gradient(90deg,${susp.color},${T.blue})`:`linear-gradient(90deg,${T.blue},${T.blueSoft})`}}/>
      <div style={{padding:'20px 24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,borderRadius:'50%',background:`linear-gradient(135deg,${T.blue},${T.blueSoft})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#fff'}}>{String(session.phone||'').slice(-2)||'??'}</div>
            <div><div style={{fontSize:17,fontWeight:800,color:T.dark}}>+91 {session.phone}</div><div style={{fontSize:11,color:T.muted2}}>Active · {session.minutes_ago}m in store</div></div>
          </div>
          <button onClick={onClose} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,width:28,height:28,cursor:'pointer',color:T.muted,fontSize:13}}>✕</button>
        </div>
        {susp&&<div style={{padding:'10px 14px',background:susp.bg,border:`1px solid ${susp.border}`,borderRadius:10,marginBottom:16,display:'flex',gap:8,alignItems:'center'}}><span style={{fontSize:16}}>{susp.icon}</span><div><div style={{fontSize:12,fontWeight:700,color:susp.color}}>{susp.label}</div><div style={{fontSize:11,color:susp.color,opacity:0.85}}>{susp.reason}</div></div></div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
          {[['Items',session.item_count,T.blue,T.blueLight],['Cart',`₹${(session.cart_total||0).toLocaleString()}`,T.green,T.greenBg],['Time',`${session.minutes_ago}m`,T.amber,T.amberBg]].map((s,i)=>(
            <div key={i} style={{background:s[3],border:`1px solid ${T.border}`,borderRadius:10,padding:'10px 12px',textAlign:'center'}}><div style={{fontSize:20,fontWeight:800,color:s[2]}}>{s[1]}</div><div style={{fontSize:10,color:T.muted2,marginTop:2}}>{s[0]}</div></div>
          ))}
        </div>
        {session.cart?.length>0&&<div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:12,overflow:'hidden',marginBottom:16}}>
          <div style={{padding:'8px 14px',background:T.blueLight,borderBottom:`1px solid ${T.border}`,fontSize:9,fontWeight:700,color:T.muted2,letterSpacing:'2px',textTransform:'uppercase'}}>Cart Items ({session.cart.length})</div>
          {session.cart.map((item,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 14px',borderBottom:i<session.cart.length-1?`1px solid ${T.border}`:'none'}}>
              <span style={{fontSize:13,color:T.dark,fontWeight:500}}>{item.name}</span>
              <div style={{display:'flex',gap:12,alignItems:'center'}}><span style={{fontSize:11,color:T.muted2}}>×{item.quantity}</span><span style={{fontSize:13,fontWeight:700,color:T.blue}}>₹{item.price}</span></div>
            </div>
          ))}
          <div style={{padding:'8px 14px',borderTop:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',background:T.bg}}><span style={{fontSize:12,fontWeight:600,color:T.muted}}>Total</span><span style={{fontSize:14,fontWeight:800,color:T.green}}>₹{(session.cart_total||0).toLocaleString()}</span></div>
        </div>}
        <button onClick={onClose} style={{width:'100%',padding:'10px',background:`linear-gradient(135deg,${T.blue},${T.blue2})`,border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,fontFamily:T.font,cursor:'pointer'}}>Close</button>
      </div>
    </div>
  </div>)
}

export default function LiveSessions(){
  const [sessions,setSessions]=useState([])
  const [loading,setLoading]=useState(true)
  const [lastUpdate,setLastUpdate]=useState(null)
  const [dismissed,setDismissed]=useState(new Set())
  const [checkedIds,setCheckedIds]=useState(new Set())
  const [selectedSession,setSelected]=useState(null)
  const [sortBy,setSortBy]=useState('time')
  const [filterBy,setFilterBy]=useState('all')
  const [refreshing,setRefreshing]=useState(false)
  const [peakCount,setPeakCount]=useState(0)

  const load=async(manual=false)=>{
    if(manual)setRefreshing(true)
    try{const r=await api.get('/api/admin/sessions/live');const s=r.data.sessions||[];setSessions(s);setLastUpdate(new Date());setPeakCount(prev=>Math.max(prev,s.length))}
    catch(e){console.error(e)}finally{setLoading(false);if(manual)setRefreshing(false)}
  }
  useEffect(()=>{load();const t=setInterval(()=>load(),15000);return()=>clearInterval(t)},[])

  const withSusp=sessions.map(s=>({...s,suspicion:getSuspicion(s)}))
  const suspicious=withSusp.filter(s=>s.suspicion&&!dismissed.has(s.session_id)).sort((a,b)=>({high:0,medium:1,low:2}[a.suspicion.level]-{high:0,medium:1,low:2}[b.suspicion.level]))
  const highCount=suspicious.filter(s=>s.suspicion.level==='high').length
  const medCount=suspicious.filter(s=>s.suspicion.level==='medium').length
  const totalCart=sessions.reduce((s,o)=>s+(o.cart_total||0),0)

  const displayed=withSusp.filter(s=>{if(filterBy==='suspicious')return s.suspicion!==null;if(filterBy==='normal')return s.suspicion===null;return true}).sort((a,b)=>{if(sortBy==='cart')return(b.cart_total||0)-(a.cart_total||0);if(sortBy==='items')return(b.item_count||0)-(a.item_count||0);if(sortBy==='risk')return(a.suspicion?0:1)-(b.suspicion?0:1);return(b.minutes_ago||0)-(a.minutes_ago||0)})

  return(<div style={{fontFamily:T.font,color:T.dark}}>
    <style>{`@keyframes breathe{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}.sc:hover{box-shadow:0 6px 24px rgba(59,86,232,0.12)!important;transform:translateY(-2px);cursor:pointer}.sc{transition:all 0.2s}`}</style>

    <div style={{marginBottom:16,paddingBottom:16,borderBottom:`1.5px solid ${T.border}`,animation:'fu 0.4s ease both'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:10}}>
        <div><div style={{fontSize:9,fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:T.muted2,marginBottom:4}}>Monitoring</div><h1 style={{fontSize:26,fontWeight:800,color:T.dark,letterSpacing:'-0.5px',margin:0}}>Live Sessions</h1><p style={{fontSize:12,color:T.muted,margin:'2px 0 0'}}>Shoppers active in your store right now</p></div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <RefreshTimer interval={15}/>
          <button onClick={()=>load(true)} disabled={refreshing} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',background:T.blueLight,border:`1.5px solid ${T.blueLight2}`,borderRadius:9,color:T.blue,fontSize:12,fontWeight:700,fontFamily:T.font,cursor:'pointer'}}><span style={{display:'inline-block',animation:refreshing?'spin 0.6s linear infinite':'none',fontSize:13}}>↻</span>{refreshing?'Refreshing…':'Refresh Now'}</button>
          {suspicious.length>0&&<div style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',background:T.redBg,border:`1px solid ${T.redBdr}`,borderRadius:20}}><span style={{fontSize:11}}>⚠</span><span style={{fontSize:11,fontWeight:700,color:T.red}}>{suspicious.length} Suspicious</span></div>}
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',background:T.blueLight,border:`1px solid ${T.blueLight2}`,borderRadius:20}}><div style={{width:6,height:6,borderRadius:'50%',background:T.blue,animation:'breathe 1.8s ease infinite'}}/><span style={{fontSize:11,fontWeight:700,color:T.blue2}}>{sessions.length} LIVE</span></div>
        </div>
      </div>
    </div>

    {!loading&&<div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16,animation:'fu 0.4s ease 0.05s both'}}>
      {[{label:'Active Now',value:sessions.length,color:T.blue,bg:T.blueLight,icon:'👥'},{label:'Suspicious',value:suspicious.length,color:T.red,bg:T.redBg,icon:'⚠️'},{label:'Checked',value:checkedIds.size,color:T.green,bg:T.greenBg,icon:'✅'},{label:'Total Cart',value:`₹${totalCart.toLocaleString()}`,color:T.purple,bg:T.purpleBg,icon:'🛒'},{label:'Peak Today',value:peakCount,color:T.amber,bg:T.amberBg,icon:'📈'}].map((s,i)=>(
        <div key={i} style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:12,padding:'11px 13px',boxShadow:T.shadow,display:'flex',alignItems:'center',gap:9}}>
          <div style={{width:32,height:32,borderRadius:8,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{s.icon}</div>
          <div><div style={{fontSize:16,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div><div style={{fontSize:9,color:T.muted2,marginTop:2}}>{s.label}</div></div>
        </div>
      ))}
    </div>}

    {loading?<div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}><div style={{width:22,height:22,border:`2px solid ${T.blueLight2}`,borderTopColor:T.blue,borderRadius:'50%',animation:'spin .8s linear infinite'}}/></div>
    :sessions.length===0?<div style={{textAlign:'center',padding:'70px 0',animation:'fu 0.4s ease both'}}><div style={{width:68,height:68,borderRadius:'50%',background:T.blueLight,border:`1.5px solid ${T.blueLight2}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 14px'}}>🏪</div><div style={{fontSize:18,fontWeight:800,color:T.dark,marginBottom:6}}>No Active Shoppers</div><div style={{fontSize:12,color:T.muted}}>Share your store QR code to get customers shopping</div></div>
    :<>
      {suspicious.length>0&&<div style={{background:T.white,border:`1.5px solid ${T.redBdr}`,borderRadius:16,overflow:'hidden',marginBottom:16,animation:'fu 0.4s ease 0.1s both'}}>
        <div style={{padding:'12px 18px',background:T.redBg,borderBottom:`1px solid ${T.redBdr}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}><span style={{fontSize:16}}>⚠️</span><div><div style={{fontSize:13,fontWeight:700,color:T.red}}>Suspicious Sessions</div><div style={{fontSize:10,color:'#B91C1C',marginTop:1}}>{highCount>0&&`${highCount} high risk`}{highCount>0&&medCount>0&&' · '}{medCount>0&&`${medCount} watching`}</div></div></div>
          <button onClick={()=>setDismissed(p=>new Set([...p,...suspicious.map(s=>s.session_id)]))} style={{background:'none',border:`1px solid ${T.redBdr}`,borderRadius:7,color:T.red,fontSize:11,fontWeight:600,padding:'4px 10px',cursor:'pointer',fontFamily:T.font}}>Dismiss All</button>
        </div>
        {suspicious.map((s,i)=>(
          <div key={s.session_id} onClick={()=>setSelected(s)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 18px',borderBottom:i<suspicious.length-1?`1px solid #FFF1F1`:'none',cursor:'pointer',transition:'background 0.2s'}} onMouseEnter={e=>e.currentTarget.style.background=T.redBg} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{display:'flex',alignItems:'center',gap:12}}><span style={{fontSize:18}}>{s.suspicion.icon}</span><div><div style={{fontSize:13,fontWeight:700,color:T.dark}}>+91 {s.phone}</div><div style={{fontSize:11,color:s.suspicion.color,fontWeight:600}}>{s.suspicion.reason}</div></div></div>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              {[['items',s.item_count],['cart',`₹${s.cart_total||0}`],['time',`${s.minutes_ago}m`]].map(([l,v])=><div key={l} style={{textAlign:'center'}}><div style={{fontSize:14,fontWeight:800,color:T.dark}}>{v}</div><div style={{fontSize:9,color:T.muted2}}>{l}</div></div>)}
              <div style={{display:'flex',gap:7}}>
                {!checkedIds.has(s.session_id)?<button onClick={e=>{e.stopPropagation();setCheckedIds(p=>new Set([...p,s.session_id]))}} style={{padding:'5px 10px',background:T.greenBg,border:`1px solid ${T.greenBdr}`,borderRadius:7,color:T.green,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>✓ Checked</button>:<span style={{padding:'5px 10px',background:T.greenBg,border:`1px solid ${T.greenBdr}`,borderRadius:7,color:T.green,fontSize:11,fontWeight:600}}>✅ Done</span>}
                <button onClick={e=>{e.stopPropagation();setDismissed(p=>new Set([...p,s.session_id]))}} style={{padding:'5px 9px',background:T.bg,border:`1px solid ${T.border}`,borderRadius:7,color:T.muted2,fontSize:11,cursor:'pointer'}}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>}

      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center',animation:'fu 0.4s ease 0.15s both'}}>
        <div style={{display:'flex',gap:3,background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,padding:3}}>
          {[['all','All'],['suspicious','⚠ Suspicious'],['normal','✓ Normal']].map(([val,lbl])=><button key={val} onClick={()=>setFilterBy(val)} style={{padding:'5px 11px',borderRadius:7,border:'none',background:filterBy===val?T.blue:'transparent',color:filterBy===val?'#fff':T.muted,fontSize:11,fontWeight:600,fontFamily:T.font,cursor:'pointer',transition:'all 0.15s',whiteSpace:'nowrap'}}>{lbl}</button>)}
        </div>
        <div style={{display:'flex',gap:3,background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,padding:3}}>
          <span style={{fontSize:10,color:T.muted2,fontWeight:600,padding:'5px 8px',whiteSpace:'nowrap'}}>Sort:</span>
          {[['time','⏱ Time'],['cart','💰 Cart'],['items','📦 Items'],['risk','⚠ Risk']].map(([val,lbl])=><button key={val} onClick={()=>setSortBy(val)} style={{padding:'5px 10px',borderRadius:7,border:'none',background:sortBy===val?T.blue2:'transparent',color:sortBy===val?'#fff':T.muted,fontSize:11,fontWeight:600,fontFamily:T.font,cursor:'pointer',transition:'all 0.15s',whiteSpace:'nowrap'}}>{lbl}</button>)}
        </div>
        <span style={{fontSize:11,color:T.muted2}}>{displayed.length} sessions</span>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,padding:'5px 12px',background:T.purpleBg,border:`1px solid ${T.purpleBdr}`,borderRadius:20}}><span style={{fontSize:11}}>🛒</span><span style={{fontSize:11,fontWeight:700,color:T.purple}}>₹{totalCart.toLocaleString()} in carts</span></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:12,animation:'fu 0.4s ease 0.2s both'}}>
        {displayed.map(s=>{
          const susp=s.suspicion; const isChecked=checkedIds.has(s.session_id); const cartPct=totalCart>0?Math.round((s.cart_total||0)/totalCart*100):0
          return(<div key={s.session_id} className="sc" onClick={()=>setSelected(s)} style={{background:T.white,border:`1.5px solid ${susp?susp.border:T.border}`,borderRadius:16,padding:16,position:'relative',overflow:'hidden',boxShadow:T.shadow}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:isChecked?T.green:susp?susp.color:`linear-gradient(90deg,${T.blue},${T.blueSoft})`}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${T.blue},${T.blueSoft})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>{String(s.phone||'').slice(-2)||'??'}</div>
                <div><div style={{fontSize:13,fontWeight:700,color:T.dark}}>+91 {s.phone||'—'}</div><div style={{fontSize:10,color:T.muted2}}>{s.minutes_ago}m in store</div></div>
              </div>
              {isChecked?<span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,background:T.greenBg,color:T.green,border:`1px solid ${T.greenBdr}`}}>✅ Checked</span>:susp?<span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,background:susp.bg,color:susp.color,border:`1px solid ${susp.border}`,whiteSpace:'nowrap'}}>{susp.icon} {susp.label}</span>:<span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,background:T.blueLight,color:T.blue,border:`1px solid ${T.blueLight2}`}}>● LIVE</span>}
            </div>
            {susp&&!isChecked&&<div style={{marginBottom:10,padding:'6px 10px',background:susp.bg,border:`1px solid ${susp.border}`,borderRadius:7,fontSize:10,color:susp.color,fontWeight:600}}>⚠ {susp.reason}</div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
              <div style={{background:T.blueLight,border:`1px solid ${T.blueLight2}`,borderRadius:9,padding:'8px 10px'}}><div style={{fontSize:18,fontWeight:800,color:T.blue}}>{s.item_count}</div><div style={{fontSize:9,color:T.muted2,marginTop:1}}>Items</div></div>
              <div style={{background:T.greenBg,border:`1px solid ${T.greenBdr}`,borderRadius:9,padding:'8px 10px'}}><div style={{fontSize:18,fontWeight:800,color:T.green}}>₹{(s.cart_total||0).toLocaleString()}</div><div style={{fontSize:9,color:T.muted2,marginTop:1}}>Cart value</div></div>
            </div>
            {totalCart>0&&<div style={{marginBottom:10}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span style={{fontSize:9,color:T.muted2}}>Share of total</span><span style={{fontSize:9,fontWeight:700,color:T.purple}}>{cartPct}%</span></div><div style={{height:4,background:T.bg,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${cartPct}%`,background:T.purple,borderRadius:3,transition:'width 0.8s ease'}}/></div></div>}
            {s.cart?.length>0&&<div style={{marginBottom:susp&&!isChecked?10:0}}><div style={{fontSize:9,color:T.muted2,letterSpacing:'1.5px',textTransform:'uppercase',fontWeight:700,marginBottom:6}}>Cart</div>{s.cart.slice(0,2).map((item,j)=><div key={j} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:j===0&&s.cart.length>1?`1px solid ${T.border}`:'none'}}><span style={{fontSize:11,color:T.dark,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:140}}>{item.name}</span><span style={{fontSize:10,color:T.muted2,flexShrink:0}}>×{item.quantity}·₹{item.price}</span></div>)}{s.cart.length>2&&<div style={{fontSize:10,color:T.blue,marginTop:4,fontWeight:600}}>+{s.cart.length-2} more</div>}</div>}
            {susp&&!isChecked&&<button onClick={e=>{e.stopPropagation();setCheckedIds(p=>new Set([...p,s.session_id]))}} style={{width:'100%',padding:'7px',background:T.greenBg,border:`1px solid ${T.greenBdr}`,borderRadius:9,color:T.green,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:T.font,transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.background=T.green;e.currentTarget.style.color='#fff'}} onMouseLeave={e=>{e.currentTarget.style.background=T.greenBg;e.currentTarget.style.color=T.green}}>✓ Mark as Checked</button>}
          </div>)
        })}
      </div>
    </>}
    {lastUpdate&&<div style={{marginTop:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:10,color:T.muted2}}>Peak today: {peakCount}</span><span style={{fontSize:10,color:T.muted2}}>Last updated {lastUpdate.toLocaleTimeString()}</span></div>}
    {selectedSession&&<SessionModal session={selectedSession} onClose={()=>setSelected(null)}/>}
  </div>)
}