import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'

const fl = document.createElement('link')
fl.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap'
fl.rel = 'stylesheet'
if (!document.head.querySelector('[href*="Jakarta"]')) document.head.appendChild(fl)

const T = {
  blue:'#3B56E8',blue2:'#2C44D4',blueSoft:'#5B7CFA',
  blueLight:'#EEF2FF',blueLight2:'#E0E7FF',
  bg:'#F0F3FF',white:'#FFFFFF',border:'#E0E7FF',
  dark:'#1A1A2E',muted:'#6B7280',
  sidebar:'#1A1F4E',sidebarB:'#0F1235',
  font:"'Plus Jakarta Sans', sans-serif",
}

function NivoLogo() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true })
    renderer.setSize(38,38); renderer.setClearColor(0x000000,0)
    el.appendChild(renderer.domElement)
    const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(45,1,0.1,100)
    camera.position.z=3.5
    scene.add(new THREE.AmbientLight(0xffffff,0.7))
    const d1=new THREE.DirectionalLight(0x5B7CFA,2.5); d1.position.set(3,4,2); scene.add(d1)
    const d2=new THREE.DirectionalLight(0xffffff,0.8); d2.position.set(-2,0,3); scene.add(d2)
    const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(0.9,0),new THREE.MeshPhysicalMaterial({color:0x3B56E8,metalness:0.3,roughness:0.2,emissive:0x1A2FA0,emissiveIntensity:0.3}))
    scene.add(mesh)
    const wire=new THREE.Mesh(new THREE.IcosahedronGeometry(0.98,0),new THREE.MeshBasicMaterial({color:0x5B7CFA,wireframe:true,transparent:true,opacity:0.15}))
    scene.add(wire)
    let t=0,frame
    const animate=()=>{ frame=requestAnimationFrame(animate); t+=0.012; mesh.rotation.y=t; mesh.rotation.x=Math.sin(t*0.5)*0.28; wire.rotation.y=t; wire.rotation.x=mesh.rotation.x; renderer.render(scene,camera) }
    animate()
    return ()=>{ cancelAnimationFrame(frame); renderer.dispose(); if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement) }
  },[])
  return <div ref={ref} style={{width:38,height:38,flexShrink:0}}/>
}

const navItems=[
  {id:'dashboard',   label:'Dashboard',    icon:'▣', roles:null},
  {id:'orders',      label:'Orders',       icon:'◫', roles:null},
  {id:'livesessions',label:'Live Sessions',icon:'◎', roles:null},
  {id:'products',    label:'Products',     icon:'⊞', roles:null},
  {id:'analytics',   label:'Analytics',    icon:'◈', roles:null},
  {id:'qrcode',      label:'QR Code',      icon:'⊡', roles:null},
  {id:'settings',    label:'Settings',     icon:'◉', roles:null},
  {id:'billing',     label:'Billing',      icon:'◎', roles:['super_admin']},
]

