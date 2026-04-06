import { useState, useEffect, useRef } from 'react'
import api from '../api'

const T={blue:'#3B56E8',blue2:'#2C44D4',blueSoft:'#5B7CFA',blueLight:'#EEF2FF',blueLight2:'#E0E7FF',bg:'#F0F3FF',white:'#FFFFFF',border:'#E0E7FF',border2:'#C7D2FE',dark:'#1A1A2E',dark2:'#2D3561',muted:'#6B7280',muted2:'#9CA3AF',green:'#10B981',greenBg:'#ECFDF5',greenBdr:'#A7F3D0',amber:'#F59E0B',amberBg:'#FFFBEB',amberBdr:'#FDE68A',red:'#EF4444',redBg:'#FEF2F2',redBdr:'#FECACA',shadow:'0 2px 12px rgba(59,86,232,0.07)',shadowBtn:'0 4px 14px rgba(59,86,232,0.35)',font:"'Plus Jakarta Sans',sans-serif"}
const FIELD={width:'100%',padding:'9px 12px',background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,fontSize:13,fontFamily:T.font,color:T.dark,outline:'none',transition:'all 0.2s'}
const LABEL={display:'block',fontSize:9,fontWeight:700,color:T.muted2,marginBottom:5,letterSpacing:'2px',textTransform:'uppercase'}

