import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    customerType: 'retail',
    businessName: '',
  });
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMsg('');

    if (isRegister) {
      if (!form.name.trim()) {
        setLocalError('Please enter your full name.');
        return;
      }

      const res = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        customerType: 'retail',
      });

      if (res.success) {
        setSuccessMsg('Account registered successfully! Redirecting...');
        setTimeout(() => {
          if (res.user?.role === 'admin') {
            navigate('/admin/stock');
          } else {
            navigate('/');
          }
        }, 1000);
      } else {
        setLocalError(res.error || 'Registration failed.');
      }
    } else {
      const res = await login(form.email, form.password);
      if (res.success) {
        // If admin, redirect directly to the Stock Management Dashboard
        if (res.user?.role === 'admin') {
          navigate('/admin/stock');
        } else {
          const from = location.state?.from?.pathname || '/';
          navigate(from);
        }
      } else {
        setLocalError(res.error || 'Invalid email or password.');
      }
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        {/* Tab switch between Login and Register */}
        <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setLocalError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              borderBottom: !isRegister ? '3px solid #8b1e2d' : '3px solid transparent',
              fontWeight: !isRegister ? '700' : '500',
              color: !isRegister ? '#8b1e2d' : '#64748b',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setLocalError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              borderBottom: isRegister ? '3px solid #8b1e2d' : '3px solid transparent',
              fontWeight: isRegister ? '700' : '500',
              color: isRegister ? '#8b1e2d' : '#64748b',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Create Account
          </button>
        </div>

        <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>
          {isRegister
            ? 'Join Sree Kavinya Tex for exclusive collections & orders.'
            : 'Sign in to access your orders, wishlist, or stock administration.'}
        </p>

        {localError && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
            ⚠️ {localError}
          </div>
        )}

        {successMsg && (
          <div style={{ backgroundColor: '#dcfce7', border: '1px solid #22c55e', color: '#15803d', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
            ✅ {successMsg}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-field">
              <label htmlFor="r-name">Full Name</label>
              <input
                id="r-name"
                name="name"
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor="l-email">Email Address</label>
            <input
              id="l-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="l-password">Password</label>
            <input
              id="l-password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {isRegister && (
            <>
              <div className="form-field">
                <label htmlFor="r-phone">Phone Number (optional)</label>
                <input
                  id="r-phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {!isRegister && (
            <div className="auth-row" style={{ marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked /> Remember me
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
            style={{ marginTop: '20px' }}
          >
            {loading ? 'Please wait...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
