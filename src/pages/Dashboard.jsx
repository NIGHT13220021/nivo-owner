import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../api'

const fl = document.createElement('link')
fl.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap'
fl.rel = 'stylesheet'
if (!document.head.querySelector('[href*="Jakarta"]')) document.head.appendChild(fl)

const T = {
  blue:'#3B56E8',blue2:'#2C44D4',blueSoft:'#5B7CFA',
  blueLight:'#EEF2FF',blueLight2:'#E0E7FF',
  bg:'#F0F3FF',white:'#FFFFFF',border:'#E0E7FF',border2:'#C7D2FE',
  dark:'#1A1A2E',dark2:'#2D3561',muted:'#6B7280',muted2:'#9CA3AF',
  green:'#10B981',greenBg:'#ECFDF5',greenBdr:'#A7F3D0',
  amber:'#F59E0B',amberBg:'#FFFBEB',amberBdr:'#FDE68A',
  red:'#EF4444',redBg:'#FEF2F2',redBdr:'#FECACA',
  purple:'#8B5CF6',purpleBg:'#F5F3FF',purpleBdr:'#DDD6FE',
  teal:'#0EA5E9',tealBg:'#F0F9FF',
  orange:'#F97316',orangeBg:'#FFF7ED',orangeBdr:'#FED7AA',
  shadow:'0 2px 12px rgba(59,86,232,0.07)',
  font:"'Plus Jakarta Sans', sans-serif",
}

// ─── Three.js Scenes ─────────────────────────────────────────────────────────

function useThree(ref, builder) {
  useEffect(() => {
    const el = ref.current; if (!el) return
    const W = el.clientWidth||200, H = el.clientHeight||120
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true })
    renderer.setSize(W,H); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
    renderer.setClearColor(0x000000,0); el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55,W/H,0.1,200)
    camera.position.z = 5
    const cleanup = builder(scene,camera,renderer,W,H)
    return () => { if(typeof cleanup==='function') cleanup(); renderer.dispose(); if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement) }
  },[])
}

function RingParticles({ color='#3B56E8' }) {
  const ref = useRef(null)
  useThree(ref, (scene,camera,renderer) => {
    const count=1200, pos=new Float32Array(count*3), cols=new Float32Array(count*3)
    const c1=new THREE.Color(color), c2=new THREE.Color('#5B7CFA')
    for(let i=0;i<count;i++){
      const t=(i/count)*Math.PI*2, r=2+(Math.random()-0.5)*0.6
      pos[i*3]=Math.cos(t)*r; pos[i*3+1]=(Math.random()-0.5)*0.8; pos[i*3+2]=Math.sin(t)*r
      const mix=Math.random(), mc=c1.clone().lerp(c2,mix)
      cols[i*3]=mc.r; cols[i*3+1]=mc.g; cols[i*3+2]=mc.b
    }
    const geo=new THREE.BufferGeometry()
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3))
    geo.setAttribute('color',new THREE.BufferAttribute(cols,3))
    const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:0.03,vertexColors:true,transparent:true,opacity:0.7}))
    scene.add(pts)
    scene.add(new THREE.Mesh(new THREE.TorusGeometry(2,0.04,8,80),new THREE.MeshBasicMaterial({color:new THREE.Color(color),transparent:true,opacity:0.12})))
    let t=0,frame
    const animate=()=>{ frame=requestAnimationFrame(animate); t+=0.007; pts.rotation.y=t*0.5; pts.rotation.x=Math.sin(t*0.3)*0.15; renderer.render(scene,camera) }
    animate(); return ()=>cancelAnimationFrame(frame)
  })
  return <div ref={ref} style={{position:'absolute',inset:0}}/>
}

function HexScene({ color='#10B981' }) {
  const ref = useRef(null)
  useThree(ref, (scene,camera,renderer) => {
    const group=new THREE.Group(); scene.add(group)
    const c=new THREE.Color(color)
    for(let i=0;i<12;i++){
      const geo=new THREE.CylinderGeometry(0.28,0.28,0.08,6)
      const mat=new THREE.MeshPhysicalMaterial({color:c,metalness:0.2,roughness:0.4,transparent:true,opacity:0.5+Math.random()*0.4})
      const mesh=new THREE.Mesh(geo,mat)
      mesh.position.set((Math.random()-0.5)*5,(Math.random()-0.5)*3,(Math.random()-0.5)*3)
      mesh.rotation.x=Math.random()*Math.PI; mesh.rotation.z=Math.random()*Math.PI
      group.add(mesh)
    }
    scene.add(new THREE.AmbientLight(0xffffff,0.6))
    const d=new THREE.DirectionalLight(new THREE.Color(color),2); d.position.set(3,4,2); scene.add(d)
    let t=0,frame
    const animate=()=>{ frame=requestAnimationFrame(animate); t+=0.008; group.rotation.y=t*0.3; group.rotation.x=Math.sin(t*0.2)*0.15; renderer.render(scene,camera) }
    animate(); return ()=>cancelAnimationFrame(frame)
  })
  return <div ref={ref} style={{position:'absolute',inset:0}}/>
}

function PulseScene({ color='#F59E0B' }) {
  const ref = useRef(null)
  useThree(ref, (scene,camera,renderer) => {
    scene.add(new THREE.AmbientLight(0xffffff,0.5))
    const d=new THREE.DirectionalLight(new THREE.Color(color),2); d.position.set(3,4,2); scene.add(d)
    const spheres=[]
    for(let i=0;i<6;i++){
      const r=0.2+Math.random()*0.3
      const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,16,16),new THREE.MeshPhysicalMaterial({color:new THREE.Color(color),metalness:0.2,roughness:0.3,transparent:true,opacity:0.6+Math.random()*0.3}))
      mesh.position.set((Math.random()-0.5)*4,(Math.random()-0.5)*3,(Math.random()-0.5)*2)
      scene.add(mesh); spheres.push({mesh,speed:0.5+Math.random(),phase:Math.random()*Math.PI*2,ox:mesh.position.x,oy:mesh.position.y})
    }
    let t=0,frame
    const animate=()=>{ frame=requestAnimationFrame(animate); t+=0.01; spheres.forEach(s=>{s.mesh.position.y=s.oy+Math.sin(t*s.speed+s.phase)*0.3; s.mesh.position.x=s.ox+Math.cos(t*s.speed*0.7+s.phase)*0.2}); renderer.render(scene,camera) }
    animate(); return ()=>cancelAnimationFrame(frame)
  })
  return <div ref={ref} style={{position:'absolute',inset:0}}/>
}