function parseCSV(text){const lines=text.trim().split('\n').filter(l=>l.trim());if(lines.length<2)return[];const headers=lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/\s+/g,'_').replace(/['"]/g,''));return lines.slice(1).map(line=>{const vals=line.split(',').map(v=>v.trim().replace(/^"|"$/g,''));const obj={};headers.forEach((h,i)=>{obj[h]=vals[i]||''});return obj}).filter(r=>r.barcode||r.name)}
function mapRow(row){return{barcode:row.barcode||row.ean||row.upc||row.code||'',name:row.name||row.product_name||row.product||'',brand:row.brand||row.brand_name||'',category:row.category||row.type||'',price:parseFloat(row.price||row.mrp||row.selling_price||0),stock_quantity:parseInt(row.stock_quantity||row.stock||row.quantity||row.qty||0),max_stock:parseInt(row.max_stock||row.max||row.capacity||row.stock||row.quantity||row.qty||100),available:true}}

export default function Products(){
  const [products,setProducts]=useState([])
  const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState(false)
  const [editItem,setEditItem]=useState(null)
  // ── FIX: added max_stock to form state ──
  const [form,setForm]=useState({barcode:'',name:'',brand:'',category:'',price:'',in_stock:true,stock_quantity:'',max_stock:''})
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [search,setSearch]=useState('')
  const [catFilter,setCatFilter]=useState('all')
  const [viewMode,setViewMode]=useState('grid')
  const [sortBy,setSortBy]=useState('name')
  const [importModal,setImportModal]=useState(false)
  const [importRows,setImportRows]=useState([])
  const [importing,setImporting]=useState(false)
  const [importProgress,setImportProgress]=useState(0)
  const [importDone,setImportDone]=useState(false)
  const [importError,setImportError]=useState('')
  const [dragOver,setDragOver]=useState(false)
  const [fileName,setFileName]=useState('')
  const fileRef=useRef(null)

  const load=async()=>{try{const r=await api.get('/api/admin/products');setProducts(r.data.products||[])}catch(e){console.error(e)}finally{setLoading(false)}}
  useEffect(()=>{load()},[])

  const processFile=file=>{if(!file)return;setFileName(file.name);const reader=new FileReader();reader.onload=evt=>{const rows=parseCSV(evt.target.result).map(mapRow).filter(r=>r.name);setImportRows(rows);setImportDone(false);setImportProgress(0);setImportError('');setImportModal(true)};reader.readAsText(file)}
  const openAdd=()=>{setEditItem(null);setForm({barcode:'',name:'',brand:'',category:'',price:'',in_stock:true,stock_quantity:'',max_stock:''});setError('');setModal(true)}
  // ── FIX: populate max_stock when editing ──
  const openEdit=p=>{setEditItem(p);setForm({barcode:p.barcode||'',name:p.name||'',brand:p.brand||'',category:p.category||'',price:p.price||'',in_stock:p.in_stock!==false,stock_quantity:p.stock_quantity!=null?p.stock_quantity:'',max_stock:p.max_stock!=null?p.max_stock:''});setError('');setModal(true)}

  const save=async e=>{e.preventDefault();setSaving(true);setError('');try{if(editItem)await api.put(`/api/admin/products/${editItem.store_product_id}`,form);else await api.post('/api/admin/products',form);setModal(false);load()}catch(e){setError(e.response?.data?.error||'Failed')}finally{setSaving(false)}}
  const del=async id=>{if(!confirm('Remove product?'))return;try{await api.delete(`/api/admin/products/${id}`);load()}catch(e){console.error(e)}}

  const runImport=async()=>{
    setImporting(true);setImportProgress(0);setImportError('')
    let done=0;const failed=[]
    const BATCH=5
    for(let i=0;i<importRows.length;i+=BATCH){
      const batch=importRows.slice(i,i+BATCH)
      const results=await Promise.allSettled(batch.map(row=>api.post('/api/admin/products',row)))
      results.forEach((r,j)=>{if(r.status==='fulfilled')done++;else failed.push(batch[j].name)})
      setImportProgress(Math.round(((i+BATCH)/importRows.length)*100))
    }
    setImporting(false);setImportDone(true)
    if(failed.length)setImportError(`${failed.length} failed: ${failed.slice(0,3).join(', ')}`)
    load()
  }

  // ── FIX: sample CSV now includes max_stock column ──
  const downloadSample=()=>{const csv=`barcode,name,brand,category,price,stock_quantity,max_stock\n8901234567890,Maggi Noodles,Nestle,Noodles,14,80,100\n8902345678901,Parle-G,Parle,Biscuits,10,150,200`;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='nivo-sample.csv';a.click()}

  const categories=['all',...new Set(products.map(p=>p.category).filter(Boolean))]
  const filtered=products.filter(p=>catFilter==='all'||p.category===catFilter).filter(p=>!search||p.name?.toLowerCase().includes(search.toLowerCase())||p.barcode?.includes(search)||p.brand?.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sortBy==='price'?(a.price||0)-(b.price||0):sortBy==='category'?(a.category||'').localeCompare(b.category||''):(a.name||'').localeCompare(b.name||''))
  const activeCount=products.filter(p=>p.in_stock!==false).length
  const avgPrice=products.length?(products.reduce((s,p)=>s+(p.price||0),0)/products.length).toFixed(0):0

  // Stock level helpers for card display
  const stockColor=p=>{
    if(p.stock_quantity==null) return T.muted2
    if(p.stock_quantity===0) return T.red
    if(p.max_stock&&p.stock_quantity<=p.max_stock*0.25) return T.amber
    return T.green
  }
  const stockBg=p=>{
    if(p.stock_quantity==null) return T.bg
    if(p.stock_quantity===0) return T.redBg
    if(p.max_stock&&p.stock_quantity<=p.max_stock*0.25) return T.amberBg
    return T.greenBg
  }
  const stockBdr=p=>{
    if(p.stock_quantity==null) return T.border
    if(p.stock_quantity===0) return T.redBdr
    if(p.max_stock&&p.stock_quantity<=p.max_stock*0.25) return T.amberBdr
    return T.greenBdr
  }

  return(<div style={{fontFamily:T.font,color:T.dark}}>
    <style>{`@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes mi{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}@keyframes spin{to{transform:rotate(360deg)}}.pc:hover{box-shadow:0 6px 24px rgba(59,86,232,0.12)!important;transform:translateY(-1px)}.pc{transition:all 0.2s}.inp:focus{border-color:${T.blue}!important;box-shadow:0 0 0 3px ${T.blueLight}!important}`}</style>

    <div style={{marginBottom:16,paddingBottom:16,borderBottom:`1.5px solid ${T.border}`,animation:'fu 0.4s ease both'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:10}}>
        <div><div style={{fontSize:9,fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:T.muted2,marginBottom:4}}>Inventory</div><h1 style={{fontSize:26,fontWeight:800,color:T.dark,letterSpacing:'-0.5px',margin:0}}>Products</h1><p style={{fontSize:12,color:T.muted,margin:'2px 0 0'}}>{products.length} products in your store</p></div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={downloadSample} style={{padding:'8px 14px',background:T.white,border:`1.5px solid ${T.border}`,borderRadius:9,color:T.muted,fontSize:12,fontWeight:600,fontFamily:T.font,cursor:'pointer'}}>⬇ Sample CSV</button>
          <button onClick={()=>fileRef.current.click()} style={{padding:'8px 14px',background:T.blueLight,border:`1.5px solid ${T.blueLight2}`,borderRadius:9,color:T.blue,fontSize:12,fontWeight:600,fontFamily:T.font,cursor:'pointer'}}>⬆ Import CSV</button>
          <button onClick={openAdd} style={{padding:'8px 16px',background:`linear-gradient(135deg,${T.blue},${T.blue2})`,border:'none',borderRadius:9,color:'#fff',fontSize:13,fontWeight:700,fontFamily:T.font,cursor:'pointer',boxShadow:T.shadowBtn}}>+ Add Product</button>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={e=>{processFile(e.target.files[0]);e.target.value=''}} style={{display:'none'}}/>
        </div>
      </div>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16,animation:'fu 0.4s ease 0.05s both'}}>
      {[{label:'Total',value:products.length,color:T.blue,bg:T.blueLight,icon:'📦'},{label:'Active',value:activeCount,color:T.green,bg:T.greenBg,icon:'✅'},{label:'Categories',value:new Set(products.map(p=>p.category).filter(Boolean)).size,color:'#8B5CF6',bg:'#F5F3FF',icon:'🏷'},{label:'Avg Price',value:`₹${avgPrice}`,color:T.amber,bg:T.amberBg,icon:'💰'}].map((s,i)=>(
        <div key={i} style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:12,padding:'12px 14px',boxShadow:T.shadow,display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{s.icon}</div>
          <div><div style={{fontSize:18,fontWeight:800,color:s.color,letterSpacing:'-0.5px',lineHeight:1}}>{s.value}</div><div style={{fontSize:10,color:T.muted2,marginTop:2}}>{s.label}</div></div>
        </div>
      ))}
    </div>

    <div onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={e=>{e.preventDefault();setDragOver(false)}} onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f&&(f.name.endsWith('.csv')||f.name.endsWith('.txt')))processFile(f)}} onClick={()=>fileRef.current.click()} style={{marginBottom:16,border:`2px dashed ${dragOver?T.blue:T.border2}`,borderRadius:12,padding:'18px 20px',textAlign:'center',cursor:'pointer',background:dragOver?T.blueLight:T.white,transition:'all 0.2s',animation:'fu 0.4s ease 0.1s both'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
        <div style={{width:36,height:36,borderRadius:10,background:dragOver?T.blue:T.blueLight,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dragOver?'#fff':T.blue} strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <div style={{textAlign:'left'}}><div style={{fontSize:13,fontWeight:700,color:dragOver?T.blue:T.dark}}>{dragOver?'Drop CSV here!':'Drag & Drop CSV to bulk import'}</div><div style={{fontSize:11,color:T.muted2}}>or click to browse · barcode, name, brand, category, price, stock_quantity, max_stock</div></div>
      </div>
    </div>

    <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center',animation:'fu 0.4s ease 0.15s both'}}>
      <div style={{position:'relative',flex:1,minWidth:220}}><span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:13,color:T.muted2}}>🔍</span><input className="inp" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, brand or barcode..." style={{...FIELD,paddingLeft:34,fontSize:13}}/></div>
      <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{padding:'9px 12px',background:T.white,border:`1.5px solid ${T.border}`,borderRadius:9,fontSize:12,fontFamily:T.font,color:T.dark,cursor:'pointer',outline:'none'}}>{categories.map(c=><option key={c} value={c}>{c==='all'?'All Categories':c}</option>)}</select>
      <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:'9px 12px',background:T.white,border:`1.5px solid ${T.border}`,borderRadius:9,fontSize:12,fontFamily:T.font,color:T.dark,cursor:'pointer',outline:'none'}}><option value="name">Sort: Name</option><option value="price">Sort: Price</option><option value="category">Sort: Category</option></select>
      <div style={{display:'flex',background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,padding:3,gap:2}}>
        {[['grid','▦'],['list','≡']].map(([mode,icon])=><button key={mode} onClick={()=>setViewMode(mode)} style={{width:30,height:30,borderRadius:7,border:'none',background:viewMode===mode?T.blue:'transparent',color:viewMode===mode?'#fff':T.muted,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}>{icon}</button>)}
      </div>
      <span style={{fontSize:11,color:T.muted2,flexShrink:0}}>{filtered.length} shown</span>
    </div>

    {loading?<div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}><div style={{width:22,height:22,border:`2px solid ${T.blueLight2}`,borderTopColor:T.blue,borderRadius:'50%',animation:'spin .8s linear infinite'}}/></div>
    :filtered.length===0?<div style={{textAlign:'center',padding:'60px 0',animation:'fu 0.4s ease both'}}><div style={{fontSize:44,marginBottom:12}}>📦</div><div style={{fontSize:18,fontWeight:800,color:T.dark,marginBottom:6}}>{search||catFilter!=='all'?'No products match':'No Products Yet'}</div><div style={{fontSize:13,color:T.muted,marginBottom:16}}>{search||catFilter!=='all'?'Try a different search or filter':'Drag a CSV file above or add products manually'}</div>{!search&&catFilter==='all'&&<button onClick={openAdd} style={{padding:'9px 20px',background:`linear-gradient(135deg,${T.blue},${T.blue2})`,border:'none',borderRadius:9,color:'#fff',fontSize:13,fontWeight:700,fontFamily:T.font,cursor:'pointer',boxShadow:T.shadowBtn}}>+ Add Product</button>}</div>
    :viewMode==='grid'?(
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12,animation:'fu 0.4s ease 0.2s both'}}>
        {filtered.map(p=>(
          <div key={p.store_product_id} className="pc" style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:14,padding:16,boxShadow:T.shadow,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${T.blue},${T.blueSoft})`,opacity:0.6}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
              <div style={{flex:1,minWidth:0,paddingRight:8}}><div style={{fontSize:13,fontWeight:700,color:T.dark,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div><div style={{fontSize:11,color:T.muted2}}>{p.brand||'—'}</div></div>
              <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:20,flexShrink:0,background:p.in_stock!==false?T.greenBg:T.redBg,color:p.in_stock!==false?T.green:T.red,border:`1px solid ${p.in_stock!==false?T.greenBdr:T.redBdr}`}}>{p.in_stock!==false?'In Stock':'Out'}</span>
            </div>
            {p.category&&<span style={{display:'inline-block',fontSize:9,fontWeight:600,padding:'2px 8px',borderRadius:20,background:T.blueLight,color:T.blue,border:`1px solid ${T.blueLight2}`,marginBottom:10}}>{p.category}</span>}
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              <div style={{flex:1,background:T.blueLight,border:`1px solid ${T.blueLight2}`,borderRadius:8,padding:'7px 10px'}}>
                <div style={{fontSize:16,fontWeight:800,color:T.blue}}>₹{p.price||0}</div>
                <div style={{fontSize:9,color:T.muted2,marginTop:1}}>Price</div>
              </div>
              {/* ── FIX: show qty/max when both set, otherwise barcode ── */}
              {p.stock_quantity!=null && p.max_stock!=null ? (
                <div style={{flex:1,background:stockBg(p),border:`1px solid ${stockBdr(p)}`,borderRadius:8,padding:'7px 10px'}}>
                  <div style={{fontSize:15,fontWeight:800,color:stockColor(p),fontFamily:'monospace'}}>{p.stock_quantity}<span style={{fontSize:10,fontWeight:500,color:T.muted2}}>/{p.max_stock}</span></div>
                  <div style={{fontSize:9,color:T.muted2,marginTop:1}}>Stock</div>
                  {/* Mini progress bar */}
                  <div style={{height:3,background:'rgba(0,0,0,0.08)',borderRadius:2,marginTop:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${Math.min(100,(p.stock_quantity/Math.max(p.max_stock,1))*100)}%`,background:stockColor(p),borderRadius:2}}/>
                  </div>
                </div>
              ) : p.stock_quantity!=null ? (
                <div style={{flex:1,background:stockBg(p),border:`1px solid ${stockBdr(p)}`,borderRadius:8,padding:'7px 10px'}}>
                  <div style={{fontSize:15,fontWeight:800,color:stockColor(p)}}>{p.stock_quantity}</div>
                  <div style={{fontSize:9,color:T.muted2,marginTop:1}}>Qty (set max)</div>
                </div>
              ) : (
                <div style={{flex:1,background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,padding:'7px 10px'}}>
                  <div style={{fontSize:11,fontWeight:600,color:T.muted,fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{String(p.barcode||'').slice(-8)||'—'}</div>
                  <div style={{fontSize:9,color:T.muted2,marginTop:1}}>Barcode</div>
                </div>
              )}
            </div>
            <div style={{display:'flex',gap:7}}>
              <button onClick={()=>openEdit(p)} style={{flex:1,padding:'7px',background:T.blueLight,border:`1px solid ${T.blueLight2}`,borderRadius:8,color:T.blue,fontSize:12,fontWeight:600,fontFamily:T.font,cursor:'pointer',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.background=T.blue;e.currentTarget.style.color='#fff'}} onMouseLeave={e=>{e.currentTarget.style.background=T.blueLight;e.currentTarget.style.color=T.blue}}>Edit</button>
              <button onClick={()=>del(p.store_product_id)} style={{padding:'7px 12px',background:T.redBg,border:`1px solid ${T.redBdr}`,borderRadius:8,color:T.red,fontSize:12,fontWeight:600,fontFamily:T.font,cursor:'pointer',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.background=T.red;e.currentTarget.style.color='#fff'}} onMouseLeave={e=>{e.currentTarget.style.background=T.redBg;e.currentTarget.style.color=T.red}}>✕</button>
            </div>
          </div>
        ))}
      </div>
    ):(
      <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:14,overflow:'hidden',boxShadow:T.shadow,animation:'fu 0.4s ease 0.2s both'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 100px',padding:'10px 16px',background:T.bg,borderBottom:`1px solid ${T.border}`,fontSize:9,fontWeight:700,color:T.muted2,letterSpacing:'2px',textTransform:'uppercase'}}><span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Barcode</span><span>Actions</span></div>
        {filtered.map((p,i)=>(
          <div key={p.store_product_id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 100px',padding:'11px 16px',borderBottom:i<filtered.length-1?`1px solid ${T.border}`:'none',alignItems:'center',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background=T.bg} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div><div style={{fontSize:13,fontWeight:600,color:T.dark}}>{p.name}</div><div style={{fontSize:11,color:T.muted2,marginTop:1}}>{p.brand||'—'}</div></div>
            <span style={{fontSize:11,fontWeight:600,color:T.blue,background:T.blueLight,border:`1px solid ${T.blueLight2}`,padding:'2px 8px',borderRadius:20,width:'fit-content'}}>{p.category||'—'}</span>
            <span style={{fontSize:14,fontWeight:700,color:T.dark}}>₹{p.price||0}</span>
            {/* ── FIX: show qty/max in list view too ── */}
            <span style={{fontSize:12,fontWeight:700,color:stockColor(p),fontFamily:'monospace'}}>
              {p.stock_quantity!=null&&p.max_stock!=null?`${p.stock_quantity}/${p.max_stock}`:p.stock_quantity!=null?p.stock_quantity:'—'}
            </span>
            <span style={{fontSize:11,color:T.muted2,fontFamily:'monospace'}}>{String(p.barcode||'').slice(-8)||'—'}</span>
            <div style={{display:'flex',gap:6}}><button onClick={()=>openEdit(p)} style={{padding:'5px 10px',background:T.blueLight,border:`1px solid ${T.blueLight2}`,borderRadius:7,color:T.blue,fontSize:11,fontWeight:600,fontFamily:T.font,cursor:'pointer'}}>Edit</button><button onClick={()=>del(p.store_product_id)} style={{padding:'5px 8px',background:T.redBg,border:`1px solid ${T.redBdr}`,borderRadius:7,color:T.red,fontSize:11,cursor:'pointer'}}>✕</button></div>
          </div>
        ))}
      </div>
    )}

    {/* ── Add/Edit Modal — now includes max_stock field ── */}
    {modal&&<div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(26,31,78,0.4)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
      <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:20,padding:26,width:'100%',maxWidth:500,boxShadow:'0 20px 60px rgba(59,86,232,0.18)',animation:'mi 0.25s ease both',fontFamily:T.font}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}><h3 style={{fontSize:18,fontWeight:800,color:T.dark}}>{editItem?'Edit Product':'Add Product'}</h3><button onClick={()=>setModal(false)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,width:28,height:28,cursor:'pointer',color:T.muted,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button></div>
        <form onSubmit={save}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[
              ['BARCODE *','barcode','text','8901234567890',2],
              ['NAME *','name','text','Product name',2],
              ['BRAND','brand','text','Brand name',1],
              ['CATEGORY','category','text','Category',1],
              ['PRICE (₹) *','price','number','0',1],
            ].map(([lbl,key,type,ph,span])=>(
              <div key={key} style={{gridColumn:span===2?'1/-1':undefined}}>
                <label style={LABEL}>{lbl}</label>
                <input className="inp" type={type} value={form[key]??''} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={ph} required={lbl.includes('*')} min={type==='number'?0:undefined} style={FIELD}/>
              </div>
            ))}
            {/* ── FIX: stock_quantity and max_stock side by side ── */}
            <div>
              <label style={LABEL}>STOCK QTY (current)</label>
              <input className="inp" type="number" value={form.stock_quantity??''} onChange={e=>setForm({...form,stock_quantity:e.target.value})} placeholder="e.g. 45" min={0} style={FIELD}/>
            </div>
            <div>
              <label style={LABEL}>MAX STOCK (capacity)</label>
              <input className="inp" type="number" value={form.max_stock??''} onChange={e=>setForm({...form,max_stock:e.target.value})} placeholder="e.g. 100" min={1} style={FIELD}/>
            </div>
          </div>

          {/* Stock preview */}
          {form.stock_quantity!==''&&form.max_stock!==''&&Number(form.max_stock)>0&&(
            <div style={{marginTop:10,padding:'10px 14px',background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:12,color:T.muted,fontWeight:600}}>Preview:</span>
              <span style={{fontSize:14,fontWeight:800,color:Number(form.stock_quantity)===0?T.red:Number(form.stock_quantity)<=Number(form.max_stock)*0.25?T.amber:T.green,fontFamily:'monospace'}}>
                {form.stock_quantity} / {form.max_stock}
              </span>
              <div style={{flex:1,height:6,background:'rgba(0,0,0,0.08)',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${Math.min(100,(Number(form.stock_quantity)/Number(form.max_stock))*100)}%`,background:Number(form.stock_quantity)===0?T.red:Number(form.stock_quantity)<=Number(form.max_stock)*0.25?T.amber:T.green,borderRadius:3}}/>
              </div>
              <span style={{fontSize:11,color:T.muted2}}>{Math.round((Number(form.stock_quantity)/Number(form.max_stock))*100)}%</span>
            </div>
          )}

          <div style={{display:'flex',alignItems:'center',gap:8,marginTop:12}}><input type="checkbox" id="ins" checked={form.in_stock} onChange={e=>setForm({...form,in_stock:e.target.checked})} style={{width:15,height:15,accentColor:T.blue}}/><label htmlFor="ins" style={{color:T.dark2,fontSize:13,cursor:'pointer'}}>In stock</label></div>
          {error&&<div style={{marginTop:10,padding:'8px 12px',background:T.redBg,border:`1px solid ${T.redBdr}`,borderRadius:8,color:T.red,fontSize:12}}>⚠ {error}</div>}
          <button type="submit" disabled={saving} style={{width:'100%',marginTop:16,padding:'11px',background:saving?T.blueLight:`linear-gradient(135deg,${T.blue},${T.blue2})`,border:'none',borderRadius:10,color:saving?T.muted:'#fff',fontSize:14,fontWeight:700,fontFamily:T.font,cursor:saving?'not-allowed':'pointer',boxShadow:saving?'none':T.shadowBtn}}>{saving?'Saving…':editItem?'Update Product':'Add Product'}</button>
        </form>
      </div>
    </div>}

    {importModal&&<div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(26,31,78,0.4)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={e=>e.target===e.currentTarget&&!importing&&setImportModal(false)}>
      <div style={{background:T.white,border:`1.5px solid ${T.border}`,borderRadius:20,padding:26,width:'100%',maxWidth:640,maxHeight:'85vh',overflow:'auto',boxShadow:'0 20px 60px rgba(59,86,232,0.18)',animation:'mi 0.25s ease both',fontFamily:T.font}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}><h3 style={{fontSize:18,fontWeight:800,color:T.dark}}>Import Preview</h3>{!importing&&<button onClick={()=>setImportModal(false)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,width:28,height:28,cursor:'pointer',color:T.muted,fontSize:14}}>✕</button>}</div>
        <p style={{fontSize:12,color:T.muted2,marginBottom:16}}>📁 {fileName}</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
          {[['Found',importRows.length,T.blue,T.blueLight],['Ready',importRows.filter(r=>r.barcode&&r.name&&r.price>0).length,T.green,T.greenBg],['Issues',importRows.filter(r=>!r.barcode||!r.name||!r.price).length,T.amber,T.amberBg]].map(([l,v,c,bg])=>(
            <div key={l} style={{background:bg,borderRadius:10,padding:'10px 14px',textAlign:'center'}}><div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div><div style={{fontSize:10,color:T.muted2,marginTop:2}}>{l}</div></div>
          ))}
        </div>
        <div style={{background:T.bg,borderRadius:10,overflow:'hidden',marginBottom:14,border:`1px solid ${T.border}`}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1fr',padding:'8px 14px',background:T.blueLight,fontSize:9,fontWeight:700,color:T.muted2,letterSpacing:'2px',textTransform:'uppercase'}}><span>Name</span><span>Brand/Cat</span><span>Price</span><span>Stock</span></div>
          <div style={{maxHeight:200,overflow:'auto'}}>
            {importRows.slice(0,100).map((row,i)=>{const valid=row.barcode&&row.name&&row.price>0;return(
              <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1fr',padding:'8px 14px',borderBottom:i<importRows.length-1?`1px solid ${T.border}`:'none',background:valid?'transparent':T.amberBg,alignItems:'center'}}>
                <span style={{fontSize:12,color:T.dark,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{!valid&&<span style={{color:T.amber,marginRight:4}}>⚠</span>}{row.name||'—'}</span>
                <span style={{fontSize:11,color:T.muted2}}>{row.brand||'—'}/{row.category||'—'}</span>
                <span style={{fontSize:12,fontWeight:700,color:T.green}}>₹{row.price||0}</span>
                {/* ── FIX: show qty/max in import preview ── */}
                <span style={{fontSize:11,color:T.muted2,fontFamily:'monospace'}}>{row.stock_quantity!=null?`${row.stock_quantity}/${row.max_stock||'?'}`:'—'}</span>
              </div>
            )})}
          </div>
        </div>
        {importing&&<div style={{marginBottom:14}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{fontSize:12,color:T.dark,fontWeight:600}}>Importing…</span><span style={{fontSize:12,color:T.blue,fontWeight:700}}>{importProgress}%</span></div><div style={{height:6,background:T.blueLight,borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:`${importProgress}%`,background:`linear-gradient(90deg,${T.blue},${T.blueSoft})`,borderRadius:4,transition:'width .3s'}}/></div></div>}
        {importDone&&<div style={{marginBottom:14,padding:'10px 14px',background:T.greenBg,border:`1px solid ${T.greenBdr}`,borderRadius:10,color:T.green,fontSize:13,fontWeight:600}}>✅ Import complete! {importRows.length} products.{importError&&<div style={{color:T.amber,fontWeight:400,fontSize:12,marginTop:3}}>{importError}</div>}</div>}
        <div style={{display:'flex',gap:10}}>
          {!importDone?<><button onClick={()=>setImportModal(false)} disabled={importing} style={{flex:1,padding:'10px',background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:9,color:T.muted,fontSize:13,fontWeight:600,fontFamily:T.font,cursor:'pointer'}}>Cancel</button><button onClick={runImport} disabled={importing||!importRows.length} style={{flex:2,padding:'10px',background:importing?T.blueLight:`linear-gradient(135deg,${T.blue},${T.blue2})`,border:'none',borderRadius:9,color:importing?T.muted:'#fff',fontSize:13,fontWeight:700,fontFamily:T.font,cursor:importing?'not-allowed':'pointer',boxShadow:importing?'none':T.shadowBtn}}>{importing?`Importing ${importProgress}%…`:`⬆ Import ${importRows.length} Products`}</button></>:<button onClick={()=>setImportModal(false)} style={{flex:1,padding:'10px',background:`linear-gradient(135deg,${T.blue},${T.blue2})`,border:'none',borderRadius:9,color:'#fff',fontSize:13,fontWeight:700,fontFamily:T.font,cursor:'pointer'}}>Done ✓</button>}
        </div>
      </div>
    </div>}
  </div>)
}