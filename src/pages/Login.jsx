import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api'
import * as THREE from 'three'

export default function Login({ onLoginSuccess }) {
  const { login } = useAuth()

  // ── Login state ──
  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [fieldErrors, setFieldErrors] = useState({ phone: '', password: '' })
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  // ── Forgot password state ──
  const [fpOpen, setFpOpen]       = useState(false)   // modal open
  const [fpStep, setFpStep]       = useState(1)       // 1=phone, 2=otp, 3=newpass
  const [fpPhone, setFpPhone]     = useState('')
  const [fpOtp, setFpOtp]         = useState('')
  const [fpNewPass, setFpNewPass] = useState('')
  const [fpConfirm, setFpConfirm] = useState('')
  const [fpShowNew, setFpShowNew] = useState(false)
  const [fpError, setFpError]     = useState('')
  const [fpSuccess, setFpSuccess] = useState('')
  const [fpLoading, setFpLoading] = useState(false)
  const [fpResendTimer, setFpResendTimer] = useState(0)

  const canvasRef    = useRef(null)
  const containerRef = useRef(null)
  const timerRef     = useRef(null)

  // ── Resend countdown ──
  useEffect(() => {
    if (fpResendTimer > 0) {
      timerRef.current = setTimeout(() => setFpResendTimer(t => t - 1), 1000)
    }
    return () => clearTimeout(timerRef.current)
  }, [fpResendTimer])

  // ── Open / close modal ──
  const openFp = () => {
    setFpOpen(true); setFpStep(1); setFpPhone(''); setFpOtp('')
    setFpNewPass(''); setFpConfirm(''); setFpError(''); setFpSuccess(''); setFpResendTimer(0)
  }
  const closeFp = () => { setFpOpen(false) }

  // ── Step 1: Send OTP ──
  const sendOtp = async () => {
    if (!fpPhone || fpPhone.length < 10) { setFpError('Enter a valid 10-digit phone number.'); return }
    setFpLoading(true); setFpError(''); setFpSuccess('')
    try {
      await api.post('/api/admin/forgot-password', { phone: fpPhone })
      setFpStep(2)
      setFpResendTimer(60)
      setFpSuccess('OTP sent to +91 ' + fpPhone)
    } catch (e) {
      setFpError(e.response?.data?.error || 'Failed to send OTP.')
    } finally { setFpLoading(false) }
  }

  // ── Step 2: Verify OTP ──
  const verifyOtp = async () => {
    if (!fpOtp || fpOtp.length !== 6) { setFpError('Enter the 6-digit OTP.'); return }
    setFpLoading(true); setFpError(''); setFpSuccess('')
    try {
      await api.post('/api/admin/verify-otp', { phone: fpPhone, otp: fpOtp })
      setFpStep(3)
      setFpSuccess('')
    } catch (e) {
      setFpError(e.response?.data?.error || 'Invalid OTP.')
    } finally { setFpLoading(false) }
  }

  // ── Step 3: Reset password ──
  const resetPassword = async () => {
    if (!fpNewPass || fpNewPass.length < 6) { setFpError('Password must be at least 6 characters.'); return }
    if (fpNewPass !== fpConfirm) { setFpError('Passwords do not match.'); return }
    setFpLoading(true); setFpError(''); setFpSuccess('')
    try {
      await api.post('/api/admin/reset-password', { phone: fpPhone, otp: fpOtp, newPassword: fpNewPass })
      setFpSuccess('Password reset successfully! You can now login.')
      setTimeout(() => {
        closeFp()
        setPhone(fpPhone)
      }, 2000)
    } catch (e) {
      setFpError(e.response?.data?.error || 'Failed to reset password.')
    } finally { setFpLoading(false) }
  }

  // ── Resend OTP ──
  const resendOtp = async () => {
    if (fpResendTimer > 0) return
    setFpLoading(true); setFpError(''); setFpSuccess('')
    try {
      await api.post('/api/admin/forgot-password', { phone: fpPhone })
      setFpResendTimer(60)
      setFpSuccess('New OTP sent.')
    } catch (e) {
      setFpError(e.response?.data?.error || 'Failed to resend OTP.')
    } finally { setFpLoading(false) }
  }

  // ── Three.js ──
  useEffect(() => {
    const container = containerRef.current
    const canvas    = canvasRef.current
    if (!container || !canvas) return
    const W = container.offsetWidth, H = container.offsetHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100)
    camera.position.set(0, 0, 8)

    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(4, 6, 6); scene.add(dir)
    const pt1 = new THREE.PointLight(0xaaccff, 1.4, 25)
    pt1.position.set(-3, 4, 5); scene.add(pt1)
    const pt2 = new THREE.PointLight(0x88ddff, 0.8, 20)
    pt2.position.set(4, -2, 4); scene.add(pt2)

    const mat = (color, opacity = 0.85, shininess = 140) =>
      new THREE.MeshPhongMaterial({ color, transparent: true, opacity, shininess })

    const bar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 3.0, 6), mat(0xd0d8e8, 0.82))
    bar1.position.set(-0.8, 0.4, 0.6); bar1.rotation.y = Math.PI / 6; scene.add(bar1)
    const bar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.2, 6), mat(0xb0c4e0, 0.72))
    bar2.position.set(-0.2, 0.6, 0.3); bar2.rotation.y = Math.PI / 4; scene.add(bar2)
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 24), mat(0xd8e4f2, 0.88))
    knob.position.set(-0.8, 1.92, 0.6); scene.add(knob)
    const tealDot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 24), mat(0x00e5ff, 0.9, 220))
    tealDot.position.set(1.2, 1.5, 0.5); scene.add(tealDot)
    const tealDot2 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 20), mat(0x00d4e8, 0.8, 200))
    tealDot2.position.set(0.3, 0.8, 0.8); scene.add(tealDot2)
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), mat(0x4488cc, 0.65))
    cube.position.set(1.5, 0.2, 0.2); cube.rotation.set(0.5, 0.8, 0.3); scene.add(cube)
    const cube2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), mat(0x3377bb, 0.60))
    cube2.position.set(1.7, -0.6, 0.0); cube2.rotation.set(0.3, 1.1, 0.5); scene.add(cube2)
    const bigSphere = new THREE.Mesh(new THREE.SphereGeometry(0.72, 40, 40), mat(0x00ccee, 0.58, 200))
    bigSphere.position.set(0.5, -1.5, 0.4); scene.add(bigSphere)
    const arc = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.045, 16, 100, Math.PI), mat(0xffffff, 0.50))
    arc.position.set(0.6, -1.7, -0.1); arc.rotation.x = Math.PI / 2; scene.add(arc)
    const slab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 0.36), mat(0xc8d8f0, 0.45))
    slab.position.set(0, -1.9, 0); slab.rotation.y = 0.1; scene.add(slab)

    let mx = 0, my = 0
    const onMouse = e => {
      const r = container.getBoundingClientRect()
      mx = ((e.clientX - r.left) / W - 0.5) * 2
      my = -((e.clientY - r.top) / H - 0.5) * 2
    }
    container.addEventListener('mousemove', onMouse)

    let frame, t = 0
    const animate = () => {
      frame = requestAnimationFrame(animate); t += 0.007
      bar1.rotation.y = Math.PI / 6 + Math.sin(t * 0.4) * 0.06
      bar1.position.y = 0.4 + Math.sin(t * 0.6) * 0.10
      bar2.rotation.y = Math.PI / 4 - Math.sin(t * 0.5 + 1) * 0.05
      bar2.position.y = 0.6 + Math.sin(t * 0.8 + 1) * 0.08
      knob.position.y = bar1.position.y + 1.52
      tealDot.position.y  = 1.5 + Math.sin(t * 1.1) * 0.12
      tealDot2.position.y = 0.8 + Math.sin(t * 1.3 + 2) * 0.07
      cube.rotation.x = 0.5 + t * 0.35; cube.rotation.y = 0.8 + t * 0.50
      cube.position.y = 0.2 + Math.sin(t * 0.9) * 0.10
      cube2.rotation.x = 0.3 + t * 0.40; cube2.rotation.y = 1.1 + t * 0.55
      cube2.position.y = -0.6 + Math.sin(t * 0.7 + 1) * 0.08
      bigSphere.position.y = -1.5 + Math.sin(t * 0.5) * 0.13
      arc.position.y = bigSphere.position.y - 0.18
      slab.rotation.y = 0.1 + Math.sin(t * 0.3) * 0.04
      camera.position.x += (mx * 0.35 - camera.position.x) * 0.04
      camera.position.y += (my * 0.25 - camera.position.y) * 0.04
      camera.lookAt(scene.position)
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const W2 = container.offsetWidth, H2 = container.offsetHeight
      camera.aspect = W2 / H2; camera.updateProjectionMatrix(); renderer.setSize(W2, H2)
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      container.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])

  // ── Login submit ──
  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    // Client-side validation
    const errs = { phone: '', password: '' }
    if (!phone || phone.length < 10) {
      errs.phone = 'Please enter a valid 10-digit phone number.'
    }
    if (!password) {
      errs.password = 'Please enter your password.'
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.'
    }
    if (errs.phone || errs.password) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({ phone: '', password: '' })

    setLoading(true)
    try {
      await login(phone, password)
      if (onLoginSuccess) onLoginSuccess()
    } catch (err) {
      const status = err.response?.status
      const serverMsg = err.response?.data?.error || err.response?.data?.message

      if (!err.response) {
        setError('Unable to connect. Please check your internet connection.')
      } else if (status === 400) {
        setError(serverMsg || 'Invalid phone number or password format.')
      } else if (status === 401) {
        setFieldErrors({ phone: '', password: 'Incorrect password. Please try again.' })
      } else if (status === 403) {
        setError(serverMsg || 'Your account has been suspended. Please contact support.')
      } else if (status === 404) {
        setFieldErrors({ phone: 'No account found with this phone number.', password: '' })
      } else if (status === 429) {
        setError('Too many failed attempts. Please wait a moment and try again.')
      } else if (status >= 500) {
        setError('Server error. Please try again in a few minutes.')
      } else {
        setError(serverMsg || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Shared input style ──
  const inputStyle = {
    width:'100%', padding:'13px 14px 13px 44px',
    background:'#f4f7ff', border:'1.5px solid #e4eaff',
    borderRadius:12, fontSize:14.5,
    fontFamily:"'Barlow',sans-serif", color:'#1a1a2e', outline:'none',
    transition:'border-color .2s, box-shadow .2s, background .2s',
  }
  const fpInputStyle = {
    width:'100%', padding:'12px 14px',
    background:'#f4f7ff', border:'1.5px solid #e4eaff',
    borderRadius:11, fontSize:14,
    fontFamily:"'Barlow',sans-serif", color:'#1a1a2e', outline:'none',
  }

  const stepLabels = ['Phone', 'Verify OTP', 'New Password']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes lp-fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lp-shake  { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }

        .lp-root {
          width:100vw; height:100vh;
          background:linear-gradient(135deg,#eaedff 0%,#d8dfff 45%,#cdd8ff 100%);
          display:flex; align-items:center; justify-content:center;
          font-family:'Barlow',sans-serif; overflow:hidden; position:relative;
        }
        .lp-blob { position:absolute; border-radius:50%; pointer-events:none; }
        .lp-card {
          display:flex; width:92vw; max-width:1180px;
          height:88vh; max-height:720px; min-height:520px;
          border-radius:28px; overflow:hidden;
          box-shadow:0 32px 90px rgba(50,80,200,0.18),0 8px 28px rgba(50,80,200,0.10);
          position:relative; z-index:10;
        }
        /* LEFT */
        .lp-left {
          flex:0 0 50%; position:relative;
          background:linear-gradient(150deg,#6484ff 0%,#4a6cf7 40%,#3b56e8 100%);
          display:flex; flex-direction:column; justify-content:flex-end;
          padding:0 48px 52px; overflow:hidden;
        }
        .lp-left::before { content:''; position:absolute; width:280px; height:280px; background:rgba(255,255,255,0.10); border-radius:50%; top:-90px; left:-75px; pointer-events:none; z-index:1; }
        .lp-left::after  { content:''; position:absolute; width:140px; height:140px; background:rgba(255,255,255,0.07); border-radius:50%; top:65px; right:-38px; pointer-events:none; z-index:1; }
        .lp-canvas { position:absolute; inset:0; width:100%; height:100%; z-index:0; }
        .lp-dots { position:absolute; top:24px; left:24px; z-index:2; pointer-events:none; display:grid; grid-template-columns:repeat(7,1fr); gap:10px; }
        .lp-dot  { width:3.5px; height:3.5px; border-radius:50%; background:rgba(255,255,255,0.32); }
        .lp-x    { position:absolute; bottom:140px; left:48px; z-index:2; color:rgba(255,255,255,0.38); font-size:20px; font-weight:700; pointer-events:none; }
        .lp-copy { position:relative; z-index:2; }
        .lp-copy h2 { font-family:'Barlow Condensed',sans-serif; font-size:clamp(36px,4vw,58px); font-weight:900; color:#fff; line-height:1.04; margin-bottom:16px; text-shadow:0 2px 18px rgba(20,40,140,0.20); }
        .lp-copy p  { font-size:clamp(13px,1.1vw,15.5px); color:rgba(255,255,255,0.68); line-height:1.65; max-width:270px; }
        /* RIGHT */
        .lp-right { flex:0 0 50%; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 60px; overflow:hidden; position:relative; }
        .lp-logo  { width:64px; height:64px; background:linear-gradient(135deg,#5b7cfa,#3b56e8); border-radius:18px; display:flex; align-items:center; justify-content:center; margin-bottom:16px; box-shadow:0 6px 26px rgba(91,124,250,0.44); flex-shrink:0; }
        .lp-right h1 { font-size:clamp(18px,1.8vw,23px); font-weight:700; color:#1a1a2e; margin-bottom:5px; text-align:center; }
        .lp-tagline { font-size:clamp(12px,1vw,14px); color:#8892b0; margin-bottom:26px; text-align:center; }
        .lp-form { width:100%; }
        .lp-field { width:100%; margin-bottom:16px; }
        .lp-field label { display:block; font-size:10.5px; font-weight:700; color:#7a85a0; letter-spacing:1.8px; text-transform:uppercase; margin-bottom:8px; }
        .lp-wrap  { position:relative; display:flex; align-items:center; }
        .lp-prefix { position:absolute; left:14px; z-index:1; background:#eef2ff; border-radius:6px; padding:3px 8px; font-size:13px; color:#5b7cfa; font-weight:700; pointer-events:none; white-space:nowrap; }
        .lp-ico   { position:absolute; left:15px; color:#8892b0; display:flex; align-items:center; pointer-events:none; }
        .lp-input { width:100%; padding:14px 14px 14px 44px; background:#f4f7ff; border:1.5px solid #e4eaff; border-radius:12px; font-size:14.5px; font-family:'Barlow',sans-serif; color:#1a1a2e; outline:none; transition:all .2s; }
        .lp-input:focus { border-color:#5b7cfa; background:#fff; box-shadow:0 0 0 4px rgba(91,124,250,0.10); }
        .lp-input::placeholder { color:#c0cbdf; }
        .lp-input--error { border-color:#ef4444 !important; background:#fff8f8 !important; }
        .lp-input--error:focus { box-shadow:0 0 0 4px rgba(239,68,68,0.10) !important; }
        .lp-field-err { font-size:11.5px; color:#ef4444; margin-top:5px; padding-left:2px; display:flex; align-items:center; gap:4px; }
        .lp-eye   { position:absolute; right:15px; background:none; border:none; color:#8892b0; font-size:17px; cursor:pointer; padding:0; line-height:1; }
        .lp-opts  { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .lp-rem   { display:flex; align-items:center; gap:8px; font-size:13.5px; color:#8892b0; cursor:pointer; user-select:none; }
        .lp-rem input[type=checkbox] { width:15px; height:15px; accent-color:#5b7cfa; cursor:pointer; }
        .lp-fp-btn { font-size:13.5px; color:#5b7cfa; font-weight:600; background:none; border:none; cursor:pointer; padding:0; }
        .lp-fp-btn:hover { text-decoration:underline; }
        .lp-err   { margin-bottom:12px; padding:10px 14px; background:rgba(239,68,68,.07); border:1px solid rgba(239,68,68,.22); border-radius:10px; color:#ef4444; font-size:13px; animation:lp-shake .3s ease; display:flex; align-items:center; }
        .lp-btn   { width:100%; padding:15px; background:linear-gradient(135deg,#5b7cfa,#4a6cf7); border:none; border-radius:13px; color:#fff; font-size:16px; font-weight:700; font-family:'Barlow',sans-serif; letter-spacing:.5px; cursor:pointer; transition:all .2s; box-shadow:0 6px 26px rgba(91,124,250,0.42); margin-bottom:0; }
        .lp-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 10px 32px rgba(91,124,250,0.50); }
        .lp-btn:active:not(:disabled) { transform:scale(0.98); }
        .lp-btn:disabled { background:#e4eaff; color:#8892b0; box-shadow:none; cursor:not-allowed; }

        /* Forgot password modal */
        .fp-overlay { position:fixed; inset:0; z-index:200; background:rgba(20,30,80,0.45); backdropFilter:blur(8px); display:flex; align-items:center; justify-content:center; padding:20px; animation:lp-fadeUp .25s ease; }
        .fp-modal  { background:#fff; border:1.5px solid #e4eaff; border-radius:22px; padding:32px 32px 28px; width:100%; max-width:420px; box-shadow:0 24px 60px rgba(91,124,250,0.22); animation:lp-fadeUp .3s ease; }
        .fp-steps  { display:flex; align-items:center; gap:0; margin-bottom:28px; }
        .fp-step   { display:flex; flex-direction:column; align-items:center; flex:1; position:relative; }
        .fp-step:not(:last-child)::after { content:''; position:absolute; top:14px; left:calc(50% + 14px); right:calc(-50% + 14px); height:2px; background:#e4eaff; z-index:0; }
        .fp-step.done::after  { background:#5b7cfa; }
        .fp-step-dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; z-index:1; transition:all .3s; }
        .fp-step.active .fp-step-dot { background:#5b7cfa; color:#fff; box-shadow:0 0 0 4px rgba(91,124,250,0.18); }
        .fp-step.done   .fp-step-dot { background:#5b7cfa; color:#fff; }
        .fp-step.idle   .fp-step-dot { background:#f4f7ff; color:#8892b0; border:1.5px solid #e4eaff; }
        .fp-step-label { font-size:10px; font-weight:700; color:#8892b0; margin-top:5px; letter-spacing:.5px; text-align:center; }
        .fp-step.active .fp-step-label { color:#5b7cfa; }
        .fp-otp-row { display:flex; gap:10px; }
        .fp-otp-row input { flex:1; text-align:center; font-size:22px; font-weight:700; font-family:'Barlow Condensed',sans-serif; letter-spacing:6px; padding:12px 8px; background:#f4f7ff; border:1.5px solid #e4eaff; border-radius:11px; color:#1a1a2e; outline:none; transition:all .2s; }
        .fp-otp-row input:focus { border-color:#5b7cfa; background:#fff; box-shadow:0 0 0 4px rgba(91,124,250,0.10); }
        .fp-success { padding:10px 14px; background:#ecfdf5; border:1.5px solid #bbf7d0; border-radius:10px; color:#16a34a; font-size:13px; font-weight:600; margin-bottom:14px; }
        .fp-err     { padding:10px 14px; background:#fef2f2; border:1.5px solid #fecaca; border-radius:10px; color:#dc2626; font-size:13px; margin-bottom:14px; animation:lp-shake .3s ease; }
      `}</style>

      <div className="lp-root">
        <div className="lp-blob" style={{ width:380, height:380, background:'rgba(91,124,250,0.09)', top:-130, right:30 }} />
        <div className="lp-blob" style={{ width:280, height:280, background:'rgba(91,124,250,0.07)', bottom:-90, right:-20 }} />
        <div className="lp-blob" style={{ width:170, height:170, background:'rgba(91,124,250,0.11)', bottom:40, left:-20 }} />
        <div className="lp-blob" style={{ width:110, height:110, background:'rgba(91,124,250,0.08)', top:90, left:50 }} />

        <div className="lp-card">

          {/* LEFT */}
          <div className="lp-left" ref={containerRef}>
            <canvas className="lp-canvas" ref={canvasRef} />
            <div className="lp-dots">{Array.from({length:28}).map((_,i)=><div key={i} className="lp-dot"/>)}</div>
            <span className="lp-x">×</span>
            <div className="lp-copy">
              <h2>Skip the<br/>queue,<br/>pay&nbsp;smart.</h2>
              <p>Your all-in-one mall payment hub — tap, pay &amp; go with zero friction.</p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lp-right">
            <div className="lp-logo">
              <svg width="30" height="30" viewBox="0 0 44 44" fill="none">
                <path d="M7 11L7 33L15 22L23 33L23 11" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M29 11L37 11L37 33" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                <path d="M29 22L34 22" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
              </svg>
            </div>

            <h1>Hello ! Welcome back</h1>
            <p className="lp-tagline">Sign in to your store account</p>

            <form className="lp-form" onSubmit={handleSubmit}>
              {/* Phone */}
              <div className="lp-field">
                <label>Phone Number</label>
                <div className="lp-wrap">
                  <span className="lp-prefix">+91</span>
                  <input
                    className={`lp-input${fieldErrors.phone ? ' lp-input--error' : ''}`}
                    type="text" inputMode="numeric"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setFieldErrors(f => ({ ...f, phone: '' })) }}
                    placeholder="9800000000" maxLength={10}
                    style={{ paddingLeft:68 }}
                  />
                </div>
                {fieldErrors.phone && <div className="lp-field-err">⚠ {fieldErrors.phone}</div>}
              </div>

              {/* Password */}
              <div className="lp-field">
                <label>Password</label>
                <div className="lp-wrap">
                  <span className="lp-ico">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </span>
                  <input
                    className={`lp-input${fieldErrors.password ? ' lp-input--error' : ''}`}
                    type={showPass?'text':'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: '' })) }}
                    placeholder="••••••••" style={{ paddingRight:46 }}
                  />
                  <button type="button" className="lp-eye" onClick={() => setShowPass(v=>!v)}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                {fieldErrors.password && <div className="lp-field-err">⚠ {fieldErrors.password}</div>}
              </div>

              {/* Options */}
              <div className="lp-opts">
                <label className="lp-rem">
                  <input type="checkbox" defaultChecked/>
                  Remember me
                </label>
                <button type="button" className="lp-fp-btn" onClick={openFp}>
                  Forgot Password?
                </button>
              </div>

              {error && (
                <div className="lp-err" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink:0, marginRight:6, verticalAlign:'middle' }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" className="lp-btn" disabled={loading}>
                {loading ? 'Signing in…' : 'Login'}
              </button>
            </form>
          </div>
        </div>

        {/* ══ FORGOT PASSWORD MODAL ══ */}
        {fpOpen && (
          <div className="fp-overlay" onClick={e => e.target === e.currentTarget && !fpLoading && closeFp()}>
            <div className="fp-modal">

              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <div>
                  <h3 style={{ fontSize:20, fontWeight:900, color:'#1a1a2e', fontFamily:"'Barlow Condensed',sans-serif" }}>Reset Password</h3>
                  <p style={{ fontSize:12, color:'#8892b0', marginTop:2 }}>We'll send an OTP to your registered phone</p>
                </div>
                {!fpLoading && (
                  <button onClick={closeFp} style={{ width:32, height:32, borderRadius:8, background:'#f4f7ff', border:'1.5px solid #e4eaff', color:'#8892b0', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                )}
              </div>

              {/* Step indicators */}
              <div className="fp-steps">
                {stepLabels.map((label, i) => {
                  const stepNum = i + 1
                  const status = fpStep > stepNum ? 'done' : fpStep === stepNum ? 'active' : 'idle'
                  return (
                    <div key={i} className={`fp-step ${status}`}>
                      <div className="fp-step-dot">
                        {status === 'done' ? '✓' : stepNum}
                      </div>
                      <div className="fp-step-label">{label}</div>
                    </div>
                  )
                })}
              </div>

              {/* Messages */}
              {fpSuccess && <div className="fp-success">✅ {fpSuccess}</div>}
              {fpError   && <div className="fp-err">⚠ {fpError}</div>}

              {/* ── STEP 1: Enter phone ── */}
              {fpStep === 1 && (
                <div>
                  <label style={{ display:'block', fontSize:10.5, fontWeight:700, color:'#7a85a0', letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:8 }}>Phone Number</label>
                  <div style={{ position:'relative', display:'flex', alignItems:'center', marginBottom:20 }}>
                    <span style={{ position:'absolute', left:14, background:'#eef2ff', borderRadius:6, padding:'3px 8px', fontSize:13, color:'#5b7cfa', fontWeight:700, zIndex:1 }}>+91</span>
                    <input
                      type="text" inputMode="numeric"
                      value={fpPhone} onChange={e => setFpPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                      placeholder="9800000000" maxLength={10}
                      style={{ ...fpInputStyle, paddingLeft:68 }}
                      onFocus={e => { e.target.style.borderColor='#5b7cfa'; e.target.style.background='#fff' }}
                      onBlur={e  => { e.target.style.borderColor='#e4eaff'; e.target.style.background='#f4f7ff' }}
                      onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    />
                  </div>
                  <button onClick={sendOtp} disabled={fpLoading || fpPhone.length < 10}
                    style={{ width:'100%', padding:'13px', background:fpLoading||fpPhone.length<10?'#e4eaff':'linear-gradient(135deg,#5b7cfa,#4a6cf7)', border:'none', borderRadius:12, color:fpLoading||fpPhone.length<10?'#8892b0':'#fff', fontSize:15, fontWeight:700, fontFamily:"'Barlow',sans-serif", cursor:fpLoading||fpPhone.length<10?'not-allowed':'pointer', boxShadow:fpLoading?'none':'0 4px 14px rgba(91,124,250,0.35)' }}>
                    {fpLoading ? 'Sending OTP…' : 'Send OTP →'}
                  </button>
                </div>
              )}

              {/* ── STEP 2: Enter OTP ── */}
              {fpStep === 2 && (
                <div>
                  <p style={{ fontSize:13, color:'#374151', marginBottom:16 }}>
                    Enter the 6-digit OTP sent to <strong style={{ color:'#5b7cfa' }}>+91 {fpPhone}</strong>
                  </p>
                  <div className="fp-otp-row" style={{ marginBottom:20 }}>
                    <input
                      type="text" inputMode="numeric"
                      value={fpOtp} onChange={e => setFpOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                      placeholder="000000" maxLength={6}
                      onFocus={e => { e.target.style.borderColor='#5b7cfa'; e.target.style.background='#fff' }}
                      onBlur={e  => { e.target.style.borderColor='#e4eaff'; e.target.style.background='#f4f7ff' }}
                      onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                    />
                  </div>

                  <button onClick={verifyOtp} disabled={fpLoading || fpOtp.length !== 6}
                    style={{ width:'100%', padding:'13px', background:fpLoading||fpOtp.length!==6?'#e4eaff':'linear-gradient(135deg,#5b7cfa,#4a6cf7)', border:'none', borderRadius:12, color:fpLoading||fpOtp.length!==6?'#8892b0':'#fff', fontSize:15, fontWeight:700, fontFamily:"'Barlow',sans-serif", cursor:fpLoading||fpOtp.length!==6?'not-allowed':'pointer', marginBottom:12 }}>
                    {fpLoading ? 'Verifying…' : 'Verify OTP →'}
                  </button>

                  {/* Resend */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <button onClick={() => { setFpStep(1); setFpOtp(''); setFpError(''); setFpSuccess('') }}
                      style={{ background:'none', border:'none', color:'#8892b0', fontSize:13, cursor:'pointer' }}>
                      ← Change number
                    </button>
                    <button onClick={resendOtp} disabled={fpResendTimer > 0 || fpLoading}
                      style={{ background:'none', border:'none', color:fpResendTimer>0?'#b0bad0':'#5b7cfa', fontSize:13, fontWeight:600, cursor:fpResendTimer>0?'default':'pointer' }}>
                      {fpResendTimer > 0 ? `Resend in ${fpResendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: New password ── */}
              {fpStep === 3 && (
                <div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:'block', fontSize:10.5, fontWeight:700, color:'#7a85a0', letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:8 }}>New Password</label>
                    <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                      <input
                        type={fpShowNew?'text':'password'}
                        value={fpNewPass} onChange={e => setFpNewPass(e.target.value)}
                        placeholder="Min. 6 characters"
                        style={{ ...fpInputStyle, paddingRight:44 }}
                        onFocus={e => { e.target.style.borderColor='#5b7cfa'; e.target.style.background='#fff' }}
                        onBlur={e  => { e.target.style.borderColor='#e4eaff'; e.target.style.background='#f4f7ff' }}
                      />
                      <button type="button" onClick={() => setFpShowNew(v=>!v)}
                        style={{ position:'absolute', right:12, background:'none', border:'none', color:'#8892b0', fontSize:16, cursor:'pointer' }}>
                        {fpShowNew ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom:20 }}>
                    <label style={{ display:'block', fontSize:10.5, fontWeight:700, color:'#7a85a0', letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:8 }}>Confirm Password</label>
                    <input
                      type={fpShowNew?'text':'password'}
                      value={fpConfirm} onChange={e => setFpConfirm(e.target.value)}
                      placeholder="Re-enter new password"
                      style={{
                        ...fpInputStyle,
                        borderColor: fpConfirm && fpConfirm !== fpNewPass ? '#fecaca' : '#e4eaff',
                        background:  fpConfirm && fpConfirm !== fpNewPass ? '#fef2f2' : '#f4f7ff',
                      }}
                      onKeyDown={e => e.key === 'Enter' && resetPassword()}
                    />
                    {fpConfirm && fpConfirm !== fpNewPass && (
                      <div style={{ fontSize:11, color:'#dc2626', marginTop:5 }}>Passwords don't match</div>
                    )}
                  </div>

                  {/* Strength indicator */}
                  {fpNewPass && (
                    <div style={{ marginBottom:16 }}>
                      <div style={{ height:4, background:'#f0f3ff', borderRadius:4, overflow:'hidden', marginBottom:5 }}>
                        <div style={{ height:'100%', borderRadius:4, transition:'all .3s', width: fpNewPass.length >= 10 ? '100%' : fpNewPass.length >= 8 ? '66%' : fpNewPass.length >= 6 ? '33%' : '10%', background: fpNewPass.length >= 10 ? '#16a34a' : fpNewPass.length >= 8 ? '#d97706' : '#ef4444' }}/>
                      </div>
                      <div style={{ fontSize:11, color:'#8892b0' }}>
                        {fpNewPass.length >= 10 ? '✅ Strong' : fpNewPass.length >= 8 ? '⚠️ Medium' : fpNewPass.length >= 6 ? '🔴 Weak' : '🔴 Too short'}
                      </div>
                    </div>
                  )}

                  <button onClick={resetPassword} disabled={fpLoading || !fpNewPass || fpNewPass !== fpConfirm}
                    style={{ width:'100%', padding:'13px', background:fpLoading||!fpNewPass||fpNewPass!==fpConfirm?'#e4eaff':'linear-gradient(135deg,#5b7cfa,#4a6cf7)', border:'none', borderRadius:12, color:fpLoading||!fpNewPass||fpNewPass!==fpConfirm?'#8892b0':'#fff', fontSize:15, fontWeight:700, fontFamily:"'Barlow',sans-serif", cursor:fpLoading||!fpNewPass||fpNewPass!==fpConfirm?'not-allowed':'pointer' }}>
                    {fpLoading ? 'Resetting…' : '🔒 Reset Password'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}