function CrystalScene({ color='#8B5CF6' }) {
  const ref = useRef(null)
  useThree(ref, (scene,camera,renderer) => {
    scene.add(new THREE.AmbientLight(0xffffff,0.5))
    const d=new THREE.DirectionalLight(new THREE.Color(color),2); d.position.set(3,4,2); scene.add(d)
    const d2=new THREE.DirectionalLight(0xffffff,0.6); d2.position.set(-2,0,3); scene.add(d2)
    const group=new THREE.Group(); scene.add(group)
    const shapes=[new THREE.OctahedronGeometry(0.9),new THREE.TetrahedronGeometry(0.6),new THREE.IcosahedronGeometry(0.5,0)]
    shapes.forEach((geo,i)=>{
      const mesh=new THREE.Mesh(geo,new THREE.MeshPhysicalMaterial({color:new THREE.Color(color),metalness:0.3,roughness:0.2,transparent:true,opacity:0.7}))
      mesh.position.set((i-1)*1.5,0,0); group.add(mesh)
    })
    let t=0,frame
    const animate=()=>{ frame=requestAnimationFrame(animate); t+=0.01; group.rotation.y=t*0.5; group.children.forEach((m,i)=>{m.rotation.x=t*(0.3+i*0.1); m.position.y=Math.sin(t+i*2)*0.3}); renderer.render(scene,camera) }
    animate(); return ()=>cancelAnimationFrame(frame)
  })
  return <div ref={ref} style={{position:'absolute',inset:0}}/>
}

function WaveScene({ color='#0EA5E9' }) {
  const ref = useRef(null)
  useThree(ref, (scene,camera,renderer) => {
    camera.position.set(0,3,6); camera.lookAt(0,0,0)
    const cols=16,rows=16,pts=[]
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) pts.push(new THREE.Vector3((c-cols/2)*0.4,0,(r-rows/2)*0.4))
    const pGeo=new THREE.BufferGeometry().setFromPoints(pts)
    scene.add(new THREE.Points(pGeo,new THREE.PointsMaterial({color:new THREE.Color(color),size:0.06,transparent:true,opacity:0.6})))
    let t=0,frame
    const posArr=pGeo.attributes.position
    const animate=()=>{ frame=requestAnimationFrame(animate); t+=0.04; for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){const idx=r*cols+c; posArr.setY(idx,Math.sin(r*0.8+t)*0.3+Math.cos(c*0.8+t*0.7)*0.3)} posArr.needsUpdate=true; renderer.render(scene,camera) }
    animate(); return ()=>cancelAnimationFrame(frame)
  })
  return <div ref={ref} style={{position:'absolute',inset:0}}/>
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({label,value,color,Scene,delay=0,note=''}){
  return(
    <div style={{position:'relative',background:T.white,border:`1.5px solid ${T.border}`,borderRadius:18,overflow:'hidden',height:190,boxShadow:T.shadow,animation:`cardIn 0.6s ease ${delay}ms both`,transition:'transform 0.3s, box-shadow 0.3s',cursor:'default'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 12px 32px ${color}22,0 0 0 1.5px ${color}30`}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=T.shadow}}>
      <div style={{position:'absolute',inset:0,opacity:0.18}}><Scene color={color}/></div>
      <div style={{position:'absolute',inset:0,background:`linear-gradient(135deg,rgba(255,255,255,0.97) 40%,rgba(255,255,255,0.75) 100%)`,pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${color},${color}44)`}}/>
      <div style={{position:'relative',zIndex:1,padding:'20px 20px 18px',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:9,fontFamily:T.font,fontWeight:700,letterSpacing:'2.5px',textTransform:'uppercase',color:T.muted2,marginBottom:10}}>{label}</div>
          <div style={{fontSize:30,fontFamily:T.font,fontWeight:800,color:T.dark,letterSpacing:'-1px',lineHeight:1}}>{value}</div>
          {/* ── note shown below value e.g. "First day" ── */}
          {note&&<div style={{fontSize:10,color:T.muted2,marginTop:6}}>{note}</div>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:color}}/>
          <span style={{fontSize:11,color,fontWeight:600}}>Live update</span>
        </div>
      </div>
    </div>
  )
}

const ChartTT=({active,payload,label})=>{
  if(!active||!payload?.length) return null
  return(
    <div style={{background:T.white,border:`1.5px solid ${T.border2}`,borderRadius:10,padding:'8px 14px',boxShadow:T.shadow,fontFamily:T.font}}>
      <div style={{fontSize:10,color:T.muted2,letterSpacing:'1px',textTransform:'uppercase',marginBottom:2}}>{label}</div>
      <div style={{fontSize:16,fontWeight:700,color:T.blue}}>₹{(payload[0]?.value||0).toLocaleString()}</div>
    </div>
  )
}

// ─── Stock Levels (READ-ONLY) ─────────────────────────────────────────────────

