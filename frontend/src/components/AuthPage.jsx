import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, Github } from 'lucide-react';

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
      setError(err.response?.data?.message || err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-bg-base px-4">
      {/* Mesh Background */}
      <div className="mesh-gradient">
        <motion.div 
          animate={{ x: [0, 100, -100, 0], y: [0, -50, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="mesh-ball left-0 top-0 opacity-40"
        />
        <motion.div 
          animate={{ x: [0, -120, 120, 0], y: [0, 80, -80, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="mesh-ball right-0 bottom-0 bg-indigo-500/30"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card relative z-10 w-full max-w-[440px] rounded-4xl p-10 md:p-12"
      >
        {/* Header */}
        <div className="mb-10 text-center">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-inner"
          >
            <Sparkles size={32} />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight text-text-primary">
            {mode === 'login' ? 'Welcome Back' : 'Get Started'}
          </h1>
          <p className="mt-3 text-sm font-medium text-text-secondary">
            {mode === 'login' ? 'Enter your details to rejoin the conversation' : 'Join thousands of creators communicating in realtime'}
          </p>
        </div>

        {/* Error */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-center text-xs font-bold uppercase tracking-wider text-danger"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="popLayout">
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                key="username"
                className="space-y-2"
              >
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors">
                    <User size={20} />
                  </span>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Username"
                    className="input-field w-full pl-12"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors">
                <Mail size={20} />
              </span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email address"
                className="input-field w-full pl-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors">
                <Lock size={20} />
              </span>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password"
                className="input-field w-full pl-12"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary group relative w-full"
          >
            <span className={`inline-flex items-center gap-3 transition-all ${loading ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
              {mode === 'login' ? 'Continue with Email' : 'Create Account'}
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </span>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin" />
              </div>
            )}
          </button>
        </form>

        <div className="mt-10">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-bg-surface px-4 text-text-muted font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 rounded-2xl border border-border-subtle bg-bg-base/30 py-3 text-sm font-bold hover:bg-bg-hover transition-all">
              <Github size={18} /> Github
            </button>
            <button className="flex items-center justify-center gap-3 rounded-2xl border border-border-subtle bg-bg-base/30 py-3 text-sm font-bold hover:bg-bg-hover transition-all">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
              </svg>
              Google
            </button>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-sm font-bold text-text-secondary transition-colors hover:text-brand"
          >
            {mode === 'login' ? "New here? " : "Already have an account? "}
            <span className="text-brand">
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}