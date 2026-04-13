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
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      {/* Auth background */}
      <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#5c9360_0%,#23472a_15%,#07120d_40%,#050607_100%)]">
        <div className="absolute left-1/2 top-[118px] h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-black/50 blur-[92px]" />
        <div className="absolute inset-x-0 bottom-0 h-[58%] bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.78)_24%,#050607_100%)]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-9 text-white text-sm z-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold">9:41</span>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3" fill="currentColor" viewBox="0 0 16 12">
            <rect width="14" height="10" x="1" y="1" rx="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
            <rect width="3" height="3" x="2.5" y="3.5" rx="0.5" />
            <rect width="3" height="3" x="6.5" y="3.5" rx="0.5" />
            <rect width="3" height="3" x="10.5" y="3.5" rx="0.5" />
          </svg>
          <svg className="w-3.5 h-3" fill="currentColor" viewBox="0 0 16 12">
            <rect width="14" height="10" x="1" y="1" rx="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
          </svg>
          <div className="flex items-center">
            <svg className="w-5 h-4" fill="none" viewBox="0 0 24 18">
              <rect width="18" height="12" x="1" y="3" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M20 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] bg-yellow-500 text-black px-1 rounded ml-0.5 font-bold">32</span>
          </div>
        </div>
      </div>

      {/* Dynamic Island */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[126px] h-[30px] bg-black rounded-full z-40 shadow-[inset_28px_0_42px_rgba(255,255,255,0.03)]" />

      <div className="min-h-full px-[15px] pb-12 pt-[106px] sm:px-6">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="mb-[84px] flex justify-center"
        >
          <div className="h-[72px] w-[72px]">
            <SembolVariants />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-[24px] text-center"
        >
          <h1 className="text-[22px] font-black leading-none tracking-[-0.04em] text-white">Log In</h1>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-[372px]"
        >
          {/* Email Input */}
          <div className="relative mb-[5px]">
            <div className="absolute left-[18px] top-1/2 z-10 -translate-y-1/2 text-white/68">
              <AtSign className="h-[18px] w-[18px]" />
            </div>
            <input
              type="email"
              placeholder="user@mail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-[54px] w-full rounded-full border border-white/5 bg-[#181a1d]/90 pl-[46px] pr-5 text-[14px] font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_40px_rgba(0,0,0,0.32)] outline-none transition-colors placeholder:text-white/45 focus:border-white/14"
            />
          </div>

          {/* Password Input */}
          <div className="relative mb-[15px]">
            <div className="absolute left-[18px] top-1/2 z-10 -translate-y-1/2 text-white/68">
              <Lock className="h-[18px] w-[18px]" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-[54px] w-full rounded-full border border-white/5 bg-[#181a1d]/90 pl-[46px] pr-14 text-[14px] font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_40px_rgba(0,0,0,0.32)] outline-none transition-colors placeholder:text-white/45 focus:border-white/14"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-[18px] top-1/2 z-10 -translate-y-1/2 text-white/50 transition-colors hover:text-white"
            >
              {showPassword ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
            </button>
          </div>

          {/* Remember me & Forgot password */}
          <div className="mb-[29px] flex items-center justify-between px-[18px]">
            <label className="flex cursor-pointer items-center gap-[9px]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              <span className={`flex h-[19px] w-[19px] items-center justify-center rounded-full border transition-colors ${rememberMe ? 'border-white bg-white' : 'border-white/30 bg-white/10'}`}>
                {rememberMe && <span className="h-2 w-2 rounded-full bg-black" />}
              </span>
              <span className="text-[14px] font-black text-white/52">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-[14px] font-black text-[#ff6367] transition-colors hover:text-[#ff777b]"
            >
              Forgot password?
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Debug Link */}
          <div className="hidden text-center">
            <button
              type="button"
              onClick={() => navigate('/debug-auth')}
              className="text-gray-500 text-xs hover:text-gray-400 underline"
            >
              Having connection issues? Run diagnostics
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="mx-auto block h-[52px] w-[128px] rounded-full bg-white/10 text-[15px] font-black text-white/48 shadow-[0_14px_40px_rgba(0,0,0,0.34)] transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          {/* Sign up link */}
          <p className="pt-[16px] text-center text-[13px] font-black text-white/55">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/account-creation')}
              className="font-black text-white transition-colors hover:text-white/75"
            >
              Sign up here
            </button>
          </p>
        </motion.form>

        {/* Social Login */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mx-auto mt-[78px] w-full max-w-[370px]"
        >
          <p className="mb-[18px] text-center text-[14px] font-black text-white/44">
            Or continue with account
          </p>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => handleSocialLogin('apple')}
              disabled={isLoading}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            </button>
            <button 
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </button>
            <button 
              onClick={() => handleSocialLogin('facebook')}
              disabled={isLoading}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-[22px] h-[22px] text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
}
