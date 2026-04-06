import { useState, useEffect } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

const T={blue:'#3B56E8',blue2:'#2C44D4',blueSoft:'#5B7CFA',blueLight:'#EEF2FF',blueLight2:'#E0E7FF',bg:'#F0F3FF',white:'#FFFFFF',border:'#E0E7FF',dark:'#1A1A2E',dark2:'#2D3561',muted:'#6B7280',muted2:'#9CA3AF',green:'#10B981',greenBg:'#ECFDF5',greenBdr:'#A7F3D0',amber:'#F59E0B',amberBg:'#FFFBEB',amberBdr:'#FDE68A',red:'#EF4444',redBg:'#FEF2F2',redBdr:'#FECACA',purple:'#8B5CF6',purpleBg:'#F5F3FF',purpleBdr:'#DDD6FE',font:"'Plus Jakarta Sans',sans-serif",shadow:'0 2px 12px rgba(59,86,232,0.07)',shadowBtn:'0 4px 14px rgba(59,86,232,0.35)'}
const FIELD={width:'100%',padding:'9px 12px',background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,fontSize:13,fontFamily:T.font,color:T.dark,outline:'none',transition:'all 0.2s'}
const LABEL={display:'block',fontSize:9.5,fontWeight:700,color:T.muted2,marginBottom:5,letterSpacing:'2px',textTransform:'uppercase'}

const PLANS=[
  {id:'basic',name:'Basic',price:'₹999',period:'/mo',color:T.blue,bg:T.blueLight,bdr:T.blueLight2,emoji:'🔵',orders:'500 orders/mo',locations:'1 store',features:['QR entry','Product scanning','Basic dashboard','CSV import','Email support'],limits:{orders:500,locations:1}},
  {id:'standard',name:'Standard',price:'₹1,999',period:'/mo',color:T.purple,bg:T.purpleBg,bdr:T.purpleBdr,emoji:'💜',popular:true,orders:'2,000 orders/mo',locations:'3 stores',features:['Everything Basic','Live sessions','Analytics','Priority support','CSV export'],limits:{orders:2000,locations:3}},
  {id:'premium',name:'Premium',price:'₹2,999',period:'/mo',color:T.amber,bg:T.amberBg,bdr:T.amberBdr,emoji:'⭐',orders:'Unlimited',locations:'Unlimited stores',features:['Everything Standard','AI Recommendations','12-month analytics','WhatsApp support','Dedicated manager'],limits:{orders:999999,locations:999}},
]

