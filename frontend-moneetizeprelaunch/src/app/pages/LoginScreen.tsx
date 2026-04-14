import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, AtSign, Lock } from 'lucide-react';
import SembolVariants from '../../imports/SembolVariants';
import { loginUser, signInWithSocialProvider, type SocialAuthProvider } from '../services/authService';
import { completeScratchTeaserFlow, getPostAuthDestination } from '../utils/flowManager';

export function LoginScreen() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log('🔐 Login form submitted');

      // Use the auth service to login the user
      const result = await loginUser(
        formData.email,
        formData.password
      );

      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      console.log('✅ Login successful, navigating to post-auth destination');

      const destination = getPostAuthDestination();

      if (destination === '/profile-screen') {
        completeScratchTeaserFlow();
      }

      navigate(destination);

    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: SocialAuthProvider) => {
    setError(null);
    setIsLoading(true);

    const result = await signInWithSocialProvider(provider, {
      nextPath: getPostAuthDestination(),
    });

    if (!result.success) {
      setError(result.error || `${provider} login failed. Please try again.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(130,201,197,0.12),transparent_28%),linear-gradient(180deg,#10181d_0%,#080a0d_54%,#050607_100%)]" />
      <div className="absolute left-1/2 top-3 z-40 h-[30px] w-[126px] -translate-x-1/2 rounded-full bg-black shadow-[inset_28px_0_42px_rgba(255,255,255,0.03)]" />

      <div className="absolute left-0 right-0 top-0 z-50 flex h-11 items-center justify-between px-9 text-sm text-white">
        <div className="flex items-center gap-2">
          <span className="font-semibold">9:41</span>
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-4 rounded-sm border border-white/80" />
          <div className="h-3 w-4 rounded-sm border border-white/80" />
          <div className="flex items-center">
            <div className="h-4 w-5 rounded-sm border border-white/80" />
            <span className="ml-0.5 rounded bg-yellow-500 px-1 text-[10px] font-bold text-black">32</span>
          </div>
        </div>
      </div>

      <main className="relative z-10 flex h-full items-start justify-center overflow-y-auto px-[15px] pb-12 pt-[64px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="min-h-[640px] w-full max-w-[375px] rounded-[1.55rem] border border-[#7ba4b9]/55 bg-gradient-to-b from-[#182027]/95 via-[#11161b]/95 to-[#0c0d0f]/98 px-5 pb-9 pt-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_26px_90px_rgba(0,0,0,0.56)]"
        >
          <div className="mb-[66px] flex flex-col items-center">
            <div className="flex items-center gap-3">
              <div className="h-[42px] w-[42px]">
                <SembolVariants />
              </div>
              <div className="text-left">
                <p className="text-[25px] font-black leading-none text-white">moneetize</p>
                <p className="text-[13px] font-black leading-none text-[#9bd9cf]">Spend... with benefits</p>
              </div>
            </div>
          </div>

          <h1 className="mb-[70px] text-center text-[22px] font-black leading-none text-white">Log In</h1>

          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[315px]">
            <div className="relative mb-[10px]">
              <AtSign className="absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/62" />
              <input
                type="email"
                placeholder="user@mail.com"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                className="h-[56px] w-full rounded-full border border-white/5 bg-white/[0.075] pl-[50px] pr-5 text-[14px] font-bold text-white outline-none placeholder:text-white/46 focus:border-white/18"
              />
            </div>

            <div className="relative mb-[12px]">
              <Lock className="absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/62" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                className="h-[56px] w-full rounded-full border border-white/5 bg-white/[0.075] pl-[50px] pr-[54px] text-[14px] font-bold text-white outline-none placeholder:text-white/46 focus:border-white/18"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-[18px] top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
              </button>
            </div>

            <div className="mb-[28px] flex items-center justify-between gap-3 pl-[18px]">
              <label className="flex min-w-0 items-center gap-3 text-[13px] font-bold text-white/46">
                <button
                  type="button"
                  onClick={() => setRememberMe((value) => !value)}
                  className={`h-[18px] w-[18px] shrink-0 rounded-full border transition-colors ${
                    rememberMe ? 'border-[#83e6d2] bg-[#83e6d2]' : 'border-white/20 bg-white/8'
                  }`}
                  aria-pressed={rememberMe}
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="shrink-0 text-[12px] font-black text-[#9bd9cf] transition-colors hover:text-white"
              >
                Forgot?
              </button>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-center text-sm font-semibold text-red-200">
                {error}
              </div>
            )}

            <div className="hidden text-center">
              <button
                type="button"
                onClick={() => navigate('/debug-auth')}
                className="text-xs text-gray-500 underline hover:text-gray-400"
              >
                Having connection issues? Run diagnostics
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mx-auto block h-[54px] min-w-[154px] rounded-full bg-gradient-to-r from-[#91ef9a] to-[#78d9f8] px-7 text-[14px] font-black text-[#061011] shadow-[0_18px_44px_rgba(103,232,249,0.18)] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>

            <p className="pt-[28px] text-center text-[13px] font-black text-white/42">
              Don't have an account?{' '}
              <button type="button" onClick={() => navigate('/sign-up')} className="text-white transition-colors hover:text-white/75">
                Sign up here
              </button>
            </p>
          </form>

          <div className="mx-auto mt-8 w-full max-w-[315px]">
            <p className="mb-3 text-center text-[12px] font-black text-white/34">Or continue with account</p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('apple')}
                disabled={isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-[0_10px_26px_rgba(0,0,0,0.32)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Continue with Apple"
              >
                <svg className="h-[21px] w-[21px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_10px_26px_rgba(0,0,0,0.32)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Continue with Google"
              >
                <svg className="h-[21px] w-[21px]" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_10px_26px_rgba(0,0,0,0.32)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Continue with Facebook"
              >
                <svg className="h-[21px] w-[21px] text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
