import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.glow} />
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>Relay</span>
        </div>
        <p style={styles.tagline}>
          {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'register' && (
            <Field
              label="Username"
              type="text"
              value={form.username}
              onChange={(v) => setForm({ ...form, username: v })}
              placeholder="yourname"
            />
          )}
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            placeholder="••••••••"
          />

          <button
            type="submit"
            style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p style={styles.toggle}>
          {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
          <span
            style={styles.link}
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Register' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
}

// Reusable field sub-component
function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={styles.input}
        required
      />
    </div>
  );
}

const styles = {
  page: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: 'var(--bg-base)', position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute', width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
    top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '40px 44px', width: 400,
    position: 'relative', boxShadow: 'var(--shadow-lg)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  logoIcon: { fontSize: 28, color: 'var(--accent)' },
  logoText: { fontSize: 24, fontWeight: 600, letterSpacing: '-0.5px' },
  tagline: { color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14 },
  error: {
    background: 'rgba(248,114,114,0.1)', border: '1px solid var(--danger)',
    color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    fontSize: 13, marginBottom: 16,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' },
  input: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
    fontFamily: 'var(--font-sans)',
    transition: 'border-color 0.2s',
  },
  btn: {
    marginTop: 8, background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.3px',
    transition: 'background 0.2s',
  },
  toggle: { marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' },
  link: { color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 },
};