export default function Layout({page,setPage,user,store,onLogout,children}){
  const [collapsed,setCollapsed]=useState(false)
  return(
    <div style={{display:'flex',minHeight:'100vh',background:T.bg,fontFamily:T.font}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${T.bg}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(59,86,232,0.2);border-radius:4px}.nav-lnk{transition:all 0.2s ease;cursor:pointer;border-radius:10px}.nav-lnk:hover{background:rgba(91,124,250,0.12)!important}@keyframes fadeSlide{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}@keyframes breathe{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{width:collapsed?64:228,minHeight:'100vh',background:`linear-gradient(180deg,${T.sidebar} 0%,${T.sidebarB} 100%)`,display:'flex',flexDirection:'column',transition:'width 0.3s cubic-bezier(0.4,0,0.2,1)',position:'fixed',top:0,left:0,bottom:0,zIndex:100,overflow:'hidden',boxShadow:'4px 0 24px rgba(26,31,78,0.2)'}}>
        <div style={{padding:'20px 13px 16px',display:'flex',alignItems:'center',gap:11,borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <NivoLogo/>
          {!collapsed&&<div style={{animation:'fadeSlide 0.3s ease'}}><div style={{fontSize:17,fontFamily:T.font,fontWeight:800,color:'#fff',letterSpacing:'-0.3px',lineHeight:1}}>Nivo</div><div style={{fontSize:8,color:'rgba(91,124,250,0.7)',fontWeight:600,letterSpacing:'3px',textTransform:'uppercase',marginTop:3}}>Store Dashboard</div></div>}
        </div>
        {!collapsed&&store&&<div style={{margin:'12px 12px 0',padding:'10px 13px',background:'rgba(91,124,250,0.12)',border:'1px solid rgba(91,124,250,0.22)',borderRadius:12,animation:'fadeSlide 0.3s ease'}}><div style={{fontSize:8,color:'rgba(255,255,255,0.35)',fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',marginBottom:3}}>Active Store</div><div style={{fontSize:13,fontWeight:700,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{store.name}</div><div style={{fontSize:10,color:'rgba(91,124,250,0.8)',marginTop:2}}>{store.address||'● Online'}</div></div>}
        <nav style={{flex:1,padding:'14px 8px',display:'flex',flexDirection:'column',gap:2}}>
          {navItems.filter(item=>!item.roles||item.roles.includes(user?.role)).map(item=>{
            const active=page===item.id
            const isBilling=item.id==='billing'
            const activeColor=isBilling?'#F97316':T.blueSoft
            return(<div key={item.id} className="nav-lnk" onClick={()=>setPage(item.id)} style={{display:'flex',alignItems:'center',gap:10,padding:collapsed?'11px':'9px 13px',justifyContent:collapsed?'center':'flex-start',background:active?(isBilling?'rgba(249,115,22,0.18)':'rgba(91,124,250,0.18)'):'transparent',border:active?`1px solid ${isBilling?'rgba(249,115,22,0.3)':'rgba(91,124,250,0.28)'}`:'1px solid transparent',position:'relative'}} title={collapsed?item.label:''}>
              {active&&<div style={{position:'absolute',left:0,top:'22%',bottom:'22%',width:3,background:activeColor,borderRadius:'0 3px 3px 0',boxShadow:`0 0 8px ${activeColor}`}}/>}
              <span style={{fontSize:15,color:active?activeColor:'rgba(255,255,255,0.3)',flexShrink:0}}>{item.icon}</span>
              {!collapsed&&<span style={{fontSize:13,fontWeight:active?700:400,color:active?'#fff':'rgba(255,255,255,0.45)',animation:'fadeSlide 0.2s ease',whiteSpace:'nowrap'}}>{item.label}{isBilling&&!collapsed&&<span style={{marginLeft:6,fontSize:8,background:'rgba(249,115,22,0.3)',color:'#F97316',padding:'1px 5px',borderRadius:4,fontWeight:700,letterSpacing:'0.5px'}}>ADMIN</span>}</span>}
            </div>)
          })}
        </nav>
        <div style={{padding:'10px 8px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          {!collapsed&&user?.phone&&<div style={{padding:'8px 13px',marginBottom:4}}><div style={{fontSize:8,color:'rgba(255,255,255,0.2)',fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',marginBottom:2}}>Signed in</div><div style={{fontSize:12,color:'rgba(255,255,255,0.38)'}}>+91 {user.phone}</div></div>}
          <div className="nav-lnk" onClick={onLogout} style={{display:'flex',alignItems:'center',gap:10,padding:collapsed?'11px':'9px 13px',justifyContent:collapsed?'center':'flex-start'}} title="Logout">
            <span style={{fontSize:14,color:'rgba(239,68,68,0.55)'}}>⏻</span>
            {!collapsed&&<span style={{fontSize:12,fontWeight:500,color:'rgba(239,68,68,0.55)',animation:'fadeSlide 0.2s ease'}}>Logout</span>}
          </div>
        </div>
      </div>
      <div style={{flex:1,marginLeft:collapsed?64:228,transition:'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',display:'flex',flexDirection:'column',minHeight:'100vh'}}>
        <div style={{height:60,background:T.white,borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',position:'sticky',top:0,zIndex:50,boxShadow:'0 1px 12px rgba(59,86,232,0.07)'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <button onClick={()=>setCollapsed(c=>!c)} style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:8,width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:T.muted,fontSize:12,transition:'all 0.2s',fontFamily:T.font}} onMouseEnter={e=>{e.currentTarget.style.background=T.blueLight;e.currentTarget.style.color=T.blue}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.muted}}>{collapsed?'→':'←'}</button>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:12,color:'#9CA3AF'}}>Home</span>
              <span style={{fontSize:12,color:T.border}}>›</span>
              <span style={{fontSize:12,color:T.dark,fontWeight:600,textTransform:'capitalize'}}>{page}</span>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',background:T.blueLight,border:`1px solid ${T.blueLight2}`,borderRadius:20}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:T.blue,animation:'breathe 1.8s ease infinite'}}/>
              <span style={{fontSize:10,fontWeight:700,color:T.blue,letterSpacing:'1px'}}>LIVE</span>
            </div>
            {store&&<span style={{fontSize:12,color:T.muted,fontWeight:500}}>{store.name}</span>}
            <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${T.blue},${T.blueSoft})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff',letterSpacing:'0.5px',boxShadow:`0 2px 10px ${T.blue}44`}}>{String(user?.phone||'??').slice(-2)}</div>
          </div>
        </div>
        <div style={{flex:1,padding:28,overflowY:'auto',background:T.bg}}>{children}</div>
      </div>
    </div>
  )
}