function StockLevels({ allProducts=[] }) {
  const [filterMode, setFilterMode] = useState('all')
  const [search, setSearch]         = useState('')

  const hasQty    = p => p.stock_quantity != null && p.max_stock != null && p.max_stock > 0
  const stockPct  = p => hasQty(p) ? Math.min(100,(p.stock_quantity/p.max_stock)*100) : p.stock===1?100:0
  const isEmpty   = p => hasQty(p) ? p.stock_quantity===0 : p.stock!==1
  const isLow     = p => stockPct(p)>0 && stockPct(p)<=25
  const stockColor= p => isEmpty(p)?T.red:isLow(p)?T.amber:T.green
  const stockLabel= p => hasQty(p) ? `${p.stock_quantity} / ${p.max_stock}` : p.stock===1?'In Stock':'Out of Stock'

  const noQtySetCount = allProducts.filter(p=>p.max_stock==null||p.max_stock===0).length
  const allMissingQty = noQtySetCount===allProducts.length && allProducts.length>0

  const sorted = [...allProducts].sort((a,b)=>{ const ea=isEmpty(a),eb=isEmpty(b); if(ea!==eb)return ea?-1:1; return stockPct(a)-stockPct(b) })
  const lowCount   = sorted.filter(p=>isLow(p)).length
  const emptyCount = sorted.filter(p=>isEmpty(p)).length
  const okCount    = sorted.filter(p=>!isEmpty(p)&&!isLow(p)).length

  const displayed = sorted
    .filter(p=>{ if(filterMode==='low')return isLow(p); if(filterMode==='empty')return isEmpty(p); return true })
    .filter(p=>!search||p.name?.toLowerCase().includes(search.toLowerCase()))

  const filterBtn=(mode,label,count,color)=>(
    <button onClick={()=>setFilterMode(f=>f===mode?'all':mode)} style={{fontSize:11,fontWeight:700,padding:'4px 11px',borderRadius:20,border:`1.5px solid ${filterMode===mode?color:'transparent'}`,background:filterMode===mode?color+'22':T.bg,color:filterMode===mode?color:T.muted,cursor:'pointer',fontFamily:T.font,transition:'all 0.2s',display:'flex',alignItems:'center',gap:4}}>
      <span style={{width:7,height:7,borderRadius:'50%',background:color,display:'inline-block'}}/>
      {label} <strong>{count}</strong>
    </button>
  )

  return(
    <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:18,boxShadow:T.shadow,overflow:'hidden',animation:'fadeUp 0.6s ease 1s both'}}>
      <div style={{padding:'16px 22px',borderBottom:`1.5px solid ${T.border}`}}>
        <h3 style={{fontSize:16,fontWeight:700,color:T.dark}}>Stock Levels</h3>
        <div style={{fontSize:11,color:T.muted2,marginTop:1}}>{allProducts.length} products · set qty from Products page</div>
      </div>

      {allMissingQty&&(
        <div style={{padding:'10px 22px',background:T.blueLight,borderBottom:`1px solid ${T.blueLight2}`,display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:14}}>ℹ️</span>
          <span style={{fontSize:11,color:T.blue,fontWeight:600}}>
            Go to <strong>Products → Edit</strong> and set <strong>Stock Qty</strong> + <strong>Max Stock</strong> to see the "12 / 50" format here.
          </span>
        </div>
      )}

      <div style={{padding:'10px 22px',background:T.bg,display:'flex',gap:8,flexWrap:'wrap',borderBottom:`1px solid ${T.border}`}}>
        {filterBtn('all',  'All',   allProducts.length, T.blue)}
        {filterBtn('low',  'Low',   lowCount,           T.amber)}
        {filterBtn('empty','Empty', emptyCount,         T.red)}
        <div style={{marginLeft:'auto',display:'flex',gap:14,alignItems:'center'}}>
          <span style={{fontSize:11,color:T.green,fontWeight:700}}>✓ {okCount} ok</span>
          {(lowCount+emptyCount)>0&&<span style={{fontSize:11,color:T.red,fontWeight:700}}>⚠ {lowCount+emptyCount} need attention</span>}
        </div>
      </div>

      <div style={{padding:'10px 22px',borderBottom:`1px solid ${T.border}`}}>
        <div style={{position:'relative'}}>
          <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:12,color:T.muted2}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search product..."
            style={{width:'100%',padding:'7px 10px 7px 30px',background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,fontSize:12,fontFamily:T.font,color:T.dark,outline:'none',boxSizing:'border-box'}}/>
        </div>
      </div>

      {displayed.length===0
        ?<div style={{padding:'30px',textAlign:'center',color:T.muted2}}><div style={{fontSize:22,marginBottom:6,opacity:0.3}}>✓</div><div style={{fontSize:13}}>{search?'No products match':'All products well stocked'}</div></div>
        :<div style={{maxHeight:300,overflowY:'auto',padding:'10px 22px 14px',display:'flex',flexDirection:'column',gap:8}}>
           {displayed.map((p,i)=>{
             const empty=isEmpty(p),low=isLow(p),sc=stockColor(p),pct=stockPct(p),lbl=stockLabel(p)
             return(
               <div key={p.id||i} style={{background:empty?T.redBg:low?T.amberBg:'transparent',border:empty?`1px solid ${T.redBdr}`:low?`1px solid ${T.amberBdr}`:`1px solid ${T.border}`,borderRadius:10,padding:'8px 12px'}}>
                 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                   <div style={{display:'flex',alignItems:'center',gap:6,flex:1,minWidth:0}}>
                     <span style={{fontSize:13,flexShrink:0}}>{empty?'🔴':low?'🟡':'🟢'}</span>
                     <span style={{fontSize:12,fontWeight:empty||low?700:500,color:empty?T.red:low?T.amber:T.dark,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</span>
                     {low&&!empty&&<span style={{fontSize:9,fontWeight:800,background:T.amberBg,color:T.amber,border:`1px solid ${T.amberBdr}`,borderRadius:6,padding:'1px 6px',flexShrink:0}}>LOW</span>}
                     {empty&&<span style={{fontSize:9,fontWeight:800,background:T.redBg,color:T.red,border:`1px solid ${T.redBdr}`,borderRadius:6,padding:'1px 6px',flexShrink:0}}>EMPTY</span>}
                   </div>
                   <span style={{fontSize:12,fontWeight:700,color:sc,flexShrink:0,fontFamily:hasQty(p)?'monospace':'inherit'}}>{lbl}</span>
                 </div>
                 <div style={{height:5,background:'#E5E7EB',borderRadius:3,overflow:'hidden'}}>
                   <div style={{height:'100%',width:`${pct}%`,background:sc,borderRadius:3,transition:'width 1.2s ease'}}/>
                 </div>
                 {hasQty(p)&&<div style={{fontSize:10,color:T.muted2,marginTop:3,textAlign:'right'}}>{Math.round(pct)}% stocked</div>}
               </div>
             )
           })}
         </div>
      }

      {(lowCount+emptyCount)>0&&(
        <div style={{padding:'10px 22px',background:T.amberBg,borderTop:`1px solid ${T.amberBdr}`,display:'flex',alignItems:'center',gap:8}}>
          <span>💡</span>
          <span style={{fontSize:11,color:T.amber,fontWeight:600}}>Update stock from the <strong>Products</strong> page — reflects here instantly.</span>
        </div>
      )}
    </div>
  )
}

// ─── Inventory Intel ──────────────────────────────────────────────────────────

