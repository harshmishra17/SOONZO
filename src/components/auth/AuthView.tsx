import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { AuthScreen, UserProfile } from '../../types';
import { authApi } from '../../utils/api';

interface AuthViewProps {
  initialScreen?: AuthScreen;
  initialToken?: string;
  onSuccess: (user: UserProfile) => void;
  onContinueAsGuest?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialScreen = 'login',
  initialToken = '',
  onSuccess,
  onContinueAsGuest,
}) => {
  const [screen, setScreen] = useState<AuthScreen>(initialScreen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Recovery & Reset states
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [resetToken, setResetToken] = useState(initialToken);
  const [devEmailLink, setDevEmailLink] = useState<string | null>(null);

  // Clear messages when switching screens
  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
    setDevEmailLink(null);
  }, [screen]);

  // Check URL query parameters for token (e.g. ?token=... or ?verify=... or ?reset=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token') || initialToken;
      if (urlToken) {
        setResetToken(urlToken);
        if (window.location.pathname.includes('verify') || params.get('mode') === 'verify') {
          setScreen('verify_email');
        } else if (window.location.pathname.includes('reset') || params.get('mode') === 'reset') {
          setScreen('reset_password');
        }
      }
    }
  }, [initialToken]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!userId.trim() || !password) {
      setError('Please enter your User ID and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({
        userId: userId.trim(),
        password,
        rememberMe,
      });
      onSuccess(res.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const trimmedUid = userId.trim();
    if (trimmedUid.length < 4 || trimmedUid.length > 24) {
      setError('User ID must be between 4 and 24 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUid)) {
      setError('User ID can only contain letters, numbers, and underscores (e.g., student_42).');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({
        fullName: fullName.trim(),
        userId: trimmedUid,
        email: email.trim(),
        password,
        confirmPassword,
      });

      if (res.devVerificationLink) {
        setDevEmailLink(res.devVerificationLink);
      }

      onSuccess(res.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!recoveryIdentifier.trim()) {
      setError('Please enter your registered email address or User ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(recoveryIdentifier.trim());
      setSuccessMessage(res.message);
      if (res.devResetLink) {
        setDevEmailLink(res.devResetLink);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Recovery request failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!resetToken.trim()) {
      setError('Password reset token is missing. Please use the link sent to your email.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword({
        token: resetToken.trim(),
        newPassword: password,
        confirmPassword,
      });
      setSuccessMessage(res.message);
      setTimeout(() => {
        setScreen('login');
        setPassword('');
        setConfirmPassword('');
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot User ID
  const handleForgotUserId = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Please enter your verified email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotUserId(email.trim());
      setSuccessMessage(res.message);
      if (res.devRecoveredUserId) {
        setDevEmailLink(`Your User ID is: ${res.devRecoveredUserId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'User ID recovery request failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Direct Email Verification (from link or input token)
  const handleVerifyEmail = async (tokenToUse: string) => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const res = await authApi.verifyEmail(tokenToUse);
      setSuccessMessage(res.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 relative z-10">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-sky-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-violet-500/20 text-2xl">
            🎯
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {screen === 'login' && 'Sign in to Soonzo 🔑'}
            {screen === 'register' && 'Create your account 👤'}
            {screen === 'forgot_password' && 'Reset your password 📧'}
            {screen === 'reset_password' && 'Set a new password 🔐'}
            {screen === 'forgot_userid' && 'Recover your User ID 🔍'}
            {screen === 'verify_email' && 'Verify your email ✨'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {screen === 'login' && 'Secure access to your personal student reminders & tasks'}
            {screen === 'register' && 'Organize hackathons, exams, submissions, and goals'}
            {screen === 'forgot_password' && 'Enter your email or User ID to receive a recovery link'}
            {screen === 'reset_password' && 'Enter your new secure password below'}
            {screen === 'forgot_userid' && 'We will send your User ID to your verified email address'}
            {screen === 'verify_email' && 'Confirm your email address to unlock all account capabilities'}
          </p>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Global Success Notice */}
        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Development Helper Preview */}
        {devEmailLink && (
          <div className="mb-4 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-xs text-violet-800 dark:text-violet-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulated Email Notification:</span>
            </div>
            {devEmailLink.startsWith('/') ? (
              <a
                href={devEmailLink}
                onClick={(e) => {
                  e.preventDefault();
                  const tokenMatch = devEmailLink.split('token=')[1];
                  if (devEmailLink.includes('verify')) {
                    handleVerifyEmail(tokenMatch);
                  } else {
                    setResetToken(tokenMatch);
                    setScreen('reset_password');
                  }
                }}
                className="underline font-mono text-[11px] block break-all text-violet-600 dark:text-violet-400 hover:text-violet-800"
              >
                Click to open link directly: {devEmailLink}
              </a>
            ) : (
              <p className="font-mono text-[11px] font-semibold">{devEmailLink}</p>
            )}
          </div>
        )}

        {/* SCREEN 1: LOGIN */}
        {screen === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-sm">
            {/* User ID */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                User ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. alex_dev99"
                  autoComplete="username"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-violet-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setScreen('forgot_password')}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-violet-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot User ID */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-sm border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setScreen('forgot_userid')}
                className="text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400"
              >
                Forgot User ID?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Create account switch */}
            <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => setScreen('register')}
                className="text-violet-600 dark:text-violet-400 hover:underline font-semibold"
              >
                Create account
              </button>
            </div>
          </form>
        )}

        {/* SCREEN 2: REGISTER */}
        {screen === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 text-sm">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-violet-500"
                required
              />
            </div>

            {/* Unique User ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Unique User ID <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">4–24 letters, numbers, _</span>
              </div>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. alex_student"
                  autoComplete="username"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-violet-500"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Case-insensitive, unique handle used to sign in to Soonzo.
              </p>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="student@university.edu"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-violet-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters (passphrases welcome)"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-violet-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-violet-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating your account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="text-violet-600 dark:text-violet-400 hover:underline font-semibold"
              >
                Log in
              </button>
            </div>
          </form>
        )}

        {/* SCREEN 3: FORGOT PASSWORD */}
        {screen === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Registered Email or User ID
              </label>
              <input
                type="text"
                placeholder="Enter your email or User ID"
                value={recoveryIdentifier}
                onChange={(e) => setRecoveryIdentifier(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-violet-500"
                required
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                For security reasons, recovery instructions are sent only to the registered email address.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send Recovery Link</span>}
            </button>

            <div className="text-center pt-2 text-xs">
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* SCREEN 4: RESET PASSWORD */}
        {screen === 'reset_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Reset Token
              </label>
              <input
                type="text"
                placeholder="Paste your reset token"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
            </button>

            <div className="text-center pt-2 text-xs">
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* SCREEN 5: FORGOT USER ID */}
        {screen === 'forgot_userid' && (
          <form onSubmit={handleForgotUserId} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Registered Email Address
              </label>
              <input
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-violet-500"
                required
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                If the email is verified, your unique User ID will be emailed to you immediately.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send User ID</span>}
            </button>

            <div className="text-center pt-2 text-xs">
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* SCREEN 6: VERIFY EMAIL */}
        {screen === 'verify_email' && (
          <div className="space-y-4 text-sm text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Click the button below to verify your email address and activate your account:
            </p>

            <button
              type="button"
              onClick={() => handleVerifyEmail(resetToken)}
              disabled={loading || !resetToken}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify My Email Now</span>
                </>
              )}
            </button>

            <div className="text-center pt-2 text-xs">
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium"
              >
                ← Return to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
