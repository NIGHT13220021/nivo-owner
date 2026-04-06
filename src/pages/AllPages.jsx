// ── ORDERS ───────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts'
import api from '../api'

const fmtDate = d => new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})
const fmt = n => `₹${(n||0).toLocaleString()}`

function StatusBadge({ status }) {
  const m = { paid:{cls:'b-green',label:'Paid'}, pending:{cls:'b-yellow',label:'Pending'}, failed:{cls:'b-red',label:'Failed'} }
  const s = m[status]||m.pending
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}
function Loader() {
  return <div style={{ display:'flex',justifyContent:'center',padding:'80px 0' }}><div style={{ width:28,height:28,border:'2px solid var(--blue3)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .8s linear infinite' }}/></div>
}
function Empty({ msg, icon='📭' }) {
  return <div style={{ textAlign:'center',padding:'80px 0',color:'var(--text3)' }}><div style={{ fontSize:44,marginBottom:12 }}>{icon}</div><div style={{ fontSize:14 }}>{msg}</div></div>
}

export function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')

  useEffect(()=>{
    const load = async()=>{
      setLoading(true)
      try{ const r = await api.get(`/api/admin/orders?status=${filter}`); setOrders(r.data.orders||[]) }
      catch(e){ console.error(e) }
      finally{ setLoading(false) }
    }
    load()
  },[filter])

  const filtered = orders.filter(o=>!search||o.users?.phone?.includes(search)||String(o.id).includes(search))

  return (
    <div>
      <div style={{ marginBottom:28 }} className="fu">
        <h2 style={{ fontSize:28,fontWeight:900,color:'#fff',letterSpacing:'-1px',fontFamily:"'Barlow Condensed',sans-serif",marginBottom:4 }}>Orders</h2>
        <p style={{ color:'var(--text3)',fontSize:14 }}>All orders for your store</p>
      </div>

      <div style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap' }}>
        <div style={{ position:'relative',flex:1,minWidth:200 }}>
          <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',fontSize:14 }}>🔍</span>
          <input className="field" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search phone or ID..." style={{ paddingLeft:40 }}/>
        </div>
        <div style={{ display:'flex',gap:4,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:4 }}>
          {['all','paid','pending','failed'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:'7px 16px',borderRadius:7,border:'none',background:filter===f?'rgba(59,130,246,.15)':'transparent',color:filter===f?'#60a5fa':'var(--text3)',fontSize:13,fontWeight:600,textTransform:'capitalize',transition:'all .2s',fontFamily:"'Barlow Condensed',sans-serif" }}>{f}</button>
          ))}
        </div>
      </div>

      {loading?<Loader/>:filtered.length===0?<Empty msg="No orders found"/>:(
        <div className="card fu" style={{ overflow:'hidden' }}>
          <div style={{ display:'grid',gridTemplateColumns:'60px 1fr 1fr 1fr 1fr 120px',padding:'12px 20px',borderBottom:'1px solid var(--border)',color:'var(--text3)',fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',fontFamily:"'Barlow Condensed',sans-serif" }}>
            <span>#</span><span>Phone</span><span>Amount</span><span>Status</span><span>Date</span><span>Payment ID</span>
          </div>
          {filtered.map((o,i)=>(
            <div key={o.id} className="trow" style={{ display:'grid',gridTemplateColumns:'60px 1fr 1fr 1fr 1fr 120px',padding:'14px 20px',alignItems:'center',borderBottom:i<filtered.length-1?'1px solid var(--border)':'none' }}>
              <span style={{ color:'var(--text3)',fontSize:13 }}>{o.id}</span>
              <span style={{ color:'#fff',fontSize:14 }}>{o.users?.phone||'—'}</span>
              <span style={{ color:'#fff',fontSize:14,fontWeight:700 }}>{fmt(o.total)}</span>
              <StatusBadge status={o.payment_status}/>
              <span style={{ color:'var(--text3)',fontSize:12 }}>{fmtDate(o.created_at)}</span>
              <span style={{ color:'var(--text3)',fontSize:11,fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{o.razorpay_payment_id?o.razorpay_payment_id.slice(-10):'—'}</span>
            </div>
          ))}
        </div>
      )}
      {!loading&&filtered.length>0&&<div style={{ marginTop:10,color:'var(--text3)',fontSize:12,textAlign:'right' }}>{filtered.length} orders</div>}
    </div>
  )
}

// ── LIVE SESSIONS ─────────────────────────────────────────
export function LiveSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  const load = async()=>{
    try{ const r = await api.get('/api/admin/sessions/live'); setSessions(r.data.sessions||[]); setLastUpdate(new Date()) }
    catch(e){ console.error(e) }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ load(); const t = setInterval(load,15000); return()=>clearInterval(t) },[])

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:28 }} className="fu">
        <div>
          <h2 style={{ fontSize:28,fontWeight:900,color:'#fff',letterSpacing:'-1px',fontFamily:"'Barlow Condensed',sans-serif",marginBottom:4 }}>Live Sessions</h2>
          <p style={{ color:'var(--text3)',fontSize:14 }}>Shoppers in your store right now · Auto-refreshes every 15s</p>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 16px',background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.25)',borderRadius:20 }}>
          <div style={{ width:8,height:8,borderRadius:'50%',background:'#22c55e',animation:'live 1.5s ease-in-out infinite' }}/>
          <span style={{ fontSize:12,fontWeight:700,color:'#4ade80',fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:'1px' }}>{sessions.length} LIVE</span>
        </div>
      </div>

      {loading?<Loader/>:sessions.length===0?(
        <Empty msg="No active shoppers right now. Share your QR code to get started!" icon="🏪"/>
      ):(
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16 }}>
          {sessions.map((s,i)=>(
            <div key={s.session_id} className={`card fu d${Math.min(i+1,6)}`} style={{ padding:20 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16 }}>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <div style={{ width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff' }}>
                    {s.phone?.slice(-2)}
                  </div>
                  <div>
                    <div style={{ fontSize:14,fontWeight:600,color:'#fff' }}>+91 {s.phone}</div>
                    <div style={{ fontSize:11,color:'var(--text3)' }}>{s.minutes_ago}m ago</div>
                  </div>
                </div>
                <span className="badge b-green">LIVE</span>
              </div>

              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16 }}>
                <div style={{ background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.15)',borderRadius:10,padding:'10px 12px' }}>
                  <div style={{ fontSize:18,fontWeight:900,color:'#fff',fontFamily:"'Barlow Condensed',sans-serif" }}>{s.item_count}</div>
                  <div style={{ fontSize:11,color:'var(--text3)' }}>Items</div>
                </div>
                <div style={{ background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.15)',borderRadius:10,padding:'10px 12px' }}>
                  <div style={{ fontSize:18,fontWeight:900,color:'#fff',fontFamily:"'Barlow Condensed',sans-serif" }}>₹{(s.cart_total||0).toLocaleString()}</div>
                  <div style={{ fontSize:11,color:'var(--text3)' }}>Cart Value</div>
                </div>
              </div>

              {s.cart?.length>0&&(
                <div>
                  <div style={{ fontSize:11,color:'var(--text3)',letterSpacing:'1.5px',textTransform:'uppercase',fontWeight:700,marginBottom:8 }}>Cart Items</div>
                  {s.cart.slice(0,3).map((item,j)=>(
                    <div key={j} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:j<Math.min(s.cart.length,3)-1?'1px solid var(--border)':'none' }}>
                      <span style={{ fontSize:13,color:'#cbd5e1' }}>{item.name}</span>
                      <span style={{ fontSize:12,color:'var(--text3)' }}>×{item.quantity} · ₹{item.price}</span>
                    </div>
                  ))}
                  {s.cart.length>3&&<div style={{ fontSize:11,color:'var(--text3)',marginTop:6 }}>+{s.cart.length-3} more items</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {lastUpdate&&<div style={{ marginTop:16,color:'var(--text3)',fontSize:12,textAlign:'right' }}>Last updated {lastUpdate.toLocaleTimeString()}</div>}
      <style>{`@keyframes live{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:.6}}`}</style>
    </div>
  )
}

// ── PRODUCTS ──────────────────────────────────────────────
export function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm]         = useState({ barcode:'',name:'',brand:'',category:'',price:'',stock:'',available:true })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')

  const load = async()=>{
    try{ const r = await api.get('/api/admin/products'); setProducts(r.data.products||[]) }
    catch(e){ console.error(e) }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  const openAdd = ()=>{ setEditItem(null); setForm({ barcode:'',name:'',brand:'',category:'',price:'',stock:'',available:true }); setError(''); setModal(true) }
  const openEdit = p=>{ setEditItem(p); setForm({ barcode:p.barcode||'',name:p.name||'',brand:p.brand||'',category:p.category||'',price:p.price||'',stock:p.stock||'',available:p.available!==false }); setError(''); setModal(true) }

  const save = async e=>{
    e.preventDefault(); setSaving(true); setError('')
    try{
      if(editItem){ await api.put(`/api/admin/products/${editItem.store_product_id}`,form) }
      else{ await api.post('/api/admin/products',form) }
      setModal(false); load()
    }catch(e){ setError(e.response?.data?.error||'Failed') }
    finally{ setSaving(false) }
  }

  const del = async id=>{
    if(!confirm('Remove product from store?')) return
    try{ await api.delete(`/api/admin/products/${id}`); load() }
    catch(e){ console.error(e) }
  }

  const filtered = products.filter(p=>!search||p.name?.toLowerCase().includes(search.toLowerCase())||p.barcode?.includes(search))

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28 }} className="fu">
        <div>
          <h2 style={{ fontSize:28,fontWeight:900,color:'#fff',letterSpacing:'-1px',fontFamily:"'Barlow Condensed',sans-serif",marginBottom:4 }}>Products</h2>
          <p style={{ color:'var(--text3)',fontSize:14 }}>{products.length} products in your store</p>
        </div>
        <button className="btn" onClick={openAdd}>+ Add Product</button>
      </div>

      <div style={{ position:'relative',marginBottom:20,maxWidth:360 }}>
        <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text3)' }}>🔍</span>
        <input className="field" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or barcode..." style={{ paddingLeft:40 }}/>
      </div>

      {loading?<Loader/>:filtered.length===0?<Empty msg="No products. Add your first product." icon="📦"/>:(
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14 }}>
          {filtered.map((p,i)=>(
            <div key={p.store_product_id} className={`card fu d${Math.min(i%6+1,6)}`} style={{ padding:18 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14 }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:15,fontWeight:700,color:'#fff',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize:12,color:'var(--text3)' }}>{p.brand||'—'} · {p.category||'—'}</div>
                </div>
                <span className={`badge ${p.available!==false?'b-green':'b-red'}`}>{p.available!==false?'Active':'Off'}</span>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14 }}>
                {[['Price',`₹${p.price||0}`,'#3b82f6'],['Stock',p.stock||0,'#22c55e'],['Barcode',p.barcode?.slice(-6)||'—','#94a3b8']].map(([l,v,c])=>(
                  <div key={l} style={{ background:'rgba(255,255,255,.03)',borderRadius:8,padding:'8px 10px' }}>
                    <div style={{ fontSize:13,fontWeight:700,color:c,fontFamily:"'Barlow Condensed',sans-serif" }}>{v}</div>
                    <div style={{ fontSize:10,color:'var(--text3)',marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex',gap:8 }}>
                <button className="btn-outline" style={{ flex:1,fontSize:12,padding:'7px 12px' }} onClick={()=>openEdit(p)}>Edit</button>
                <button className="btn-danger" style={{ padding:'7px 12px',fontSize:12 }} onClick={()=>del(p.store_product_id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal&&(
        <div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,.8)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:'var(--bg3)',border:'1px solid rgba(59,130,246,.2)',borderRadius:18,padding:28,width:'100%',maxWidth:500,boxShadow:'0 20px 60px rgba(0,0,0,.6)',animation:'fadeUp .3s ease both' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
              <h3 style={{ color:'#fff',fontWeight:900,fontSize:20,fontFamily:"'Barlow Condensed',sans-serif" }}>{editItem?'Edit Product':'Add Product'}</h3>
              <button onClick={()=>setModal(false)} style={{ background:'none',border:'none',color:'var(--text3)',fontSize:20 }}>✕</button>
            </div>
            <form onSubmit={save}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
                {[['Barcode *','barcode','text','8901234567890',2],['Name *','name','text','Product name',2],['Brand','brand','text','Brand name'],['Category','category','text','Category'],['Price (₹) *','price','number','0.00'],['Stock','stock','number','0']].map(([label,key,type,placeholder,span])=>(
                  <div key={key} style={{ gridColumn:span?'1/-1':undefined }}>
                    <label style={{ display:'block',fontSize:11,fontWeight:700,color:'var(--text3)',marginBottom:7,letterSpacing:'1.5px',textTransform:'uppercase' }}>{label}</label>
                    <input className="field" type={type} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={placeholder} required={label.includes('*')}/>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginTop:14 }}>
                <input type="checkbox" id="avail" checked={form.available} onChange={e=>setForm({...form,available:e.target.checked})} style={{ width:16,height:16 }}/>
                <label htmlFor="avail" style={{ color:'var(--text2)',fontSize:14 }}>Available in store</label>
              </div>
              {error&&<div style={{ marginTop:12,padding:'10px 14px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:10,color:'#f87171',fontSize:13 }}>⚠ {error}</div>}
              <button type="submit" disabled={saving} className="btn" style={{ width:'100%',marginTop:20,padding:'14px',fontSize:15,opacity:saving?.6:1 }}>
                {saving?'Saving...':editItem?'Update Product':'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

// ── ANALYTICS ─────────────────────────────────────────────
export function Analytics() {
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const load = async()=>{
      try{ const r = await api.get('/api/admin/analytics'); setData(r.data) }
      catch(e){ console.error(e) }
      finally{ setLoading(false) }
    }
    load()
  },[])

  const TT = ({ active, payload, label }) => {
    if (!active||!payload?.length) return null
    return <div style={{ background:'#0d1533',border:'1px solid rgba(59,130,246,.3)',borderRadius:10,padding:'10px 14px' }}><div style={{ color:'#475569',fontSize:11,marginBottom:4 }}>{label}</div><div style={{ color:'#60a5fa',fontWeight:700 }}>₹{(payload[0]?.value||0).toLocaleString()}</div></div>
  }

  return (
    <div>
      <div style={{ marginBottom:28 }} className="fu">
        <h2 style={{ fontSize:28,fontWeight:900,color:'#fff',letterSpacing:'-1px',fontFamily:"'Barlow Condensed',sans-serif",marginBottom:4 }}>Analytics</h2>
        <p style={{ color:'var(--text3)',fontSize:14 }}>Your store's performance</p>
      </div>

      {loading?<Loader/>:(
        <>
          {/* Revenue chart */}
          <div className="card fu d1" style={{ padding:24,marginBottom:20 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
              <div>
                <h3 style={{ fontSize:18,fontWeight:900,color:'#fff',fontFamily:"'Barlow Condensed',sans-serif" }}>30-Day Revenue</h3>
                <p style={{ fontSize:12,color:'var(--text3)',marginTop:2 }}>Daily paid orders</p>
              </div>
              <span className="badge b-blue">30 Days</span>
            </div>
            {data?.revenue_chart?.length>0?(
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.revenue_chart}>
                  <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={.35}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false}/>
                  <XAxis dataKey="day" tick={{ fill:'#475569',fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#475569',fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`}/>
                  <Tooltip content={<TT/>}/>
                  <Area type="monotone" dataKey="rev" stroke="#3b82f6" strokeWidth={2.5} fill="url(#rg)"/>
                </AreaChart>
              </ResponsiveContainer>
            ):<Empty msg="No revenue data yet"/>}
          </div>

          {/* Top products */}
          <div className="card fu d2" style={{ overflow:'hidden' }}>
            <div style={{ padding:'20px 24px',borderBottom:'1px solid var(--border)' }}>
              <h3 style={{ fontSize:18,fontWeight:900,color:'#fff',fontFamily:"'Barlow Condensed',sans-serif" }}>Top Products 🔥</h3>
            </div>
            {!data?.top_products?.length?(
              <Empty msg="No product data yet"/>
            ):data.top_products.map((p,i)=>(
              <div key={i} className="trow" style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 24px',borderBottom:i<data.top_products.length-1?'1px solid var(--border)':'none' }}>
                <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                  <div style={{ width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${['#1d4ed8','#0891b2','#15803d','#9333ea','#c2410c'][i%5]},${['#3b82f6','#22d3ee','#4ade80','#c084fc','#fb923c'][i%5]})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,color:'#fff',fontFamily:"'Barlow Condensed',sans-serif" }}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                  </div>
                  <div>
                    <div style={{ fontSize:14,fontWeight:600,color:'#fff' }}>{p.name}</div>
                    <div style={{ fontSize:12,color:'var(--text3)' }}>{p.units} units sold</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:15,fontWeight:700,color:'#4ade80' }}>₹{(p.revenue||0).toLocaleString()}</div>
                  <div style={{ fontSize:11,color:'var(--text3)' }}>Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── QR CODE ───────────────────────────────────────────────
export function QRCode() {
  const [qr, setQr]         = useState(null)
  const [loading, setLoading] = useState(true)
  const { user }             = useAuth()

  useEffect(()=>{
    const load = async()=>{
      try{ const r = await api.get('/api/admin/store/qr'); setQr(r.data) }
      catch(e){ console.error(e) }
      finally{ setLoading(false) }
    }
    load()
  },[])

  return (
    <div>
      <div style={{ marginBottom:28 }} className="fu">
        <h2 style={{ fontSize:28,fontWeight:900,color:'#fff',letterSpacing:'-1px',fontFamily:"'Barlow Condensed',sans-serif",marginBottom:4 }}>Store QR Code</h2>
        <p style={{ color:'var(--text3)',fontSize:14 }}>Customers scan this to start shopping</p>
      </div>

      {loading?<Loader/>:(
        <div style={{ display:'grid',gridTemplateColumns:'auto 1fr',gap:24,alignItems:'start',maxWidth:800 }}>
          {/* QR Card */}
          <div className="card fu" style={{ padding:32,textAlign:'center' }}>
            <div style={{ background:'#fff',borderRadius:16,padding:20,display:'inline-block',marginBottom:20 }}>
              {qr?.qr_image?(
                <img src={qr.qr_image} alt="Store QR" style={{ width:220,height:220,display:'block' }}/>
              ):(
                <div style={{ width:220,height:220,display:'flex',alignItems:'center',justifyContent:'center',color:'#999',fontSize:14 }}>QR not available</div>
              )}
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:18,fontWeight:900,color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",marginBottom:4 }}>{qr?.store_name||user?.store?.name}</div>
              <div style={{ fontSize:12,color:'var(--text3)',fontFamily:'monospace',wordBreak:'break-all' }}>{qr?.qr_code_value}</div>
            </div>
            {qr?.qr_image&&(
              <a href={qr.qr_image} download={`${qr.store_name||'store'}-qr.png`}>
                <button className="btn" style={{ width:'100%',padding:'13px',fontSize:15 }}>⬇ Download QR PNG</button>
              </a>
            )}
          </div>

          {/* Instructions */}
          <div className="fu d2">
            <div className="card" style={{ padding:24,marginBottom:16 }}>
              <h3 style={{ fontSize:18,fontWeight:900,color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",marginBottom:16 }}>How To Use</h3>
              {[
                ['1','Print this QR code and place it at your store entrance','#3b82f6'],
                ['2','Customers open the Nivo app and tap "Scan Store QR"','#22c55e'],
                ['3','They scan products as they shop','#f97316'],
                ['4','Customers pay through the app','#8b5cf6'],
                ['5','They show the exit QR to your staff','#06b6d4'],
              ].map(([num,text,color])=>(
                <div key={num} style={{ display:'flex',gap:14,marginBottom:14 }}>
                  <div style={{ width:28,height:28,borderRadius:'50%',background:`rgba(${color==='#3b82f6'?'59,130,246':color==='#22c55e'?'34,197,94':color==='#f97316'?'249,115,22':color==='#8b5cf6'?'139,92,246':'6,182,212'},.15)`,border:`1px solid ${color}40`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,color,flexShrink:0,fontFamily:"'Barlow Condensed',sans-serif" }}>{num}</div>
                  <p style={{ color:'var(--text2)',fontSize:14,lineHeight:1.6,paddingTop:4 }}>{text}</p>
                </div>
              ))}
            </div>

            <div className="card-blue" style={{ padding:20 }}>
              <div style={{ fontSize:14,fontWeight:700,color:'#60a5fa',marginBottom:8 }}>💡 Pro Tip</div>
              <p style={{ color:'var(--text3)',fontSize:13,lineHeight:1.6 }}>
                Place your QR code at eye level near the entrance. Use a laminated A4 print for best durability. Replace if QR gets damaged.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── SETTINGS ──────────────────────────────────────────────
export function Settings() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name:'',address:'',phone:'' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  useEffect(()=>{
    const load = async()=>{
      try{ const r = await api.get('/api/admin/store'); const s = r.data.store||{}; setForm({ name:s.name||'',address:s.address||'',phone:s.phone||'' }) }
      catch(e){ console.error(e) }
      finally{ setLoading(false) }
    }
    load()
  },[])

  const save = async e=>{
    e.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try{ await api.put('/api/admin/store',form); setSuccess('Store updated successfully!') }
    catch(e){ setError(e.response?.data?.error||'Failed') }
    finally{ setSaving(false) }
  }

  return (
    <div style={{ maxWidth:600 }}>
      <div style={{ marginBottom:28 }} className="fu">
        <h2 style={{ fontSize:28,fontWeight:900,color:'#fff',letterSpacing:'-1px',fontFamily:"'Barlow Condensed',sans-serif",marginBottom:4 }}>Settings</h2>
        <p style={{ color:'var(--text3)',fontSize:14 }}>Manage your store profile</p>
      </div>

      {loading?<Loader/>:(
        <>
          {/* Account info */}
          <div className="card fu" style={{ padding:24,marginBottom:16 }}>
            <h3 style={{ fontSize:16,fontWeight:900,color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",marginBottom:16 }}>Account</h3>
            <div style={{ display:'flex',alignItems:'center',gap:16,padding:16,background:'rgba(59,130,246,.06)',border:'1px solid rgba(59,130,246,.15)',borderRadius:12 }}>
              <div style={{ width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:900,color:'#fff',fontFamily:"'Barlow Condensed',sans-serif" }}>{user?.phone?.slice(-2)}</div>
              <div>
                <div style={{ fontSize:16,fontWeight:700,color:'#fff' }}>+91 {user?.phone}</div>
                <span className="badge b-blue" style={{ marginTop:4 }}>Store Owner</span>
              </div>
            </div>
          </div>

          {/* Store details */}
          <div className="card fu d2" style={{ padding:24,marginBottom:16 }}>
            <h3 style={{ fontSize:16,fontWeight:900,color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",marginBottom:20 }}>Store Details</h3>
            <form onSubmit={save}>
              {[['Store Name *','name','text','Harri Hyperstore'],['Address','address','text','Sec 26, Chandigarh'],['Contact Phone','phone','tel','9800000000']].map(([label,key,type,placeholder])=>(
                <div key={key} style={{ marginBottom:16 }}>
                  <label style={{ display:'block',fontSize:11,fontWeight:700,color:'var(--text3)',marginBottom:8,letterSpacing:'1.5px',textTransform:'uppercase' }}>{label}</label>
                  <input className="field" type={type} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={placeholder} required={label.includes('*')}/>
                </div>
              ))}
              {success&&<div style={{ marginBottom:14,padding:'10px 14px',background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.25)',borderRadius:10,color:'#4ade80',fontSize:13 }}>✅ {success}</div>}
              {error&&<div style={{ marginBottom:14,padding:'10px 14px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.25)',borderRadius:10,color:'#f87171',fontSize:13 }}>⚠ {error}</div>}
              <button type="submit" disabled={saving} className="btn" style={{ padding:'13px 28px',fontSize:15,opacity:saving?.6:1 }}>
                {saving?'Saving...':'Save Changes'}
              </button>
            </form>
          </div>

          {/* Plan info */}
          <div className="card-blue fu d3" style={{ padding:24 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div>
                <h3 style={{ fontSize:16,fontWeight:900,color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",marginBottom:4 }}>Current Plan</h3>
                <p style={{ color:'var(--text3)',fontSize:13 }}>Upgrade for more orders per month</p>
              </div>
              <span className="badge b-blue">Basic</span>
            </div>
            <div style={{ marginTop:16,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10 }}>
              {[['Basic','₹999/mo','500 orders'],['Standard','₹1,999/mo','2000 orders'],['Premium','₹2,999/mo','Unlimited']].map(([name,price,limit])=>(
                <div key={name} style={{ padding:14,background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.15)',borderRadius:12,textAlign:'center' }}>
                  <div style={{ fontSize:14,fontWeight:900,color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",marginBottom:4 }}>{name}</div>
                  <div style={{ fontSize:13,color:'#60a5fa',fontWeight:600,marginBottom:4 }}>{price}</div>
                  <div style={{ fontSize:11,color:'var(--text3)' }}>{limit}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Default exports
export default Orders