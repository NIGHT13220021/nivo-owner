import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../api'

const T = {
  blue:'#3B56E8',blue2:'#2C44D4',blueSoft:'#5B7CFA',blueLight:'#EEF2FF',blueLight2:'#E0E7FF',
  bg:'#F0F3FF',white:'#FFFFFF',border:'#E0E7FF',border2:'#C7D2FE',
  dark:'#1A1A2E',muted:'#6B7280',muted2:'#9CA3AF',
  green:'#10B981',greenBg:'#ECFDF5',greenBdr:'#A7F3D0',
  amber:'#F59E0B',amberBg:'#FFFBEB',
  purple:'#8B5CF6',
  shadow:'0 2px 12px rgba(59,86,232,0.07)',
  font:"'Plus Jakarta Sans',sans-serif",
}

const toUTC=d=>new Date(typeof d==='string'&&!d.includes('Z')&&!d.includes('+')&&!d.includes('-',10)?d.replace(' ','T')+'Z':d)

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

const ChartTT=({active,payload,label})=>{
  if(!active||!payload?.length)return null
  return<div style={{background:T.white,border:`1.5px solid ${T.border2}`,borderRadius:10,padding:'8px 14px',boxShadow:T.shadow,fontFamily:T.font}}><div style={{fontSize:10,color:T.muted2,letterSpacing:'1px',textTransform:'uppercase',marginBottom:2}}>{label}</div><div style={{fontSize:16,fontWeight:700,color:T.blue}}>₹{(payload[0]?.value||0).toLocaleString()}</div></div>
}

