import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    customerType: 'retail',
    businessName: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await register(form);
        if (res.success) {
          setMessage('Account created successfully!');
          setTimeout(() => navigate('/'), 1200);
        } else {
          setError(res.message || 'Registration failed');
        }
      } else {
        const res = await login(form.email, form.password);
        if (res.success) {
          setMessage('Logged in successfully!');
          setTimeout(() => navigate('/'), 1000);
        } else {
          setError(res.message || 'Invalid email or password');
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>My Account</h1>
          <p style={{ marginBottom: 16 }}>Welcome back, <strong>{user.name}</strong>!</p>

          <div
            style={{
              background: 'var(--bg-soft)',
              padding: 16,
              borderRadius: 'var(--radius)',
              marginBottom: 20,
              fontSize: '0.95rem',
            }}
          >
            <p><strong>Email:</strong> {user.email}</p>
            {user.phone && <p><strong>Phone:</strong> {user.phone}</p>}
            <p><strong>Account Type:</strong> {user.role === 'admin' ? 'System Administrator' : user.customerType === 'wholesale' ? 'Wholesale Buyer' : 'Retail Customer'}</p>
            {user.businessName && <p><strong>Business:</strong> {user.businessName}</p>}
          </div>

          {user.role === 'admin' && (
            <div style={{ marginBottom: 16 }}>
              <Link
                to="/admin/stock"
                className="btn btn-primary btn-block"
                style={{ textAlign: 'center', background: '#0f172a', borderColor: '#0f172a' }}
              >
                📦 Open Stock Management Module
              </Link>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/products" className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>
              Shop Now
            </Link>
            <button
              type="button"
              className="btn btn-primary"
              onClick={logout}
              style={{ flex: 1 }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>{isRegister ? 'Create Account' : 'Login'}</h1>
        <p>
          {isRegister
            ? 'Register to place orders, track shipments, and manage wishlist.'
            : 'Sign in to your account to view orders and your wishlist.'}
        </p>

        {error && (
          <p
            role="alert"
            style={{
              color: 'var(--primary)',
              background: '#faebeb',
              padding: '10px 12px',
              borderRadius: 'var(--radius)',
              marginBottom: 16,
              fontSize: '0.9rem',
            }}
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            style={{
              color: 'var(--success)',
              background: '#eaf6ee',
              padding: '10px 12px',
              borderRadius: 'var(--radius)',
              marginBottom: 16,
              fontSize: '0.9rem',
            }}
          >
            {message}
          </p>
        )}

        <form className="form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-field">
              <label htmlFor="r-name">Full Name</label>
              <input
                id="r-name"
                name="name"
                type="text"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor="l-email">Email</label>
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
              placeholder="Enter at least 6 characters"
              minLength={6}
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {isRegister && (
            <>
              <div className="form-field">
                <label htmlFor="r-phone">Phone Number (Optional)</label>
                <input
                  id="r-phone"
                  name="phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="r-custType">Account Type</label>
                <select
                  id="r-custType"
                  name="customerType"
                  value={form.customerType}
                  onChange={handleChange}
                >
                  <option value="retail">Retail Customer</option>
                  <option value="wholesale">Wholesale / Business Buyer</option>
                </select>
              </div>

              {form.customerType === 'wholesale' && (
                <div className="form-field">
                  <label htmlFor="r-business">Business Name</label>
                  <input
                    id="r-business"
                    name="businessName"
                    type="text"
                    placeholder="Shop / Business Name"
                    value={form.businessName}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
            </>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: 16 }}>
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                }}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              New customer?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
              >
                Create an account
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
