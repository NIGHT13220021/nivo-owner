import { useState, useEffect } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

const T={blue:'#3B56E8',blue2:'#2C44D4',blueSoft:'#5B7CFA',blueLight:'#EEF2FF',blueLight2:'#E0E7FF',bg:'#F0F3FF',white:'#FFFFFF',border:'#E0E7FF',dark:'#1A1A2E',muted:'#6B7280',muted2:'#9CA3AF',green:'#10B981',greenBg:'#ECFDF5',greenBdr:'#A7F3D0',amber:'#F59E0B',amberBg:'#FFFBEB',amberBdr:'#FDE68A',red:'#EF4444',redBg:'#FEF2F2',redBdr:'#FECACA',shadow:'0 2px 12px rgba(59,86,232,0.07)',shadowBtn:'0 4px 14px rgba(59,86,232,0.35)',font:"'Plus Jakarta Sans',sans-serif"}

function PrintModal({qr,storeName,onClose}){
  const handlePrint=()=>{
    const win=window.open('','_blank','width=600,height=800')
    win.document.write(`<!DOCTYPE html><html><head><title>${storeName} QR</title><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Plus Jakarta Sans',sans-serif;background:white;display:flex;justify-content:center;padding:40px 20px}.page{text-align:center;max-width:400px;width:100%}.store-name{font-size:28px;font-weight:800;color:#1A1A2E;margin-bottom:24px}.qr-box{display:inline-block;padding:16px;border:2px solid #E0E7FF;border-radius:16px;margin-bottom:24px}.qr-box img{width:240px;height:240px;display:block}.steps{background:#EEF2FF;border:1px solid #E0E7FF;border-radius:12px;padding:16px;margin-bottom:20px;text-align:left}.step{display:flex;gap:10px;margin-bottom:8px}.step-num{width:20px;height:20px;border-radius:50%;background:#3B56E8;color:white;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}.step-text{font-size:12px;color:#2D3561;line-height:1.5}</style></head><body><div class="page"><div class="store-name">${storeName}</div><div class="qr-box"><img src="${qr}" alt="QR"/></div><div class="steps">${['Open the Nivo app on your phone','Tap "Scan Store QR" and scan this','Scan each product barcode while shopping','Pay through the app — no queue!','Show exit QR to staff at door'].map((t,i)=>`<div class="step"><div class="step-num">${i+1}</div><div class="step-text">${t}</div></div>`).join('')}</div><div style="font-size:11px;color:#9CA3AF">nivo.in</div></div></body></html>`)
    win.document.close(); win.focus(); setTimeout(()=>{win.print();win.close()},500)
  }
  return(<div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(26,31,78,0.5)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <style>{`@keyframes mi{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}`}</style>
    <div style={{background:T.white,borderRadius:20,width:'100%',maxWidth:400,boxShadow:'0 24px 60px rgba(59,86,232,0.18)',overflow:'hidden',animation:'mi 0.25s ease both',fontFamily:T.font}}>
      <div style={{padding:'12px 18px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:14,fontWeight:700,color:T.dark}}>🖨 Print Preview</span><button onClick={onClose} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:7,width:28,height:28,cursor:'pointer',color:T.muted,fontSize:14}}>✕</button></div>
      <div style={{padding:20,textAlign:'center'}}>
        <div style={{background:T.bg,borderRadius:12,padding:14,display:'inline-block',marginBottom:12,border:`1px solid ${T.border}`}}><img src={qr} alt="QR" style={{width:160,height:160,display:'block'}}/></div>
        <div style={{fontSize:15,fontWeight:800,color:T.dark,marginBottom:4}}>{storeName}</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Scan to shop and pay instantly</div>
        <div style={{padding:'10px 14px',background:T.amberBg,border:`1px solid ${T.amberBdr}`,borderRadius:9,fontSize:11,color:T.amber,marginBottom:16,textAlign:'left'}}>💡 A new window will open with the print-ready version.</div>
      </div>
      <div style={{padding:'12px 18px',borderTop:`1px solid ${T.border}`,display:'flex',gap:10}}>
        <button onClick={onClose} style={{flex:1,padding:'9px',background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,color:T.muted,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Cancel</button>
        <button onClick={handlePrint} style={{flex:2,padding:'9px',background:`linear-gradient(135deg,${T.blue},${T.blue2})`,border:'none',borderRadius:9,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:T.font,boxShadow:T.shadowBtn}}>🖨 Open Print Page</button>
      </div>
    </div>
  </div>)
}

function RegenModal({storeName,onConfirm,onClose,loading}){
  return(<div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(26,31,78,0.5)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={e=>e.target===e.currentTarget&&!loading&&onClose()}>
    <div style={{background:T.white,borderRadius:20,padding:26,width:'100%',maxWidth:360,boxShadow:'0 24px 60px rgba(59,86,232,0.18)',animation:'mi 0.25s ease both',fontFamily:T.font}}>
      <div style={{textAlign:'center',marginBottom:18}}><div style={{fontSize:36,marginBottom:10}}>⚠️</div><h3 style={{fontSize:19,fontWeight:800,color:T.dark,marginBottom:6}}>Regenerate QR Code?</h3><p style={{fontSize:12,color:T.muted,lineHeight:1.6}}>A new QR will be created for <strong>{storeName}</strong>.<br/>The old QR will <strong style={{color:T.red}}>stop working immediately</strong>.</p></div>
      <div style={{padding:'10px 13px',background:T.redBg,border:`1px solid ${T.redBdr}`,borderRadius:9,marginBottom:18,fontSize:11,color:T.red}}>⚠ Print and replace the old QR at your entrance after regenerating.</div>
      <div style={{display:'flex',gap:10}}>
        <button onClick={onClose} disabled={loading} style={{flex:1,padding:'10px',background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,color:T.muted,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
        <button onClick={onConfirm} disabled={loading} style={{flex:2,padding:'10px',background:loading?T.redBg:`linear-gradient(135deg,${T.red},#C03030)`,border:'none',borderRadius:9,color:loading?T.red:'#fff',fontSize:13,fontWeight:700,cursor:loading?'not-allowed':'pointer',boxShadow:loading?'none':'0 4px 14px rgba(239,68,68,0.35)'}}>{loading?'⟳ Regenerating…':'🔄 Yes, Regenerate'}</button>
      </div>
    </div>
  </div>)
}

export default function QRCode(){
  const {user}=useAuth()
  const [qr,setQr]=useState(null)
  const [loading,setLoading]=useState(true)
  const [showPrint,setShowPrint]=useState(false)
  const [showRegen,setShowRegen]=useState(false)
  const [regenerating,setRegenerating]=useState(false)
  const [regenOk,setRegenOk]=useState(false)
  const [error,setError]=useState('')

  const load=async()=>{try{const r=await api.get('/api/admin/store/qr');setQr(r.data)}catch(e){console.error(e)}finally{setLoading(false)}}
  useEffect(()=>{load()},[])

  const handleRegenerate=async()=>{setRegenerating(true);setError('');try{const r=await api.post('/api/admin/store/qr/regenerate');setQr(r.data);setRegenOk(true);setShowRegen(false);setTimeout(()=>setRegenOk(false),4000)}catch(e){setError(e.response?.data?.error||'Failed to regenerate.');setShowRegen(false)}finally{setRegenerating(false)}}

  const steps=[['1','Print QR and place at store entrance',T.blue],['2','Customer scans with Nivo app',T.green],['3','Scan each product barcode',T.amber],['4','Pay through app — zero queue','#8B5CF6'],['5','Show exit QR to staff at door','#0EA5E9']]

  return(<div style={{fontFamily:T.font,color:T.dark}}>
    <style>{`@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <div style={{marginBottom:14,paddingBottom:14,borderBottom:`1.5px solid ${T.border}`,animation:'fu 0.4s ease both'}}>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:T.muted2,marginBottom:4}}>Store</div>
      <h1 style={{fontSize:26,fontWeight:800,color:T.dark,letterSpacing:'-0.5px',margin:0}}>QR Code</h1>
      <p style={{fontSize:12,color:T.muted,margin:'2px 0 0'}}>Customers scan this at your entrance to start shopping</p>
    </div>
    {regenOk&&<div style={{marginBottom:12,padding:'9px 14px',background:T.greenBg,border:`1px solid ${T.greenBdr}`,borderRadius:10,fontSize:12,fontWeight:600,color:T.green}}>✅ New QR generated! Print and replace the old one at your entrance.</div>}
    {error&&<div style={{marginBottom:12,padding:'9px 14px',background:T.redBg,border:`1px solid ${T.redBdr}`,borderRadius:10,fontSize:12,color:T.red}}>⚠ {error}</div>}
    {loading?<div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}><div style={{width:22,height:22,border:`2px solid ${T.blueLight2}`,borderTopColor:T.blue,borderRadius:'50%',animation:'spin .8s linear infinite'}}/></div>:(
      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:16,alignItems:'start'}}>
        <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:18,overflow:'hidden',boxShadow:T.shadow,animation:'fu 0.4s ease 0.1s both'}}>
          <div style={{height:3,background:`linear-gradient(90deg,${T.blue},${T.blueSoft},#0EA5E9)`}}/>
          <div style={{padding:20,textAlign:'center'}}>
            <div style={{background:T.bg,borderRadius:12,padding:14,display:'inline-block',marginBottom:14,border:`1px solid ${T.border}`}}>
              {qr?.qr_image?<img src={qr.qr_image} alt="Store QR" style={{width:180,height:180,display:'block'}}/>:<div style={{width:180,height:180,display:'flex',alignItems:'center',justifyContent:'center',color:T.muted2,fontSize:12}}>QR not available</div>}
            </div>
            <div style={{fontSize:16,fontWeight:800,color:T.dark,marginBottom:5}}>{qr?.store_name||user?.store?.name||'My Store'}</div>
            <div style={{fontSize:9,color:T.muted2,fontFamily:'monospace',padding:'4px 8px',background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,marginBottom:16,wordBreak:'break-all'}}>{qr?.qr_code_value||'—'}</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {qr?.qr_image&&<a href={qr.qr_image} download={`${qr.store_name||'store'}-qr.png`} style={{textDecoration:'none'}}><button style={{width:'100%',padding:'10px',background:`linear-gradient(135deg,${T.blue},${T.blue2})`,border:'none',borderRadius:9,color:'#fff',fontSize:12,fontWeight:700,fontFamily:T.font,cursor:'pointer',boxShadow:T.shadowBtn}}>⬇ Download PNG</button></a>}
              {qr?.qr_image&&<button onClick={()=>setShowPrint(true)} style={{width:'100%',padding:'10px',background:T.white,border:`1.5px solid ${T.blue}`,borderRadius:9,color:T.blue,fontSize:12,fontWeight:700,fontFamily:T.font,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background=T.blueLight} onMouseLeave={e=>e.currentTarget.style.background=T.white}>🖨 Print-Ready QR</button>}
              <button onClick={()=>setShowRegen(true)} disabled={regenerating} style={{width:'100%',padding:'10px',background:T.redBg,border:`1.5px solid ${T.redBdr}`,borderRadius:9,color:T.red,fontSize:12,fontWeight:700,fontFamily:T.font,cursor:'pointer',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.background=T.red;e.currentTarget.style.color='#fff'}} onMouseLeave={e=>{e.currentTarget.style.background=T.redBg;e.currentTarget.style.color=T.red}}>🔄 Regenerate QR</button>
            </div>
            <div style={{marginTop:10,fontSize:10,color:T.muted2}}>Regenerating invalidates old QR</div>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12,animation:'fu 0.4s ease 0.15s both'}}>
          <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:16,padding:18,boxShadow:T.shadow}}>
            <h3 style={{fontSize:14,fontWeight:700,color:T.dark,marginBottom:14}}>How To Use</h3>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {steps.map(([n,text,color])=>(
                <div key={n} style={{display:'flex',gap:12,alignItems:'center'}}>
                  <div style={{width:26,height:26,borderRadius:'50%',background:`${color}14`,border:`1.5px solid ${color}35`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color,flexShrink:0}}>{n}</div>
                  <span style={{color:T.dark2,fontSize:12,lineHeight:1.45}}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:`linear-gradient(135deg,${T.blue},${T.blue2})`,borderRadius:16,padding:16}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:10}}>💡 Pro Tips</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 16px'}}>
              {['Print A4 & laminate','Place at eye level','Keep a spare copy','Test before going live','Regenerate if leaked','Replace after regenerate'].map((tip,i)=>(
                <div key={i} style={{display:'flex',gap:6,alignItems:'flex-start'}}><span style={{color:'rgba(255,255,255,0.5)',flexShrink:0,fontSize:11}}>→</span><span style={{fontSize:11,color:'rgba(255,255,255,0.78)',lineHeight:1.4}}>{tip}</span></div>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[{icon:'📱',title:'Mobile App',sub:'Customers use Nivo app',color:T.blue},{icon:'🔒',title:'Secure',sub:'Each scan = unique session',color:T.green},{icon:'⚡',title:'Instant',sub:'Session starts in 2s',color:T.amber},{icon:'🔄',title:'Regenerate',sub:'Change QR anytime',color:T.red}].map((c,i)=>(
              <div key={i} style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:12,padding:'13px 14px',display:'flex',alignItems:'center',gap:10,boxShadow:T.shadow}}>
                <div style={{width:34,height:34,borderRadius:9,background:`${c.color}12`,border:`1px solid ${c.color}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{c.icon}</div>
                <div><div style={{fontSize:12,fontWeight:700,color:T.dark}}>{c.title}</div><div style={{fontSize:10,color:T.muted2,marginTop:1}}>{c.sub}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    {showPrint&&qr?.qr_image&&<PrintModal qr={qr.qr_image} storeName={qr.store_name||user?.store?.name||'My Store'} onClose={()=>setShowPrint(false)}/>}
    {showRegen&&<RegenModal storeName={qr?.store_name||user?.store?.name||'My Store'} onConfirm={handleRegenerate} onClose={()=>setShowRegen(false)} loading={regenerating}/>}
  </div>)
}