export default function Analytics(){
  const [data,setData]=useState(null)
  const [orders,setOrders]=useState([])
  const [loading,setLoading]=useState(true)
  const [range,setRange]=useState('30')

  useEffect(()=>{
    const load=async()=>{
      try{
        const [r,o]=await Promise.all([api.get('/api/admin/analytics'),api.get('/api/admin/orders?limit=500')])
        setData(r.data); setOrders(o.data.orders||[])
      }catch(e){console.error(e)}finally{setLoading(false)}
    }
    load()
  },[])

  const chartData = buildRevChart(orders, parseInt(range))
  const totalRevenue = chartData.reduce((s,d)=>s+(d.rev||0),0)
  const daysWithData = chartData.filter(d=>d.rev>0).length
  const avgDaily = daysWithData ? Math.round(totalRevenue/daysWithData) : 0
  const peakDay = chartData.reduce((a,b)=>((b.rev||0)>(a.rev||0)?b:a),{day:'—',rev:0})||{}
  const medals=['🥇','🥈','🥉']
  const barColors=[T.blue,T.green,T.purple,T.amber,'#0EA5E9']

  return(
    <div style={{fontFamily:T.font,color:T.dark}}>
      <style>{`@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}.trow:hover{background:${T.bg}!important}`}</style>
      <div style={{marginBottom:16,paddingBottom:16,borderBottom:`1.5px solid ${T.border}`,animation:'fu 0.4s ease both'}}>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:T.muted2,marginBottom:4}}>Insights</div>
        <h1 style={{fontSize:26,fontWeight:800,color:T.dark,letterSpacing:'-0.5px',margin:0}}>Analytics</h1>
        <p style={{fontSize:12,color:T.muted,margin:'2px 0 0'}}>Your store's performance over time</p>
      </div>

      {loading?<div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}><div style={{width:22,height:22,border:`2px solid ${T.blueLight2}`,borderTopColor:T.blue,borderRadius:'50%',animation:'spin .8s linear infinite'}}/></div>:<>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16,animation:'fu 0.4s ease 0.05s both'}}>
          {[{label:'Total Revenue',value:`₹${totalRevenue.toLocaleString()}`,color:T.blue,bg:T.blueLight,icon:'💰'},{label:'Daily Average',value:`₹${avgDaily.toLocaleString()}`,color:T.green,bg:T.greenBg,icon:'📈'},{label:'Peak Day',value:peakDay.day||'—',color:T.purple,bg:'#F5F3FF',icon:'🏆'},{label:'Top Products',value:data?.top_products?.length||0,color:T.amber,bg:T.amberBg,icon:'🔥'}].map((s,i)=>(
            <div key={i} style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:12,padding:'12px 14px',boxShadow:T.shadow,display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:34,height:34,borderRadius:9,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{s.icon}</div>
              <div><div style={{fontSize:16,fontWeight:800,color:s.color,letterSpacing:'-0.3px',lineHeight:1}}>{s.value}</div><div style={{fontSize:10,color:T.muted2,marginTop:2}}>{s.label}</div></div>
            </div>
          ))}
        </div>

        <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:16,padding:22,marginBottom:14,boxShadow:T.shadow,animation:'fu 0.4s ease 0.1s both'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18,flexWrap:'wrap',gap:10}}>
            <div><h3 style={{fontSize:16,fontWeight:700,color:T.dark,margin:0}}>Revenue Trend</h3><div style={{fontSize:11,color:T.muted2,marginTop:2}}>Daily paid orders</div></div>
            <div style={{display:'flex',gap:4,background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,padding:3}}>
              {[['7','7 Days'],['30','30 Days']].map(([val,lbl])=><button key={val} onClick={()=>setRange(val)} style={{padding:'5px 12px',borderRadius:7,border:'none',background:range===val?T.blue:'transparent',color:range===val?'#fff':T.muted,fontSize:11,fontWeight:600,fontFamily:T.font,cursor:'pointer',transition:'all 0.15s'}}>{lbl}</button>)}
            </div>
          </div>
          {chartData.some(d=>d.rev>0)?<ResponsiveContainer width="100%" height={200}><AreaChart data={chartData}><defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.blue} stopOpacity={0.15}/><stop offset="100%" stopColor={T.blue} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/><XAxis dataKey="day" tick={{fill:T.muted2,fontSize:10,fontFamily:T.font}} axisLine={false} tickLine={false}/><YAxis tick={{fill:T.muted2,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`}/><Tooltip content={<ChartTT/>}/><Area type="monotone" dataKey="rev" stroke={T.blue} strokeWidth={2.5} fill="url(#rg)" dot={false} activeDot={{r:4,fill:T.blue,stroke:T.white,strokeWidth:2}}/></AreaChart></ResponsiveContainer>:<div style={{height:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:T.muted2}}><div style={{fontSize:30,opacity:0.2,marginBottom:8}}>∿</div><div style={{fontSize:13}}>No paid orders in last {range} days</div></div>}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,animation:'fu 0.4s ease 0.15s both'}}>
          <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:16,overflow:'hidden',boxShadow:T.shadow}}>
            <div style={{padding:'14px 18px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:T.bg}}><h3 style={{fontSize:15,fontWeight:700,color:T.dark,margin:0}}>Top Products 🔥</h3><span style={{fontSize:11,color:T.muted2}}>By units sold</span></div>
            {!data?.top_products?.length?<div style={{padding:'40px',textAlign:'center',color:T.muted2}}><div style={{fontSize:24,marginBottom:8,opacity:0.3}}>📦</div><div style={{fontSize:13}}>No product data yet</div></div>
            :data.top_products.map((p,i)=>(
              <div key={i} className="trow" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 18px',borderBottom:i<data.top_products.length-1?`1px solid ${T.border}`:'none',transition:'background 0.15s'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:30,height:30,borderRadius:8,background:`${barColors[i%5]}14`,border:`1px solid ${barColors[i%5]}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>{medals[i]||<span style={{fontSize:11,fontWeight:800,color:barColors[i%5]}}>{i+1}</span>}</div>
                  <div><div style={{fontSize:13,fontWeight:600,color:T.dark}}>{p.name}</div><div style={{fontSize:10,color:T.muted2}}>{p.units} units sold</div></div>
                </div>
                <div style={{textAlign:'right'}}><div style={{fontSize:14,fontWeight:700,color:T.green}}>₹{(p.revenue||0).toLocaleString()}</div><div style={{fontSize:10,color:T.muted2}}>Revenue</div></div>
              </div>
            ))}
          </div>
          <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:16,padding:20,boxShadow:T.shadow}}>
            <h3 style={{fontSize:15,fontWeight:700,color:T.dark,marginBottom:4}}>Revenue by Day</h3>
            <div style={{fontSize:11,color:T.muted2,marginBottom:14}}>Bar comparison — last {range} days</div>
            {chartData.length>0?<ResponsiveContainer width="100%" height={180}><BarChart data={chartData} barSize={range==='7'?28:12}><CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/><XAxis dataKey="day" tick={{fill:T.muted2,fontSize:9,fontFamily:T.font}} axisLine={false} tickLine={false}/><YAxis tick={{fill:T.muted2,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`}/><Tooltip content={<ChartTT/>}/><Bar dataKey="rev" fill={T.blue} radius={[4,4,0,0]} opacity={0.85}/></BarChart></ResponsiveContainer>:<div style={{height:180,display:'flex',alignItems:'center',justifyContent:'center',color:T.muted2,fontSize:13}}>No data yet</div>}
          </div>
        </div>
      </>}
    </div>
  )
}