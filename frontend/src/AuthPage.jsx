import { useState } from 'react';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', phone: '', otp: '', newPassword: '', confirmPassword: ''
  });
  const [verificationMethod, setVerificationMethod] = useState('email');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const API = 'http://localhost:5000/auth';
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', phone: '', otp: '', newPassword: '', confirmPassword: '' });
    setError(''); setSuccess('');
  };

  const apiCall = async (endpoint, body) => {
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch { return { error: 'Network error' }; }
  };

  const handleRegister = async () => {
    if (!formData.email) return setError('Email required');
    if (formData.password?.length < 6) return setError('Password min 6 chars');
    setLoading(true); setError('');
    const data = await apiCall('/register', { 
      username: formData.username, email: formData.email, 
      password: formData.password, phone: formData.phone || null 
    });
    if (data.error) setError(data.error);
    else { setSuccess('Registered! Sending code...'); await sendVerificationCode(); }
    setLoading(false);
  };

  const sendVerificationCode = async () => {
    setLoading(true); setError('');
    const data = await apiCall('/send-verification', { email: formData.email, method: verificationMethod });
    if (data.error) setError(data.error);
    else { setSuccess(data.message); setMode('verify'); }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (formData.otp?.length !== 6) return setError('Enter 6-digit code');
    setLoading(true); setError('');
    const data = await apiCall('/verify-account', { email: formData.email, otp: formData.otp });
    if (data.token) {
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';
    } else setError(data.error || 'Invalid code');
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) return setError('Email & password required');
    setLoading(true); setError('');
    const data = await apiCall('/login', { email: formData.email, password: formData.password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';
    } else if (data.requiresVerification) {
      setError('Verify account first');
      setTimeout(() => { setMode('verify'); sendVerificationCode(); }, 2000);
    } else setError(data.error || 'Login failed');
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (verificationMethod === 'email' && !formData.email) return setError('Email required');
    if (verificationMethod === 'whatsapp' && (!formData.phone || !formData.email)) return setError('Email & phone required');
    setLoading(true); setError('');
    const data = await apiCall('/forgot-password', { email: formData.email, method: verificationMethod });
    if (data.error) setError(data.error);
    else { setSuccess(data.message); setMode('reset'); }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!formData.otp || !formData.newPassword || !formData.confirmPassword) return setError('All fields required');
    if (formData.newPassword !== formData.confirmPassword) return setError('Passwords mismatch');
    if (formData.newPassword.length < 6) return setError('Password min 6 chars');
    setLoading(true); setError('');
    const data = await apiCall('/reset-password', { email: formData.email, otp: formData.otp, newPassword: formData.newPassword });
    if (data.error) { setError(data.error); setLoading(false); }
    else {
      setSuccess('Reset successful! Logging in...');
      setTimeout(async () => {
        const loginData = await apiCall('/login', { email: formData.email, password: formData.newPassword });
        if (loginData.token) {
          localStorage.setItem('token', loginData.token);
          window.location.href = '/dashboard';
        } else {
          setMode('login');
          setFormData({ ...formData, password: formData.newPassword, otp: '', newPassword: '', confirmPassword: '' });
          setError('Reset done. Please login.');
        }
        setLoading(false);
      }, 1500);
    }
  };

  const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' };
  const btnStyle = (bg) => ({ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: bg, color: bg === '#ffc107' ? 'black' : 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' });

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'Arial' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Sign Up' : mode === 'verify' ? 'Verify' : mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}
      </h2>
      
      {error && <div style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#fee', color: '#c00', borderRadius: '4px' }}>{error}</div>}
      {success && <div style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#efe', color: '#0a0', borderRadius: '4px' }}>{success}</div>}

      {mode === 'login' && (
        <>
          <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} style={inputStyle} />
          <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} style={inputStyle} />
          <button onClick={handleLogin} disabled={loading} style={btnStyle('#007bff')}>{loading ? 'Signing in...' : 'Sign In'}</button>
          <button onClick={() => window.location.href = 'http://localhost:5000/sso/login?redirect=http://localhost:5173/callback'} style={btnStyle('#6f42c1')}>🔐 Login with SSO</button>
          
          <div style={{ margin: '20px 0', textAlign: 'center', position: 'relative' }}>
            <div style={{ borderTop: '1px solid #ddd', position: 'absolute', width: '100%', top: '50%' }}></div>
            <span style={{ backgroundColor: 'white', padding: '0 10px', position: 'relative', color: '#666' }}>OR</span>
          </div>

          <button onClick={() => window.location.href = `${API}/google`} style={{ ...btnStyle('#fff'), color: '#333', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>

          <button onClick={() => window.location.href = `${API}/github`} style={{ ...btnStyle('#24292e'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="white"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            Continue with GitHub
          </button>

          <p style={{ textAlign: 'center', cursor: 'pointer', color: '#007bff', marginTop: '15px' }} onClick={() => { setMode('forgot'); resetForm(); }}>Forgot password?</p>
          <p style={{ textAlign: 'center' }}>Don't have an account? <span style={{ cursor: 'pointer', color: '#007bff' }} onClick={() => { setMode('register'); resetForm(); }}>Sign up</span></p>
        </>
      )}

      {mode === 'register' && (
        <>
          <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} style={inputStyle} />
          <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} style={inputStyle} />
          <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} style={inputStyle} />
          <input name="phone" placeholder="Phone (optional)" value={formData.phone} onChange={handleChange} style={inputStyle} />
          <button onClick={handleRegister} disabled={loading} style={btnStyle('#28a745')}>{loading ? 'Registering...' : 'Sign Up'}</button>

          <div style={{ margin: '20px 0', textAlign: 'center', position: 'relative' }}>
            <div style={{ borderTop: '1px solid #ddd', position: 'absolute', width: '100%', top: '50%' }}></div>
            <span style={{ backgroundColor: 'white', padding: '0 10px', position: 'relative', color: '#666' }}>OR</span>
          </div>

          <button onClick={() => window.location.href = `${API}/google`} style={{ ...btnStyle('#fff'), color: '#333', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            Sign up with Google
          </button>

          <button onClick={() => window.location.href = `${API}/github`} style={{ ...btnStyle('#24292e'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="white"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            Sign up with GitHub
          </button>

          <p style={{ textAlign: 'center' }}>Already have an account? <span style={{ cursor: 'pointer', color: '#007bff' }} onClick={() => { setMode('login'); resetForm(); }}>Sign in</span></p>
        </>
      )}

      {mode === 'verify' && (
        <>
          <input name="otp" placeholder="Enter 6-digit code" value={formData.otp} onChange={handleChange} maxLength={6} style={{ ...inputStyle, fontSize: '18px', textAlign: 'center', letterSpacing: '5px' }} />
          <button onClick={handleVerify} disabled={loading} style={btnStyle('#007bff')}>{loading ? 'Verifying...' : 'Verify'}</button>
          <p style={{ textAlign: 'center', cursor: 'pointer', color: '#007bff' }} onClick={sendVerificationCode}>Resend code</p>
        </>
      )}

      {mode === 'forgot' && (
        <>
          <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} style={inputStyle} />
          {verificationMethod === 'whatsapp' && <input name="phone" placeholder="Phone (+919876543210)" value={formData.phone} onChange={handleChange} style={inputStyle} />}
          <select value={verificationMethod} onChange={(e) => setVerificationMethod(e.target.value)} style={inputStyle}>
            <option value="email">Send via Email</option>
            <option value="whatsapp">Send via WhatsApp</option>
          </select>
          <button onClick={handleForgotPassword} disabled={loading} style={btnStyle('#ffc107')}>{loading ? 'Sending...' : 'Send Reset Code'}</button>
          <p style={{ textAlign: 'center', cursor: 'pointer', color: '#007bff' }} onClick={() => { setMode('login'); resetForm(); }}>Back to login</p>
        </>
      )}

      {mode === 'reset' && (
        <>
          <input name="otp" placeholder="Reset code" value={formData.otp} onChange={handleChange} maxLength={6} style={{ ...inputStyle, fontSize: '18px', textAlign: 'center', letterSpacing: '5px' }} />
          <input name="newPassword" type="password" placeholder="New Password" value={formData.newPassword} onChange={handleChange} style={inputStyle} />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} style={inputStyle} />
          <button onClick={handleResetPassword} disabled={loading} style={btnStyle('#dc3545')}>{loading ? 'Resetting...' : 'Reset Password'}</button>
          <p style={{ textAlign: 'center', cursor: 'pointer', color: '#007bff' }} onClick={() => { setMode('login'); resetForm(); }}>Back to login</p>
        </>
      )}
    </div>
  );
}