export default function Settings(){
  const {user,logout}=useAuth()
  const [storeForm,setStoreForm]=useState({name:'',address:'',phone:''})
  const [pwForm,setPwForm]=useState({current:'',newPw:'',confirm:''})
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [savingPw,setSavingPw]=useState(false)
  const [msg,setMsg]=useState({type:'',text:''})
  const [pwMsg,setPwMsg]=useState({type:'',text:''})
  const [currentPlan,setCurrentPlan]=useState('basic')
  const [tab,setTab]=useState('store')

  useEffect(()=>{api.get('/api/admin/store').then(r=>{const s=r.data.store||{};setStoreForm({name:s.name||'',address:s.address||'',phone:s.phone||''});setCurrentPlan((s.plan||'Basic').toLowerCase())}).catch(console.error).finally(()=>setLoading(false))},[])

  const flash=(setter,type,text)=>{setter({type,text});setTimeout(()=>setter({type:'',text:''}),3000)}
  const saveStore=async e=>{e.preventDefault();setSaving(true);try{await api.put('/api/admin/store',storeForm);flash(setMsg,'ok','Store updated!')}catch(e){flash(setMsg,'err',e.response?.data?.error||'Failed')}finally{setSaving(false)}}
  const savePassword=async e=>{e.preventDefault();if(pwForm.newPw!==pwForm.confirm)return flash(setPwMsg,'err',"Passwords don't match");if(pwForm.newPw.length<6)return flash(setPwMsg,'err','Min 6 characters');setSavingPw(true);try{await api.put('/api/admin/change-password',{currentPassword:pwForm.current,newPassword:pwForm.newPw});flash(setPwMsg,'ok','Password changed!');setPwForm({current:'',newPw:'',confirm:''})}catch(e){flash(setPwMsg,'err',e.response?.data?.error||'Failed')}finally{setSavingPw(false)}}
  const doUpgrade=(planId)=>{const plan=PLANS.find(p=>p.id===planId);const msg=encodeURIComponent(`Hi Nivo Team!\n\nI want to upgrade my plan.\nStore: ${storeForm.name}\nPhone: +91 ${user?.phone}\nPlan: ${plan?.name} (${plan?.price}/month)\n\nPlease help me. Thank you!`);window.open(`https://wa.me/919876543210?text=${msg}`,'_blank')}

  const curPlan=PLANS.find(p=>p.id===currentPlan)||PLANS[0]
  const Msg=({m})=>!m.text?null:<div style={{padding:'8px 12px',borderRadius:8,fontSize:12,fontWeight:600,marginBottom:12,background:m.type==='ok'?T.greenBg:T.redBg,border:`1px solid ${m.type==='ok'?T.greenBdr:T.redBdr}`,color:m.type==='ok'?T.green:T.red}}>{m.type==='ok'?'✅':'⚠'} {m.text}</div>

  if(loading)return<div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}><div style={{width:22,height:22,border:`2px solid ${T.blueLight2}`,borderTopColor:T.blue,borderRadius:'50%',animation:'s .8s linear infinite'}}/><style>{`@keyframes s{to{transform:rotate(360deg)}}`}</style></div>

  return(<div style={{fontFamily:T.font,color:T.dark}}>
    <style>{`@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.inp:focus{border-color:${T.blue}!important;box-shadow:0 0 0 3px ${T.blueLight}!important}`}</style>
    <div style={{marginBottom:14,animation:'fu 0.4s ease both'}}>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:T.muted2,marginBottom:4}}>Account</div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <h1 style={{fontSize:26,fontWeight:800,color:T.dark,letterSpacing:'-0.8px',margin:0}}>Settings</h1>
        <p style={{fontSize:12,color:T.muted,margin:0}}>Manage your store, account and subscription</p>
      </div>
    </div>

    <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:14,padding:'12px 18px',marginBottom:14,boxShadow:T.shadow,display:'flex',alignItems:'center',gap:14,animation:'fu 0.4s ease 0.05s both'}}>
      <div style={{width:42,height:42,borderRadius:12,background:`linear-gradient(135deg,${T.blue},${T.blueSoft})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,color:'#fff',flexShrink:0}}>{String(user?.phone||'').slice(-2)||'??'}</div>
      <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:T.dark,marginBottom:4}}>+91 {user?.phone}</div><div style={{display:'flex',gap:6}}><span style={{background:T.blueLight,color:T.blue,fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,border:`1px solid ${T.blueLight2}`}}>Store Owner</span><span style={{background:curPlan.bg,color:curPlan.color,fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,border:`1px solid ${curPlan.bdr}`}}>{curPlan.name} Plan</span></div></div>
      <button onClick={logout} style={{background:T.redBg,border:`1.5px solid ${T.redBdr}`,color:T.red,padding:'7px 14px',borderRadius:9,fontSize:12,fontWeight:700,fontFamily:T.font,cursor:'pointer',transition:'all 0.2s',flexShrink:0}} onMouseEnter={e=>{e.currentTarget.style.background=T.red;e.currentTarget.style.color='#fff'}} onMouseLeave={e=>{e.currentTarget.style.background=T.redBg;e.currentTarget.style.color=T.red}}>Sign Out</button>
    </div>

    <div style={{display:'flex',gap:3,background:T.bg,padding:4,borderRadius:12,marginBottom:14,border:`1.5px solid ${T.border}`,width:'fit-content',animation:'fu 0.4s ease 0.1s both'}}>
      {[['store','🏪 Store Details'],['password','🔑 Change Password'],['plan','💎 Subscription']].map(([id,label])=>(
        <button key={id} onClick={()=>setTab(id)} style={{padding:'7px 16px',borderRadius:9,border:'none',cursor:'pointer',fontFamily:T.font,fontSize:12,fontWeight:600,transition:'all 0.15s',background:tab===id?T.blue:'transparent',color:tab===id?'#fff':T.muted,boxShadow:tab===id?T.shadowBtn:'none'}}>{label}</button>
      ))}
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16,alignItems:'start',animation:'fu 0.4s ease 0.15s both'}}>
      <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:16,padding:22,boxShadow:T.shadow}}>
        {tab==='store'&&<><h3 style={{fontSize:15,fontWeight:700,color:T.dark,marginBottom:16}}>Store Details</h3><form onSubmit={saveStore}>{[['STORE NAME *','name','text','Store name'],['ADDRESS','address','text','Sector 26, Chandigarh'],['CONTACT PHONE','phone','tel','9800000000']].map(([lbl,key,type,ph])=><div key={key} style={{marginBottom:14}}><label style={LABEL}>{lbl}</label><input className="inp" type={type} value={storeForm[key]} onChange={e=>setStoreForm({...storeForm,[key]:e.target.value})} placeholder={ph} required={lbl.includes('*')} style={FIELD}/></div>)}<Msg m={msg}/><button type="submit" disabled={saving} style={{padding:'10px 22px',background:saving?T.blueLight:`linear-gradient(135deg,${T.blue},${T.blue2})`,border:'none',borderRadius:9,color:saving?T.muted:'#fff',fontSize:13,fontWeight:700,fontFamily:T.font,cursor:saving?'not-allowed':'pointer',boxShadow:saving?'none':T.shadowBtn}}>{saving?'Saving…':'Save Changes'}</button></form></>}

        {tab==='password'&&<><h3 style={{fontSize:15,fontWeight:700,color:T.dark,marginBottom:4}}>Change Password</h3><p style={{fontSize:12,color:T.muted,marginBottom:16}}>Update your store owner login password</p><form onSubmit={savePassword}>{[['CURRENT PASSWORD','current'],['NEW PASSWORD','newPw'],['CONFIRM PASSWORD','confirm']].map(([lbl,key])=><div key={key} style={{marginBottom:14}}><label style={LABEL}>{lbl}</label><input className="inp" type="password" value={pwForm[key]} onChange={e=>setPwForm({...pwForm,[key]:e.target.value})} placeholder="••••••••" required style={FIELD}/></div>)}<Msg m={pwMsg}/><button type="submit" disabled={savingPw} style={{padding:'10px 22px',background:savingPw?T.blueLight:`linear-gradient(135deg,${T.blue},${T.blue2})`,border:'none',borderRadius:9,color:savingPw?T.muted:'#fff',fontSize:13,fontWeight:700,fontFamily:T.font,cursor:savingPw?'not-allowed':'pointer',boxShadow:savingPw?'none':T.shadowBtn}}>{savingPw?'Changing…':'Change Password'}</button></form></>}

        {tab==='plan'&&<><h3 style={{fontSize:15,fontWeight:700,color:T.dark,marginBottom:14}}>Subscription Plans</h3><Msg m={msg}/><div style={{display:'flex',flexDirection:'column',gap:10}}>
          {PLANS.map(plan=>{
            const isCurrent=plan.id===currentPlan; const canUpgrade=PLANS.indexOf(plan)>PLANS.indexOf(curPlan)
            return(<div key={plan.id} style={{padding:16,background:isCurrent?plan.bg:T.bg,border:`1.5px solid ${isCurrent?plan.color:T.border}`,borderRadius:13,display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',left:0,top:0,bottom:0,width:4,background:plan.color,borderRadius:'13px 0 0 13px'}}/>
              <div style={{paddingLeft:12,flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:16}}>{plan.emoji}</span><span style={{fontSize:14,fontWeight:800,color:T.dark}}>{plan.name}</span><span style={{fontSize:14,fontWeight:700,color:plan.color}}>{plan.price}<span style={{fontSize:10,fontWeight:400,color:T.muted}}>{plan.period}</span></span>
                  {isCurrent&&<span style={{background:plan.color,color:'#fff',fontSize:8,fontWeight:700,padding:'2px 7px',borderRadius:20}}>ACTIVE</span>}
                  {plan.popular&&!isCurrent&&<span style={{background:plan.bg,color:plan.color,fontSize:8,fontWeight:700,padding:'2px 7px',borderRadius:20,border:`1px solid ${plan.bdr}`}}>POPULAR</span>}
                </div>
                <div style={{fontSize:11,color:T.muted,marginBottom:6}}>{plan.orders} · {plan.locations}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'3px 12px'}}>{plan.features.map((f,i)=><span key={i} style={{fontSize:10,color:T.dark2,display:'flex',alignItems:'center',gap:4}}><span style={{color:T.green,fontWeight:700}}>✓</span>{f}</span>)}</div>
              </div>
              <div style={{flexShrink:0}}>{isCurrent?<div style={{padding:'6px 12px',background:T.white,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontWeight:600,color:T.muted,textAlign:'center'}}>Current</div>:canUpgrade?<button onClick={()=>doUpgrade(plan.id)} style={{padding:'7px 14px',background:`linear-gradient(135deg,${plan.color},${plan.color}cc)`,border:'none',borderRadius:8,fontSize:12,fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:T.font,whiteSpace:'nowrap'}}>Upgrade →</button>:<button onClick={()=>doUpgrade(plan.id)} style={{padding:'7px 14px',background:'transparent',border:`1.5px solid ${plan.color}`,borderRadius:8,fontSize:12,fontWeight:700,color:plan.color,cursor:'pointer',fontFamily:T.font,whiteSpace:'nowrap',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.background=plan.color;e.currentTarget.style.color='#fff'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=plan.color}}>💬 Contact Us</button>}</div>
            </div>)
          })}
        </div></>}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {tab==='store'&&<>
          <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:16,padding:18,boxShadow:T.shadow}}>
            <div style={{fontSize:9.5,fontWeight:700,color:T.muted2,letterSpacing:'2px',textTransform:'uppercase',marginBottom:12}}>Store Status</div>
            {[['🏪','Store Name',storeForm.name],['📍','Address',storeForm.address],['📞','Contact',storeForm.phone]].map(([icon,lbl,val],i)=>(
              <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:i<2?`1px solid ${T.border}`:'none'}}>
                <div style={{width:28,height:28,borderRadius:7,background:T.blueLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}>{icon}</div>
                <div><div style={{fontSize:10,color:T.muted2,fontWeight:600,marginBottom:1}}>{lbl}</div><div style={{fontSize:12,fontWeight:500,color:T.dark}}>{val||'—'}</div></div>
              </div>
            ))}
          </div>
          <div style={{background:curPlan.bg,border:`1.5px solid ${curPlan.bdr}`,borderRadius:16,padding:18}}>
            <div style={{fontSize:9.5,fontWeight:700,color:curPlan.color,letterSpacing:'2px',textTransform:'uppercase',marginBottom:10}}>Active Plan</div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}><span style={{fontSize:24}}>{curPlan.emoji}</span><div><div style={{fontSize:16,fontWeight:800,color:T.dark}}>{curPlan.name}</div><div style={{fontSize:12,color:curPlan.color,fontWeight:600}}>{curPlan.price}{curPlan.period}</div></div></div>
            <button onClick={()=>setTab('plan')} style={{width:'100%',padding:'8px',background:curPlan.color,border:'none',borderRadius:9,color:'#fff',fontSize:12,fontWeight:700,fontFamily:T.font,cursor:'pointer'}}>Manage Plan →</button>
          </div>
        </>}
        {tab==='password'&&<>
          <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:16,padding:18,boxShadow:T.shadow}}>
            <div style={{fontSize:9.5,fontWeight:700,color:T.muted2,letterSpacing:'2px',textTransform:'uppercase',marginBottom:12}}>Security Tips</div>
            {[['🔒','Use 8+ characters'],['🔢','Mix numbers & symbols'],['🚫',"Don't reuse passwords"],['📱','Never share your password']].map(([icon,tip],i)=>(
              <div key={i} style={{display:'flex',gap:8,marginBottom:i<3?9:0}}><span style={{fontSize:14,flexShrink:0}}>{icon}</span><span style={{fontSize:11,color:T.muted,lineHeight:1.45}}>{tip}</span></div>
            ))}
          </div>
          <div style={{background:T.greenBg,border:`1.5px solid ${T.greenBdr}`,borderRadius:16,padding:18}}>
            <div style={{fontSize:9.5,fontWeight:700,color:T.green,letterSpacing:'2px',textTransform:'uppercase',marginBottom:10}}>Security Status</div>
            {[['Password Protection','✅ Active'],['OTP Reset','✅ Enabled'],['JWT Sessions','✅ Secure']].map(([lbl,val],i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:i<2?`1px solid ${T.greenBdr}`:'none'}}><span style={{fontSize:11,color:T.dark2}}>{lbl}</span><span style={{fontSize:11,fontWeight:600,color:T.green}}>{val}</span></div>
            ))}
          </div>
        </>}
        {tab==='plan'&&<>
          <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:16,padding:18,boxShadow:T.shadow}}>
            <div style={{fontSize:9.5,fontWeight:700,color:T.muted2,letterSpacing:'2px',textTransform:'uppercase',marginBottom:12}}>Your Usage</div>
            {[['Orders this month',0,curPlan.limits.orders===999999?'∞':curPlan.limits.orders,T.blue],['Store locations',1,curPlan.limits.locations===999?'∞':curPlan.limits.locations,T.purple]].map(([lbl,used,max,color],i)=>(
              <div key={i} style={{marginBottom:i<1?12:0}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:11,color:T.dark2}}>{lbl}</span><span style={{fontSize:11,fontWeight:700,color}}>{used}/{max}</span></div><div style={{height:5,background:T.bg,borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:`${typeof max==='string'?3:(used/max)*100}%`,background:color,borderRadius:4}}/></div></div>
            ))}
          </div>
          <div style={{padding:14,background:T.blueLight,border:`1px solid ${T.blueLight2}`,borderRadius:13,textAlign:'center'}}>
            <div style={{fontSize:12,fontWeight:600,color:T.dark2,marginBottom:4}}>Need help choosing?</div>
            <a href="mailto:support@nivo.in" style={{fontSize:12,color:T.blue,fontWeight:700,textDecoration:'none'}}>support@nivo.in</a>
          </div>
        </>}
      </div>
    </div>
  </div>)
}