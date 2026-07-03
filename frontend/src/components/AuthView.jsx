import React, { useState } from 'react';
import { useAuth } from '../context/authContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, LogIn, Loader2, AlertCircle } from 'lucide-react';

const AuthView = ({ initialIsLogin = true, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        if (onSuccess) onSuccess();
      } else {
        if (!fullName.trim()) {
          throw new Error('Full Name is required for signup');
        }
        await signUp(email, password, fullName);
        alert('Signup successful! You can now log in.');
        setIsLogin(true);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-dark-panel p-8 text-slate-100 font-sans">
      <div className="text-center mb-8">
        <motion.div 
          className="inline-flex p-3 rounded-xl bg-brand-600/10 border border-brand-600/20 text-brand-bronze mb-3"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogIn size={28} />
        </motion.div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          {isLogin ? 'Welcome to JobSense' : 'Create Your Account'}
        </h2>
        <p className="text-slate-400 mt-2 text-xs">
          {isLogin ? 'Sign in to access your dashboard' : 'Start your journey to career readiness'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 flex items-start gap-2 text-xs"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence mode="wait">
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-1.5"
            >
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-dark-base border border-dark-border rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-brand-bronze transition-colors placeholder:text-slate-600"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-dark-base border border-dark-border rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-brand-bronze transition-colors placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-dark-base border border-dark-border rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-brand-bronze transition-colors placeholder:text-slate-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-dark-base font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin text-dark-base" size={18} />
          ) : (
            <>
              <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
              <LogIn size={18} />
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-6 text-xs">
        <span className="text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
        </span>
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          className="text-brand-bronze hover:text-brand-gold font-bold focus:outline-none"
        >
          {isLogin ? 'Sign Up' : 'Sign In'}
        </button>
      </div>
    </div>
  );
};

export default AuthView;
