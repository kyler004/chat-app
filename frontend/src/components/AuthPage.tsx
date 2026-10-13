import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth.tsx";
import { MessageSquare, Mail, Lock, User, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const { login, register } = useAuth();

  // Handle manual oauth redirect success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (token) {
        localStorage.setItem("token", token);
        window.location.href = "/";
    }
    if (error) {
        toast.error("Google login failed");
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
    } catch (error) {
      // Error is handled in useAuth
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:4000/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-brand/20 shadow-xl shadow-brand/10">
            <MessageSquare className="w-8 h-8 text-brand" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-text-primary tracking-tight">
          {isLogin ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary font-medium">
          {isLogin ? "Enter your details to access your account" : "Join Relay today"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-bg-elevated/50 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-black/20 sm:rounded-3xl sm:px-10 border border-white/5 relative overflow-hidden">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 border border-white/10 rounded-2xl bg-black/20 text-text-primary placeholder-text-muted focus:ring-2 focus:ring-brand focus:border-transparent transition-all sm:text-sm"
                    placeholder="Choose a username"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-white/10 rounded-2xl bg-black/20 text-text-primary placeholder-text-muted focus:ring-2 focus:ring-brand focus:border-transparent transition-all sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-white/10 rounded-2xl bg-black/20 text-text-primary placeholder-text-muted focus:ring-2 focus:ring-brand focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-brand hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-base focus:ring-brand transition-all shadow-brand/25 hover:shadow-brand/40"
              >
                {isLogin ? "Sign in" : "Create account"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-bg-elevated/50 text-text-muted">Or continue with</span>
              </div>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-white/10 rounded-2xl shadow-sm text-sm font-bold text-text-primary bg-black/20 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-base focus:ring-white/20 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                Google
              </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-brand hover:text-brand-hover transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
