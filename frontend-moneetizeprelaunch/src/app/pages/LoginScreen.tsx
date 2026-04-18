import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, AtSign, Lock } from 'lucide-react';
import SembolVariants from '../../imports/SembolVariants';
import { loginUser } from '../services/authService';
import { trackInviteAcceptanceFromContext } from '../services/inviteService';
import { completeScratchTeaserFlow, getPostAuthDestination } from '../utils/flowManager';
import { resolveInvitationContext } from '../utils/invitationLinks';

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
      const invitationContext = resolveInvitationContext();
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

      await trackInviteAcceptanceFromContext(invitationContext, typeof window !== 'undefined' ? window.location.href : undefined).catch((trackingError) => {
        console.warn('Invite acceptance tracking skipped after login:', trackingError);
      });

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

        </motion.section>
      </main>
    </div>
  );
}