function InventoryIntel({ deadStock=[], starProducts=[], slowMoving=[], storeAgeDays=0 }) {
  const [tab, setTab] = useState('dead')
  const MIN_DAYS   = 14
  const isAnalyzing= storeAgeDays < MIN_DAYS
  const daysLeft   = Math.max(0, MIN_DAYS - storeAgeDays)

  const tabs=[
    {id:'dead',label:'💀 Dead',  count:deadStock.length,    color:T.red},
    {id:'slow',label:'🐢 Slow',  count:slowMoving.length,   color:T.orange},
    {id:'star',label:'⭐ Stars', count:starProducts.length, color:T.amber},
  ]
  const insight={
    dead:'Zero sales in 14 days with stock available. Discount, bundle, or remove to free capital.',
    slow:'Selling but slowly (1–9 units / 14 days). Try promotions or better placement.',
    star:'Top performers. Keep these well-stocked — they drive your growth.',
  }

  const deadSubtitle=p=>{ const d=p.days_idle; return typeof d==='number'&&d>0?`No sales in ${d} days`:'No sales recorded yet' }

  const renderList=(items,type)=>{
    if(!items.length)return(<div style={{padding:'30px',textAlign:'center',color:T.muted2}}><div style={{fontSize:22,marginBottom:6,opacity:0.3}}>{type==='star'?'⭐':'✓'}</div><div style={{fontSize:13}}>{type==='star'?'No star products yet':'None detected — great!'}</div></div>)
    return items.map((p,i)=>(
      <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 22px',borderBottom:i<items.length-1?`1px solid ${T.border}`:'none'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,background:type==='dead'?T.redBg:T.amberBg,border:`1px solid ${type==='dead'?T.redBdr:T.amberBdr}`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>
            {type==='star'?(i===0?'🥇':i===1?'🥈':'🥉'):type==='slow'?'🐢':'💀'}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:T.dark}}>{p.name}</div>
            <div style={{fontSize:11,color:T.muted2,marginTop:1}}>
              {type==='dead'?deadSubtitle(p):type==='slow'?`${p.units_sold||0} units in 14 days`:`${p.units_sold||0} units · ${(p.velocity||0)>1.5?'🔥 Hot':'📈 Rising'}`}
            </div>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          {type==='dead'
            ?<><div style={{fontSize:12,fontWeight:700,color:T.red}}>₹{(p.stock_value||0).toLocaleString()}</div><div style={{fontSize:10,color:T.muted2}}>locked capital</div></>
            :<><div style={{fontSize:12,fontWeight:700,color:type==='star'?T.amber:T.orange}}>₹{(p.revenue||0).toLocaleString()}</div><div style={{fontSize:10,color:T.muted2}}>14-day revenue</div></>
          }
        </div>
      </div>
    ))
  }

  return(
    <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:18,boxShadow:T.shadow,overflow:'hidden',animation:'fadeUp 0.6s ease 0.85s both'}}>
      <div style={{padding:'16px 22px',borderBottom:`1.5px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h3 style={{fontSize:16,fontWeight:700,color:T.dark}}>Inventory Intel</h3>
          <div style={{fontSize:11,color:T.muted2,marginTop:1}}>
            {isAnalyzing?`Collecting data · ready in ~${daysLeft} day${daysLeft!==1?'s':''}` : '14-day sales classification · updates weekly'}
          </div>
        </div>
        {!isAnalyzing&&(
          <div style={{display:'flex',background:T.bg,borderRadius:10,padding:3,gap:2}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{fontSize:11,fontWeight:600,padding:'5px 10px',borderRadius:8,border:'none',cursor:'pointer',fontFamily:T.font,background:tab===t.id?T.white:'transparent',color:tab===t.id?T.dark:T.muted,boxShadow:tab===t.id?T.shadow:'none',transition:'all 0.2s',display:'flex',alignItems:'center',gap:4}}>
                {t.label}
                {t.count>0&&<span style={{background:tab===t.id?t.color+'22':'transparent',color:t.color,borderRadius:10,padding:'1px 5px',fontSize:9,fontWeight:800}}>{t.count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {isAnalyzing?(
        <div style={{padding:'40px 28px',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
          <div style={{width:'100%',maxWidth:340}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:700,color:T.dark}}>🔬 Analyzing sales patterns</span>
              <span style={{fontSize:12,fontWeight:700,color:T.blue}}>{Math.round((storeAgeDays/MIN_DAYS)*100)}%</span>
            </div>
            <div style={{height:8,background:T.bg,borderRadius:20,overflow:'hidden',border:`1px solid ${T.border}`}}>
              <div style={{height:'100%',width:`${Math.min(100,(storeAgeDays/MIN_DAYS)*100)}%`,background:`linear-gradient(90deg,${T.blue},${T.teal})`,borderRadius:20,transition:'width 1s ease'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
              <span style={{fontSize:10,color:T.muted2}}>Day {storeAgeDays}</span>
              <span style={{fontSize:10,color:T.muted2}}>Day {MIN_DAYS}</span>
            </div>
          </div>
          <div style={{background:T.blueLight,border:`1.5px solid ${T.blueLight2}`,borderRadius:14,padding:'14px 20px',width:'100%',maxWidth:340}}>
            <div style={{fontSize:13,fontWeight:700,color:T.blue,marginBottom:8}}>What happens on Day 14?</div>
            {[{icon:'💀',label:'Dead Stock',desc:'0 sales, stock sitting idle'},{icon:'🐢',label:'Slow Moving',desc:'1–9 units sold in 14 days'},{icon:'⭐',label:'Star Products',desc:'10+ units or high velocity'}].map((item,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:i<2?6:0}}>
                <span style={{fontSize:14}}>{item.icon}</span>
                <span style={{fontSize:11,fontWeight:700,color:T.dark}}>{item.label}</span>
                <span style={{fontSize:11,color:T.muted}}>— {item.desc}</span>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:T.muted2,textAlign:'center'}}>Classification refreshes every 7 days automatically.</div>
        </div>
      ):(
        <>
          {tab==='dead'&&renderList(deadStock,'dead')}
          {tab==='slow'&&renderList(slowMoving,'slow')}
          {tab==='star'&&renderList(starProducts,'star')}
          <div style={{padding:'10px 22px',background:tab==='dead'?T.redBg:T.amberBg,borderTop:`1px solid ${tab==='dead'?T.redBdr:T.amberBdr}`,display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:13}}>💡</span>
            <span style={{fontSize:11,color:tab==='dead'?T.red:T.amber,fontWeight:600}}>{insight[tab]}</span>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Smart Alerts ─────────────────────────────────────────────────────────────

function SmartAlerts({ alerts=[], onDismiss }) {
  const [dismissed,setDismissed]=useState(new Set())
  const visible=alerts.filter(a=>!dismissed.has(a.id))
  const dismiss=id=>{setDismissed(prev=>new Set([...prev,id]));onDismiss?.(id)}
  const typeConfig={
    warning:{bg:T.amberBg,border:T.amberBdr,color:T.amber,icon:'⚠️'},
    critical:{bg:T.redBg,border:T.redBdr,color:T.red,icon:'🚨'},
    success:{bg:T.greenBg,border:T.greenBdr,color:T.green,icon:'✅'},
    info:{bg:T.blueLight,border:T.blueLight2,color:T.blue,icon:'💡'},
    stock:{bg:T.orangeBg,border:T.orangeBdr,color:T.orange,icon:'📦'},
  }
  if(visible.length===0) return null
  return(
    <div style={{marginBottom:18,animation:'fadeUp 0.5s ease 0.3s both'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <div style={{width:7,height:7,borderRadius:'50%',background:T.red,animation:'breathe 1.5s ease infinite'}}/>
        <span style={{fontSize:11,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:T.muted2}}>Smart Alerts</span>
        <span style={{fontSize:10,fontWeight:700,background:T.redBg,color:T.red,padding:'2px 7px',borderRadius:10}}>{visible.length}</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {visible.map((alert,i)=>{
          const cfg=typeConfig[alert.type]||typeConfig.info
          return(
            <div key={alert.id} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 16px',background:cfg.bg,border:`1.5px solid ${cfg.border}`,borderRadius:14,animation:`cardIn 0.4s ease ${i*60}ms both`}}>
              <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{cfg.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:T.dark,marginBottom:2}}>{alert.title}</div>
                <div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{alert.message}</div>
                {alert.action&&<button onClick={alert.action.fn} style={{marginTop:7,fontSize:11,fontWeight:700,color:cfg.color,background:'transparent',border:`1px solid ${cfg.border}`,borderRadius:7,padding:'3px 10px',cursor:'pointer',fontFamily:T.font}}>{alert.action.label} →</button>}
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
                <span style={{fontSize:10,color:T.muted2,whiteSpace:'nowrap'}}>{alert.time||'Just now'}</span>
                <button onClick={()=>dismiss(alert.id)} style={{fontSize:12,color:T.muted2,background:'transparent',border:'none',cursor:'pointer',lineHeight:1,padding:2}}>✕</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Weekly Summary ───────────────────────────────────────────────────────────

function WeeklySummary({ summary=null }) {
  const [open,setOpen]=useState(false)
  if(!summary) return null
  const change=(curr,prev)=>{ if(!prev||prev===0)return{pct:0,dir:'same'}; const pct=Math.round(((curr-prev)/prev)*100); return{pct:Math.abs(pct),dir:pct>0?'up':pct<0?'down':'same'} }
  const revChange=change(summary.this_week_revenue,summary.last_week_revenue)
  const arrow=dir=>dir==='up'?'↑':dir==='down'?'↓':'→'
  const arrowColor=dir=>dir==='up'?T.green:dir==='down'?T.red:T.muted2
  return(
    <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:18,boxShadow:T.shadow,overflow:'hidden',marginBottom:18,animation:'fadeUp 0.6s ease 1.1s both'}}>
      <div onClick={()=>setOpen(o=>!o)} style={{padding:'16px 22px',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',userSelect:'none'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:38,height:38,background:T.purpleBg,border:`1.5px solid ${T.purpleBdr}`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>📊</div>
          <div>
            <h3 style={{fontSize:16,fontWeight:700,color:T.dark}}>Weekly Summary</h3>
            <div style={{fontSize:11,color:T.muted2,marginTop:1}}>Week of {summary.week_label||'This week'} · <span style={{color:arrowColor(revChange.dir),fontWeight:700}}>{arrow(revChange.dir)}{revChange.pct}% revenue</span></div>
          </div>
        </div>
        <div style={{fontSize:14,color:T.muted2,transform:open?'rotate(180deg)':'rotate(0)',transition:'transform 0.3s'}}>▾</div>
      </div>
      {open&&(
        <div style={{borderTop:`1.5px solid ${T.border}`,padding:'20px 22px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
            {[
              {label:'Revenue',       curr:summary.this_week_revenue,prev:summary.last_week_revenue,  fmt:v=>`₹${(v||0).toLocaleString()}`},
              {label:'Orders',        curr:summary.this_week_orders, prev:summary.last_week_orders,   fmt:v=>String(v||0)},
              {label:'Avg Order',     curr:summary.avg_order_value,  prev:summary.prev_avg_order,     fmt:v=>`₹${Math.round(v||0).toLocaleString()}`},
              {label:'New Customers', curr:summary.new_customers,    prev:summary.prev_new_customers, fmt:v=>String(v||0)},
            ].map((kpi,i)=>{ const ch=change(kpi.curr,kpi.prev); return(
              <div key={i} style={{background:T.bg,borderRadius:12,padding:'12px 14px'}}>
                <div style={{fontSize:10,color:T.muted2,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:6}}>{kpi.label}</div>
                <div style={{fontSize:18,fontWeight:800,color:T.dark,letterSpacing:'-0.5px'}}>{kpi.fmt(kpi.curr)}</div>
                <div style={{fontSize:11,color:arrowColor(ch.dir),fontWeight:600,marginTop:3}}>{arrow(ch.dir)} {ch.pct}% vs last week</div>
              </div>
            )})}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={{background:T.greenBg,border:`1px solid ${T.greenBdr}`,borderRadius:12,padding:'14px 16px'}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:T.green,marginBottom:6}}>🏆 Best Day</div>
              <div style={{fontSize:16,fontWeight:800,color:T.dark}}>{summary.best_day||'—'}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:2}}>₹{(summary.best_day_revenue||0).toLocaleString()} in revenue</div>
            </div>
            <div style={{background:T.purpleBg,border:`1px solid ${T.purpleBdr}`,borderRadius:12,padding:'14px 16px'}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:T.purple,marginBottom:6}}>💬 AI Insight</div>
              <div style={{fontSize:12,fontWeight:500,color:T.dark2,lineHeight:1.5}}>{summary.ai_insight||"Keep your top products stocked — they're driving consistent growth."}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Timezone fix: DB stores UTC without Z, force UTC parsing ─────────────────
const toUTC=d=>new Date(typeof d==='string'&&!d.includes('Z')&&!d.includes('+')&&!d.includes('-',10)?d.replace(' ','T')+'Z':d)

// ─── Revenue / Inventory Helpers ──────────────────────────────────────────────

function buildRevChart(orders, days) {
  const today = new Date()
  const map = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    map[key] = 0
  }
  orders
    .filter(o => o.payment_status === 'paid')
    .forEach(o => {
      const d = toUTC(o.created_at)
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      if (key in map) map[key] = (map[key] || 0) + (o.total || 0)
    })
  return Object.entries(map).map(([day, rev]) => ({ day, rev }))
}

function calcStoreAgeDays(orders) {
  const paid = orders.filter(o => o.payment_status === 'paid')
  if (!paid.length) return 0
  const sorted = [...paid].sort((a, b) => toUTC(a.created_at) - toUTC(b.created_at))
  return Math.floor((Date.now() - toUTC(sorted[0].created_at)) / 86400000)
}

function buildWeeklySummary(orders) {
  const today = new Date(); today.setHours(23, 59, 59, 999)
  const w0 = new Date(today); w0.setDate(today.getDate() - 6); w0.setHours(0, 0, 0, 0)
  const w1 = new Date(w0); w1.setDate(w0.getDate() - 7)
  const paid = orders.filter(o => o.payment_status === 'paid')
  const tw = paid.filter(o => toUTC(o.created_at) >= w0)
  const lw = paid.filter(o => { const d = toUTC(o.created_at); return d >= w1 && d < w0 })
  const twRev = tw.reduce((s, o) => s + (o.total || 0), 0)
  const lwRev = lw.reduce((s, o) => s + (o.total || 0), 0)
  const dayMap = {}
  tw.forEach(o => {
    const k = toUTC(o.created_at).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' })
    dayMap[k] = (dayMap[k] || 0) + (o.total || 0)
  })
  const best = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0]
  const twCust = new Set(tw.map(o => o.users?.phone).filter(Boolean))
  const lwCust = new Set(lw.map(o => o.users?.phone).filter(Boolean))
  const pct = lwRev ? Math.round(((twRev - lwRev) / lwRev) * 100) : null
  const insight = !twRev
    ? 'Start selling to see weekly insights.'
    : !lwRev ? `First week of data! ₹${twRev.toLocaleString()} across ${tw.length} orders.`
    : pct > 20 ? `Revenue up ${pct}% this week — keep top products stocked!`
    : pct < -20 ? `Revenue dipped ${Math.abs(pct)}% — consider a promotion this week.`
    : `Steady week — ₹${twRev.toLocaleString()} across ${tw.length} orders.`
  return {
    this_week_revenue: twRev, last_week_revenue: lwRev,
    this_week_orders: tw.length, last_week_orders: lw.length,
    avg_order_value: tw.length ? twRev / tw.length : 0,
    prev_avg_order: lw.length ? lwRev / lw.length : 0,
    new_customers: twCust.size, prev_new_customers: lwCust.size,
    best_day: best?.[0] || '—', best_day_revenue: best?.[1] || 0,
    week_label: `${w0.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
    ai_insight: insight,
  }
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({user,store,setPage}){
  const [stats,setStats]                   = useState(null)
  const [analytics,setAnal]               = useState(null)
  const [sessions,setSess]                 = useState([])
  const [orders,setOrders]                 = useState([])
  const [loading,setLoading]               = useState(true)
  const [inventoryIntel,setInventoryIntel] = useState({deadStock:[],starProducts:[],slowMoving:[]})
  const [smartAlerts,setSmartAlerts]       = useState([])
  const [revRange,setRevRange]             = useState('30')
  const [weeklySummary,setWeeklySummary]   = useState(null)
  const [storeAgeDays,setStoreAgeDays]     = useState(0)

  const classify14day=(products=[])=>{
    const dead=[],star=[],slow=[]
    products.forEach(p=>{
      const units=p.units_sold_14d??p.units_sold??0
      const vel  =p.velocity_14d??p.velocity??0
      const rev  =p.revenue_14d??p.revenue??0
      const inStock=(p.stock_quantity??0)>0||p.stock===1
      if(units===0&&inStock){ dead.push({...p,days_idle:typeof p.days_idle==='number'?p.days_idle:14,stock_value:p.stock_value??0}) }
      else if(vel>1.5||units>=10){ star.push({...p,units_sold:units,revenue:rev,velocity:vel}) }
      else if(units>0){ slow.push({...p,units_sold:units,revenue:rev}) }
    })
    star.sort((a,b)=>(b.units_sold??0)-(a.units_sold??0))
    slow.sort((a,b)=>(a.units_sold??0)-(b.units_sold??0))
    return{deadStock:dead,starProducts:star,slowMoving:slow}
  }

  const loadAnalytics=async()=>{
    try{
      const [a,o]=await Promise.all([api.get('/api/admin/analytics'),api.get('/api/admin/orders?limit=500')])
      const allOrds=o.data.orders||[]
      setAnal(a.data); setOrders(allOrds)
      const age=Math.max(a.data.store_age_days??0, calcStoreAgeDays(allOrds))
      setStoreAgeDays(age)
      if(age>=14){
        const hasBackend=a.data.dead_stock||a.data.star_products||a.data.slow_moving
        setInventoryIntel(hasBackend?{deadStock:a.data.dead_stock||[],starProducts:a.data.star_products||[],slowMoving:a.data.slow_moving||[]}:classify14day(a.data.all_products||[]))
      }
      setWeeklySummary(a.data?.weekly_summary || buildWeeklySummary(allOrds))
    }catch(e){console.error(e)}
  }

  useEffect(()=>{
    const load=async()=>{
      try{
        const [s,a,se,o]=await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/analytics'),
          api.get('/api/admin/sessions/live'),
          api.get('/api/admin/orders?limit=500')
        ])
        const allOrds = o.data.orders || []
        setStats(s.data); setAnal(a.data)
        setSess(se.data.sessions||[]); setOrders(allOrds)

        const age = Math.max(a.data.store_age_days??0, calcStoreAgeDays(allOrds))
        setStoreAgeDays(age)
        if(age>=14){
          const hasBackend=a.data.dead_stock||a.data.star_products||a.data.slow_moving
          setInventoryIntel(hasBackend?{deadStock:a.data.dead_stock||[],starProducts:a.data.star_products||[],slowMoving:a.data.slow_moving||[]}:classify14day(a.data.all_products||[]))
        }
        setWeeklySummary(a.data?.weekly_summary || buildWeeklySummary(allOrds))

        const sd=s.data,newAlerts=[]
        if(sd){
          if((sd.low_stock_count||0)>0)
            newAlerts.push({id:'low_stock',type:'stock',title:'Low Stock Warning',message:`${sd.low_stock_count} product(s) running low or out of stock.`,time:'Now',action:{label:'Go to Products',fn:()=>setPage?.('products')}})
          if((sd.pending_orders||0)>0)
            newAlerts.push({id:'pending',type:'warning',title:`${sd.pending_orders} Pending Orders`,message:'Awaiting payment confirmation.',time:'Now',action:{label:'View Orders',fn:()=>setPage?.('orders')}})

          // ── FIX: only show spike if store is ≥3 days old AND both values meaningful ──
          const todayRev    =sd.today_revenue??0
          const yesterdayRev=sd.yesterday_revenue??0
          const isNewStore  =age<3
          if(!isNewStore && todayRev>200 && yesterdayRev>200 && todayRev>yesterdayRev*1.3)
            newAlerts.push({id:'spike',type:'success',title:'🚀 Revenue Spike!',
              message:`Today ₹${todayRev.toLocaleString()} vs yesterday ₹${yesterdayRev.toLocaleString()} — up ${Math.round(((todayRev-yesterdayRev)/yesterdayRev)*100)}%!`,
              time:'Today'})

          if((sd.cart_abandonment_rate||0)>0.4)
            newAlerts.push({id:'abandon',type:'critical',title:'High Cart Abandonment',message:`${Math.round((sd.cart_abandonment_rate||0)*100)}% of carts abandoned. Consider a checkout prompt.`,time:'Today'})
        }
        setSmartAlerts(newAlerts)
      }catch(e){console.error(e)}finally{setLoading(false)}
    }
    load(); const t=setInterval(load,30000); return()=>clearInterval(t)
  },[])

  const suspicious=sessions.filter(s=>{const m=s.minutes_ago,c=s.cart_total||0,i=s.item_count||0;return(m>=30&&c===0)||(m>=20&&c<50)||(m>=15&&i===0)})
  const fmt=v=>v!=null?`₹${Number(v).toLocaleString()}`:'—'
  const card={background:T.white,border:`1.5px solid ${T.border}`,borderRadius:18,boxShadow:T.shadow,overflow:'hidden'}
  const revChartData = buildRevChart(orders, parseInt(revRange))

  // ── Monthly card note ──
  const isNewStore    = storeAgeDays < 3
  const todayRev      = stats?.today_revenue  ?? null
  const monthRev      = stats?.month_revenue  ?? null
  const daysIntoMonth = new Date().getDate()
  const daysInMonth   = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const dailyAvg      = monthRev && daysIntoMonth > 0 ? Math.round(monthRev / daysIntoMonth) : 0
  const monthNote     = isNewStore && todayRev != null && monthRev != null && todayRev === monthRev
    ? '(store started today)'
    : monthRev
    ? `${daysIntoMonth} of ${daysInMonth} days · ₹${dailyAvg.toLocaleString()}/day avg`
    : ''

  const cards=[
    {label:"Today's Revenue",  value:fmt(todayRev),                                               color:T.blue,   Scene:RingParticles, delay:0,   note:''},
    {label:"Monthly Revenue",  value:fmt(monthRev),                                               color:T.teal,   Scene:WaveScene,     delay:70,  note:monthNote},
    {label:"Today's Orders",   value:stats?.today_orders!=null?String(stats.today_orders):'—',   color:T.green,  Scene:HexScene,      delay:140, note:''},
    {label:"Live Shoppers",    value:stats?.live_sessions!=null?String(stats.live_sessions):'—', color:T.amber,  Scene:PulseScene,    delay:210, note:''},
    {label:"Products",         value:stats?.product_count!=null?String(stats.product_count):'—', color:T.purple, Scene:CrystalScene,  delay:280, note:''},
  ]

  const pieData=[
    {name:'Paid',   value:Math.max(orders.filter(o=>o.payment_status==='paid').length,1),   color:T.blue},
    {name:'Pending',value:orders.filter(o=>o.payment_status==='pending').length||0,          color:T.amber},
    {name:'Failed', value:orders.filter(o=>o.payment_status==='failed').length||0,           color:T.red},
  ]

  return(
    <div style={{fontFamily:T.font,color:T.dark,minHeight:'100vh'}}>
      <style>{`
        @keyframes cardIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes breathe{0%,100%{opacity:1}50%{opacity:0.4}}
        .drow:hover{background:${T.bg}!important}
        .qabtn:hover{background:${T.blue}!important;color:#fff!important;border-color:${T.blue}!important}
      `}</style>

      {/* Header */}
      <div style={{marginBottom:28,paddingBottom:22,borderBottom:`1.5px solid ${T.border}`,animation:'fadeUp 0.5s ease both'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:T.muted2,marginBottom:8}}>Store Overview</div>
            <h1 style={{fontSize:34,fontWeight:800,color:T.dark,letterSpacing:'-1px',lineHeight:1,marginBottom:4}}>{store?.name||'Your Store'}</h1>
            <p style={{fontSize:13,color:T.muted}}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
          </div>
          <div style={{display:'flex',gap:10}}>
            {suspicious.length>0&&<div onClick={()=>setPage?.('livesessions')} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',background:T.redBg,border:`1px solid ${T.redBdr}`,borderRadius:20,cursor:'pointer'}}><span>⚠</span><span style={{fontSize:11,fontWeight:700,color:T.red}}>{suspicious.length} suspicious</span></div>}
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',background:T.blueLight,border:`1px solid ${T.blueLight2}`,borderRadius:20}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:T.blue,animation:'breathe 1.8s ease infinite'}}/>
              <span style={{fontSize:11,fontWeight:700,color:T.blue2}}>{sessions.length} LIVE</span>
            </div>
          </div>
        </div>
      </div>

      <SmartAlerts alerts={smartAlerts} onDismiss={id=>setSmartAlerts(a=>a.filter(x=>x.id!==id))}/>

      {/* ── Flagged Sessions (left without paying) ── */}
      {(analytics?.suspicious_sessions?.length > 0) && (
        <div style={{marginBottom:18,animation:'fadeUp 0.5s ease 0.25s both'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:T.red}}/>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:T.muted2}}>Flagged Today</span>
            <span style={{fontSize:10,fontWeight:700,background:T.redBg,color:T.red,padding:'2px 7px',borderRadius:10,border:`1px solid ${T.redBdr}`}}>{analytics.suspicious_sessions.length}</span>
          </div>
          <div style={{background:T.white,border:`1.5px solid ${T.redBdr}`,borderRadius:14,overflow:'hidden',boxShadow:T.shadow}}>
            {analytics.suspicious_sessions.map((s,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 16px',borderBottom:i<analytics.suspicious_sessions.length-1?`1px solid ${T.border}`:'none'}}>
                <div style={{width:30,height:30,borderRadius:8,background:T.redBg,border:`1px solid ${T.redBdr}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>!</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.dark}}>Session {s.session_code}</div>
                  <div style={{fontSize:11,color:T.red,marginTop:1}}>{s.items} item{s.items!==1?'s':''} scanned · left without paying</div>
                </div>
                <div style={{fontSize:11,color:T.muted2,flexShrink:0}}>
                  {new Date(s.entry_time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14,marginBottom:24}}>
        {cards.map((c,i)=><StatCard key={i} {...c}/>)}
      </div>

      {/* Revenue + Payments */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 290px',gap:16,marginBottom:18}}>
        <div style={{...card,padding:24,animation:'fadeUp 0.6s ease 0.5s both'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <div><h3 style={{fontSize:17,fontWeight:700,color:T.dark,marginBottom:2}}>Revenue Trend</h3><div style={{fontSize:11,color:T.muted2}}>Last {revRange} days · paid orders only</div></div>
            <div style={{display:'flex',gap:4,background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,padding:3}}>
              {[['7','7D'],['30','30D']].map(([val,lbl])=><button key={val} onClick={()=>setRevRange(val)} style={{padding:'4px 10px',borderRadius:7,border:'none',background:revRange===val?T.blue:'transparent',color:revRange===val?'#fff':T.muted,fontSize:11,fontWeight:600,fontFamily:T.font,cursor:'pointer',transition:'all 0.15s'}}>{lbl}</button>)}
            </div>
          </div>
          {revChartData.some(d=>d.rev>0)?(
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={revChartData}>
                <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.blue} stopOpacity={0.15}/><stop offset="100%" stopColor={T.blue} stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="day" tick={{fill:T.muted2,fontSize:10,fontFamily:T.font}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:T.muted2,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`}/>
                <Tooltip content={<ChartTT/>}/>
                <Area type="monotone" dataKey="rev" stroke={T.blue} strokeWidth={2.5} fill="url(#rg)" dot={false} activeDot={{r:4,fill:T.blue,stroke:T.white,strokeWidth:2}}/>
              </AreaChart>
            </ResponsiveContainer>
          ):(
            <div style={{height:190,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:T.muted2}}><div style={{fontSize:32,opacity:0.2,marginBottom:10}}>∿</div><div style={{fontSize:13}}>No paid orders in last {revRange} days</div></div>
          )}
        </div>
        <div style={{...card,padding:24,animation:'fadeUp 0.6s ease 0.6s both'}}>
          <h3 style={{fontSize:16,fontWeight:700,color:T.dark,marginBottom:3}}>Payments</h3>
          <div style={{fontSize:11,color:T.muted2,marginBottom:14}}>Order status split</div>
          <div style={{display:'flex',justifyContent:'center'}}>
            <PieChart width={150} height={150}>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={66} paddingAngle={2} dataKey="value">
                {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip contentStyle={{background:T.white,border:`1.5px solid ${T.border2}`,borderRadius:8,fontFamily:T.font,fontSize:12}}/>
            </PieChart>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
            {pieData.map((d,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:8,height:8,borderRadius:2,background:d.color}}/><span style={{fontSize:12,color:T.muted}}>{d.name}</span></div>
                <span style={{fontSize:13,fontWeight:700,color:T.dark}}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders + Top Products */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:18}}>
        <div style={{...card,animation:'fadeUp 0.6s ease 0.7s both'}}>
          <div style={{padding:'16px 22px',borderBottom:`1.5px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><h3 style={{fontSize:16,fontWeight:700,color:T.dark}}>Recent Orders</h3><div style={{fontSize:11,color:T.muted2,marginTop:1}}>Latest transactions</div></div>
            {setPage&&<button onClick={()=>setPage('orders')} style={{fontSize:11,fontWeight:600,color:T.blue,background:T.blueLight,border:`1px solid ${T.blueLight2}`,padding:'4px 12px',borderRadius:8,cursor:'pointer',fontFamily:T.font}}>View all →</button>}
          </div>
          {orders.length===0?<div style={{padding:'40px',textAlign:'center',color:T.muted2}}><div style={{fontSize:24,marginBottom:8,opacity:0.3}}>◫</div><div style={{fontSize:13}}>No orders yet</div></div>
          :orders.slice(0,5).map((o,i)=>(
            <div key={o.id} className="drow" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 22px',borderBottom:i<4?`1px solid ${T.border}`:'none',transition:'background 0.15s'}}>
              <div><div style={{fontSize:13,fontWeight:600,color:T.dark}}>{o.users?.phone||'—'}</div><div style={{fontSize:11,color:T.muted2,marginTop:1}}>{toUTC(o.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:14,fontWeight:700,color:T.dark}}>₹{(o.total||0).toLocaleString()}</div><div style={{fontSize:9,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginTop:2,color:o.payment_status==='paid'?T.green:o.payment_status==='pending'?T.amber:T.red}}>{o.payment_status}</div></div>
            </div>
          ))}
        </div>
        <div style={{...card,animation:'fadeUp 0.6s ease 0.8s both'}}>
          <div style={{padding:'16px 22px',borderBottom:`1.5px solid ${T.border}`}}><h3 style={{fontSize:16,fontWeight:700,color:T.dark}}>Top Products</h3><div style={{fontSize:11,color:T.muted2,marginTop:1}}>By units sold (14 days)</div></div>
          {!analytics?.top_products?.length?<div style={{padding:'40px',textAlign:'center',color:T.muted2}}><div style={{fontSize:24,marginBottom:8,opacity:0.3}}>⊞</div><div style={{fontSize:13}}>No product data yet</div></div>
          :analytics.top_products.map((p,i)=>{
            const colors=[T.blue,T.green,T.purple,T.amber,T.teal],max=analytics.top_products[0]?.units||1
            return(<div key={i} className="drow" style={{padding:'12px 22px',borderBottom:i<analytics.top_products.length-1?`1px solid ${T.border}`:'none',transition:'background 0.15s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:5,height:5,borderRadius:'50%',background:colors[i%5]}}/><span style={{fontSize:13,fontWeight:500,color:T.dark}}>{p.name}</span></div>
                <span style={{fontSize:12,fontWeight:700,color:colors[i%5]}}>{p.units}</span>
              </div>
              <div style={{height:3,background:T.bg,borderRadius:3,overflow:'hidden',marginLeft:13}}><div style={{height:'100%',width:`${(p.units/max)*100}%`,background:colors[i%5],borderRadius:3,transition:'width 1.2s ease'}}/></div>
            </div>)
          })}
        </div>
      </div>

      {/* Inventory Intel + Stock Levels */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:16,marginBottom:18}}>
        <InventoryIntel deadStock={inventoryIntel.deadStock} starProducts={inventoryIntel.starProducts} slowMoving={inventoryIntel.slowMoving} storeAgeDays={storeAgeDays}/>
        <StockLevels allProducts={analytics?.all_products||[]}/>
      </div>

      <WeeklySummary summary={weeklySummary}/>

      {/* Quick Actions */}
      <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:18,boxShadow:T.shadow,overflow:'hidden',padding:22,marginBottom:18,animation:'fadeUp 0.6s ease 1.2s both'}}>
        <h3 style={{fontSize:16,fontWeight:700,color:T.dark,marginBottom:16}}>Quick Actions</h3>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {[{icon:'◎',label:'Live Sessions',page:'livesessions'},{icon:'⊞',label:'Add Products',page:'products'},{icon:'◈',label:'Analytics',page:'analytics'},{icon:'⊡',label:'QR Code',page:'qrcode'},{icon:'◉',label:'Settings',page:'settings'}].map((a,i)=>(
            <button key={i} className="qabtn" onClick={()=>setPage?.(a.page)} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 18px',background:T.white,border:`1.5px solid ${T.border}`,borderRadius:10,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:500,color:T.dark2,transition:'all 0.2s'}}>
              <span style={{color:T.blue}}>{a.icon}</span>{a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}