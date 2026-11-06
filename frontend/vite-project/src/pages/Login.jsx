import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../lib/api';

export default function Login({ setUser }) {
  const [mode, setMode] = useState('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
      });

      const userData = {
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
      };

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setMessage(res.data?.message || 'Login successful.');
      setError('');
      navigate('/');
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Unable to sign in. Please try again.';
      setError(detail);
      if (detail.toLowerCase().includes('no account found')) {
        setMode('signup');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await axios.post(`${API_BASE_URL}/verify-login`, {
        email,
        token: verificationCode,
      });

      const userData = {
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
      };

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setMessage(res.data.message || 'Login verified successfully.');
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await axios.post(`${API_BASE_URL}/signup`, {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });

      setNeedsVerification(true);
      setMessage(res.data.message || 'Account created. Check your email for the verification code.');
      if (res.data?.verification_token) {
        setMessage((res.data.message || 'Account created. Check your email for the verification code.') + ` Verification code: ${res.data.verification_token}`);
      }
      setMode('login');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-0">

      <div className="relative bg-white/80 backdrop-blur-xl p-10 md:p-16 rounded-none md:rounded-3xl shadow-none md:shadow-xl shadow-violet-100/50 w-full h-full md:h-auto md:w-full md:max-w-md border border-white/60 fade-in flex flex-col justify-center z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-violet-300/50">
            <img src="/logo.png" alt="LeaveFlow" className="w-10 h-10 object-contain" />
          </div>
          <h1 id="login-heading" className="text-3xl font-bold text-gray-900">Welcome To LeaveFlow</h1>
          <p className="text-gray-500 mt-2">Sign in to manage your leaves and submit requests effortlessly.</p>
        </div>

        <div className="flex rounded-2xl bg-gray-100 p-1 mb-6">
          <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500'}`}>Sign In</button>
          <button type="button" onClick={() => { setMode('signup'); setError(''); setMessage(''); }} className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${mode === 'signup' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500'}`}>Sign Up</button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => { setEmail('admin@company.com'); setPassword('password'); }} className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100">Admin</button>
          <button type="button" onClick={() => { setEmail('badr@company.com'); setPassword('password'); }} className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200">Employee</button>
        </div>

        {(error || message) && (
          <div className={`rounded-2xl p-4 text-sm border ${error ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
            {error || message}
          </div>
        )}

        {mode === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-6">

          <div>
            <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all bg-gray-50/50"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all bg-gray-50/50"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            id="login-button"
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-3.5 rounded-2xl font-medium transition-all disabled:opacity-70 shadow-lg shadow-violet-300/40 hover:shadow-violet-400/50 active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : "Sign In"}
          </button>
        </form>
        ) : (
        <form onSubmit={handleSignup} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input id="first-name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all bg-gray-50/50" required />
            </div>
            <div>
              <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input id="last-name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all bg-gray-50/50" required />
            </div>
          </div>
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all bg-gray-50/50" required />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all bg-gray-50/50" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-3.5 rounded-2xl font-medium transition-all disabled:opacity-70 shadow-lg shadow-violet-300/40 hover:shadow-violet-400/50 active:scale-[0.98]">{loading ? 'Creating account...' : 'Create account'}</button>
        </form>
        )}

        {needsVerification && (
          <form onSubmit={handleVerifyLogin} className="mt-6 space-y-4 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
            <p className="text-sm text-violet-700 font-medium">Enter the 6-character code sent to your email to finish signing in.</p>
            <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.toUpperCase())} className="w-full px-4 py-3 border border-violet-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all bg-white" placeholder="ABC123" required />
            <button type="submit" disabled={loading} className="w-full bg-violet-600 text-white py-3 rounded-2xl font-medium">{loading ? 'Verifying...' : 'Verify code and sign in'}</button>
          </form>
        )}
      </div>
    </div>
  );
}